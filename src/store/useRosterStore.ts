import { create } from 'zustand'
import type { Employee, Assignments, EmployeeMonth, EmployeeMonthNotes, ShiftCode, Rule, Notes } from '../types'
import { DEFAULT_RULES } from '../rules'
import { monthKey } from '../utils/date'
import { supabase } from '../lib/supabase'
import { toastError } from './useToastStore'

// ---------------------------------------------------------------------------
// Store strategy
//
// The store mirrors Supabase but never persists locally. Every mutator follows
// the same pattern:
//   1. Snapshot for undo (assignment mutators only).
//   2. Apply the change to local state synchronously so the UI is responsive.
//   3. Fire-and-forget the equivalent change to Supabase. Errors land in the
//      console (no UI toast yet — see CLAUDE.md "Cosas pendientes").
//
// All on-disk dates use ISO `YYYY-MM-DD`; in-memory we keep month 0-indexed
// (matching JS Date conventions) and day 1-indexed. The two `pad`/`parseDay`
// helpers below bridge between the two representations.
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0')

/** Build the ISO date string `assignments.day` expects. `month` is 0-indexed. */
const dateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/** Parse `YYYY-MM-DD` into the 0-indexed month / 1-indexed day used in-memory. */
const parseDay = (s: string): { y: number; m: number; d: number } => {
  const [y, mm, dd] = s.split('-').map(Number)
  return { y, m: mm - 1, d: dd }
}

const logErr = (label: string) =>
  ({ error }: { error: unknown }) => {
    if (error) {
      console.error(label, error)
      toastError(label, error)
    }
  }

interface RosterStore {
  // Server state
  year: number
  month: number
  employees: Employee[]
  byMonth: Assignments
  notesByMonth: Notes
  rules: Rule[]
  customHolidays: Record<string, string> // `${y}-${m}-${d}` -> name
  dayNotes: Record<string, string> // `${y}-${m}-${d}` -> content

  // Loading flags
  loaded: boolean
  loading: boolean
  error: string | null

  // Actions
  loadAll: () => Promise<void>

  setYear: (y: number) => void
  setMonth: (m: number) => void
  prevMonth: () => void
  nextMonth: () => void
  ensureMonth: (year: number, month: number) => void

  setCell: (empId: string, day: number, code: ShiftCode | null) => void
  applyToCells: (cells: { empId: string; day: number }[], code: ShiftCode | null) => void
  replaceMonth: (year: number, month: number, next: EmployeeMonth) => void

  setCellNote: (empId: string, day: number, note: string) => void

  addEmployee: (data: Omit<Employee, 'id' | 'archivedAt'>) => void
  updateEmployee: (id: string, data: Partial<Omit<Employee, 'id'>>) => void
  archiveEmployee: (id: string) => void
  restoreEmployee: (id: string) => void
  removeEmployee: (id: string) => void

  setRules: (rules: Rule[]) => void

  setCustomHoliday: (year: number, month: number, day: number, name: string) => void

  setDayNote: (year: number, month: number, day: number, content: string) => void

  // Undo / Redo (session-scoped local stacks; the persistent audit trail lives
  // in the `change_log` Supabase table).
  undoStack: UndoEntry[]
  redoStack: UndoEntry[]
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

interface UndoEntry {
  year: number
  month: number
  assignments: EmployeeMonth
  notes: EmployeeMonthNotes
}

const UNDO_LIMIT = 50

/** Shallow-clone an EmployeeMonth: top-level keys are new, day records are copied. */
function cloneMonth<T extends Record<string, Record<number, unknown>>>(m: T): T {
  const out = {} as T
  for (const [k, v] of Object.entries(m) as [string, Record<number, unknown>][]) {
    out[k as keyof T] = { ...v } as T[keyof T]
  }
  return out
}

type StoreSet = (
  partial: RosterStore | Partial<RosterStore> | ((s: RosterStore) => RosterStore | Partial<RosterStore>),
) => void

/** Push a snapshot of the given month onto the undo stack, dropping the oldest
 *  if over the limit. Also clears the redo stack — any new edit invalidates
 *  the in-flight redo path, the same way Word and code editors behave. */
function pushUndo(
  set: StoreSet,
  year: number,
  month: number,
  assignments: EmployeeMonth,
  notes: EmployeeMonthNotes,
) {
  const entry: UndoEntry = {
    year, month,
    assignments: cloneMonth(assignments),
    notes: cloneMonth(notes),
  }
  set((s) => ({
    undoStack: [...s.undoStack.slice(-(UNDO_LIMIT - 1)), entry],
    redoStack: [],
  }))
}

// Cached email — populated on auth changes so each log insert is sync.
let cachedUserEmail = ''
supabase.auth.getSession().then(({ data }) => {
  cachedUserEmail = data.session?.user?.email || ''
})
supabase.auth.onAuthStateChange((_e, s) => {
  cachedUserEmail = s?.user?.email || ''
})

/** Append a row to `change_log`. Fire-and-forget — never blocks the UI, and
 *  failures surface as toasts so we don't silently swallow audit gaps. */
function logChange(action: string, detail: Record<string, unknown>) {
  if (!cachedUserEmail) return // pre-auth (e.g. seed) — skip
  supabase
    .from('change_log')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ user_email: cachedUserEmail, action, detail: detail as any })
    .then(logErr('logChange'))
}

interface AssignmentRow { employee_id: string; day: string; shift: ShiftCode; note?: string | null }
interface DeleteRow { employee_id: string; day: string }

/**
 * Compute the upsert/delete operations required to move Supabase from `prev`
 * to `nextMap` for a single month. Optionally diffs notes alongside so a single
 * upsert carries both. Returns rows tagged with ISO date strings.
 */
function diffMonth(
  prev: EmployeeMonth,
  nextMap: EmployeeMonth,
  year: number,
  month: number,
  prevNotes?: EmployeeMonthNotes,
  nextNotes?: EmployeeMonthNotes,
): { upserts: AssignmentRow[]; deletes: DeleteRow[] } {
  const upserts: AssignmentRow[] = []
  const deletes: DeleteRow[] = []
  const kept = new Set<string>()
  for (const [empId, days] of Object.entries(nextMap)) {
    for (const [dStr, shift] of Object.entries(days)) {
      const d = Number(dStr)
      kept.add(`${empId}:${d}`)
      const prevShift = prev[empId]?.[d]
      const prevNote = prevNotes?.[empId]?.[d]
      const nextNote = nextNotes?.[empId]?.[d]
      if (prevShift !== shift || prevNote !== nextNote) {
        const row: AssignmentRow = { employee_id: empId, day: dateStr(year, month, d), shift }
        if (nextNotes !== undefined) row.note = nextNote ?? null
        upserts.push(row)
      }
    }
  }
  for (const [empId, days] of Object.entries(prev)) {
    for (const dStr of Object.keys(days)) {
      const d = Number(dStr)
      if (!kept.has(`${empId}:${d}`)) {
        deletes.push({ employee_id: empId, day: dateStr(year, month, d) })
      }
    }
  }
  return { upserts, deletes }
}

/** Apply a precomputed diff to Supabase (fire-and-forget, errors logged). */
function syncDiff(upserts: AssignmentRow[], deletes: DeleteRow[], label: string) {
  if (upserts.length) {
    supabase.from('assignments').upsert(upserts, { onConflict: 'employee_id,day' })
      .then(logErr(`${label} upsert`))
  }
  if (deletes.length) {
    Promise.all(deletes.map((d) => supabase.from('assignments').delete().match(d)))
      .then((rs) => rs.forEach((r) => {
        if (r.error) { console.error(`${label} delete`, r.error); toastError(`${label} delete`, r.error) }
      }))
  }
}

const bootTime = new Date()

export const useRosterStore = create<RosterStore>()((set, get) => ({
  year: bootTime.getFullYear(),
  month: bootTime.getMonth(),
  employees: [],
  byMonth: {},
  notesByMonth: {},
  rules: DEFAULT_RULES,
  customHolidays: {},
  dayNotes: {},
  loaded: false,
  loading: false,
  error: null,
  undoStack: [],
  redoStack: [],

  canUndo() { return get().undoStack.length > 0 },
  canRedo() { return get().redoStack.length > 0 },

  undo() {
    // Pop the last entry, swap local state to it, and sync the resulting diff
    // (vs. what's currently on Supabase) back to the server. Notes ride along
    // on the same upsert so a single round-trip restores both. The current
    // (pre-undo) state is pushed to the redo stack so the user can step
    // forward again.
    const stack = get().undoStack
    if (!stack.length) return
    const last = stack[stack.length - 1]
    const k = monthKey(last.year, last.month)
    const prevAssign = get().byMonth[k] || {}
    const prevNotes = get().notesByMonth[k] || {}
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [
        ...s.redoStack.slice(-(UNDO_LIMIT - 1)),
        { year: last.year, month: last.month, assignments: cloneMonth(prevAssign), notes: cloneMonth(prevNotes) },
      ],
      byMonth: { ...s.byMonth, [k]: last.assignments },
      notesByMonth: { ...s.notesByMonth, [k]: last.notes },
    }))
    const { upserts, deletes } = diffMonth(
      prevAssign, last.assignments, last.year, last.month, prevNotes, last.notes,
    )
    syncDiff(upserts, deletes, 'undo')
    logChange('undo', { year: last.year, month: last.month })
  },

  redo() {
    const stack = get().redoStack
    if (!stack.length) return
    const next = stack[stack.length - 1]
    const k = monthKey(next.year, next.month)
    const prevAssign = get().byMonth[k] || {}
    const prevNotes = get().notesByMonth[k] || {}
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [
        ...s.undoStack.slice(-(UNDO_LIMIT - 1)),
        { year: next.year, month: next.month, assignments: cloneMonth(prevAssign), notes: cloneMonth(prevNotes) },
      ],
      byMonth: { ...s.byMonth, [k]: next.assignments },
      notesByMonth: { ...s.notesByMonth, [k]: next.notes },
    }))
    const { upserts, deletes } = diffMonth(
      prevAssign, next.assignments, next.year, next.month, prevNotes, next.notes,
    )
    syncDiff(upserts, deletes, 'redo')
    logChange('redo', { year: next.year, month: next.month })
  },

  async loadAll() {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const [emps, assigns, holidays, rules, dayNotesRes] = await Promise.all([
        supabase.from('employees').select('*').order('name'),
        supabase.from('assignments').select('*'),
        supabase.from('holidays').select('*').eq('kind', 'local'),
        supabase.from('rules').select('*'),
        supabase.from('day_notes').select('*'),
      ])
      if (emps.error) throw emps.error
      if (assigns.error) throw assigns.error
      if (holidays.error) throw holidays.error
      if (rules.error) throw rules.error
      if (dayNotesRes.error) throw dayNotesRes.error

      const employees: Employee[] = (emps.data || []).map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        base: e.base,
        avatarColor: e.avatar_color,
        vacationBalance: e.vacation_balance ?? 30,
        archivedAt: e.archived_at,
      }))

      const byMonth: Assignments = {}
      const notesByMonth: Notes = {}
      for (const row of assigns.data || []) {
        const { y, m, d } = parseDay(row.day)
        const k = monthKey(y, m)
        if (!byMonth[k]) byMonth[k] = {}
        if (!byMonth[k][row.employee_id]) byMonth[k][row.employee_id] = {}
        byMonth[k][row.employee_id][d] = row.shift
        if (row.note) {
          if (!notesByMonth[k]) notesByMonth[k] = {}
          if (!notesByMonth[k][row.employee_id]) notesByMonth[k][row.employee_id] = {}
          notesByMonth[k][row.employee_id][d] = row.note
        }
      }

      const customHolidays: Record<string, string> = {}
      for (const h of holidays.data || []) {
        const { y, m, d } = parseDay(h.day)
        customHolidays[`${y}-${m}-${d}`] = h.name
      }

      // Merge persisted rule config into defaults (keeps name/description from code).
      const cfgById = new Map((rules.data || []).map((r) => [r.id, r]))
      const mergedRules = DEFAULT_RULES.map((r) => {
        const cfg = cfgById.get(r.id)
        if (!cfg) return r
        return { ...r, enabled: cfg.enabled, value: cfg.value ?? r.value }
      })

      const dayNotes: Record<string, string> = {}
      for (const row of dayNotesRes.data || []) {
        const { y, m, d } = parseDay(row.day)
        dayNotes[`${y}-${m}-${d}`] = row.content
      }

      set({
        employees,
        byMonth,
        notesByMonth,
        customHolidays,
        dayNotes,
        rules: mergedRules,
        loaded: true,
        loading: false,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cargando datos'
      set({ loading: false, error: msg })
      toastError('Carga inicial', err)
    }
  },

  setYear(y) { set({ year: y }); get().ensureMonth(y, get().month) },
  setMonth(m) { set({ month: m }); get().ensureMonth(get().year, m) },

  prevMonth() {
    const { year, month } = get()
    const ny = month === 0 ? year - 1 : year
    const nm = month === 0 ? 11 : month - 1
    set({ year: ny, month: nm })
    get().ensureMonth(ny, nm)
  },
  nextMonth() {
    const { year, month } = get()
    const ny = month === 11 ? year + 1 : year
    const nm = month === 11 ? 0 : month + 1
    set({ year: ny, month: nm })
    get().ensureMonth(ny, nm)
  },

  ensureMonth(year, month) {
    const k = monthKey(year, month)
    const { byMonth } = get()
    if (byMonth[k]) return
    set({ byMonth: { ...byMonth, [k]: {} } })
  },

  setCell(empId, day, code) {
    const { year, month, byMonth, notesByMonth } = get()
    const k = monthKey(year, month)
    const cur = byMonth[k] || {}
    pushUndo(set, year, month, cur, notesByMonth[k] || {})
    const empMap = { ...(cur[empId] || {}) }
    const prevShift = empMap[day]
    if (code == null) delete empMap[day]
    else empMap[day] = code
    set({ byMonth: { ...byMonth, [k]: { ...cur, [empId]: empMap } } })

    const day_ = dateStr(year, month, day)
    if (code == null) {
      supabase.from('assignments').delete().match({ employee_id: empId, day: day_ }).then(logErr('setCell delete'))
    } else if (prevShift !== code) {
      supabase.from('assignments')
        .upsert({ employee_id: empId, day: day_, shift: code }, { onConflict: 'employee_id,day' })
        .then(logErr('setCell upsert'))
    }
    logChange('setCell', { empId, day, year, month, from: prevShift ?? null, to: code })
  },

  applyToCells(cells, code) {
    if (cells.length === 0) return
    const { year, month, byMonth, notesByMonth } = get()
    const k = monthKey(year, month)
    const cur = byMonth[k] || {}
    pushUndo(set, year, month, cur, notesByMonth[k] || {})
    const next: EmployeeMonth = { ...cur }
    cells.forEach(({ empId, day }) => {
      const empMap = { ...(next[empId] || {}) }
      if (code == null) delete empMap[day]
      else empMap[day] = code
      next[empId] = empMap
    })
    set({ byMonth: { ...byMonth, [k]: next } })

    if (code == null) {
      const rows = cells.map((c) => ({ employee_id: c.empId, day: dateStr(year, month, c.day) }))
      Promise.all(rows.map((r) => supabase.from('assignments').delete().match(r)))
        .then((rs) => rs.forEach((r) => {
          if (r.error) { console.error('applyToCells delete', r.error); toastError('applyToCells delete', r.error) }
        }))
    } else {
      const rows = cells.map((c) => ({ employee_id: c.empId, day: dateStr(year, month, c.day), shift: code }))
      supabase.from('assignments').upsert(rows, { onConflict: 'employee_id,day' })
        .then(logErr('applyToCells upsert'))
    }
    logChange('applyToCells', { year, month, code, count: cells.length })
  },

  replaceMonth(year, month, nextMap) {
    const k = monthKey(year, month)
    const prev = get().byMonth[k] || {}
    pushUndo(set, year, month, prev, get().notesByMonth[k] || {})
    set((s) => ({ byMonth: { ...s.byMonth, [k]: nextMap } }))
    const { upserts, deletes } = diffMonth(prev, nextMap, year, month)
    syncDiff(upserts, deletes, 'replaceMonth')
    logChange('replaceMonth', { year, month, cellCount: upserts.length, removed: deletes.length })
  },

  setCellNote(empId, day, note) {
    // Notes live in the `note` column of `assignments`. The PK is
    // (employee_id, day) and `shift` is NOT NULL, so a note can only attach to
    // a cell that already has a shift. We bail before mutating local state if
    // there's no shift — otherwise the UI would show a note that never
    // persists and disappears on the next reload.
    const { year, month, notesByMonth, byMonth } = get()
    const k = monthKey(year, month)
    const trimmed = note.trim()
    const hasShift = !!byMonth[k]?.[empId]?.[day]
    if (!hasShift && trimmed) {
      toastError('Nota', 'Asigna un turno antes de añadir una nota.')
      return
    }
    const curNotes = notesByMonth[k] || {}
    pushUndo(set, year, month, byMonth[k] || {}, curNotes)
    const empNotes = { ...(curNotes[empId] || {}) }
    if (!trimmed) delete empNotes[day]
    else empNotes[day] = trimmed
    set({ notesByMonth: { ...notesByMonth, [k]: { ...curNotes, [empId]: empNotes } } })

    if (hasShift) {
      supabase.from('assignments')
        .update({ note: trimmed || null })
        .match({ employee_id: empId, day: dateStr(year, month, day) })
        .then(logErr('setCellNote update'))
    }
    logChange('setCellNote', { empId, day, year, month, cleared: !trimmed })
  },

  addEmployee(data) {
    // Optimistic insert: we stage the row under a temporary id so the UI can
    // render it immediately, then swap to the real DB id once Supabase replies.
    // On failure the temp row is rolled back. We can't preassign the UUID
    // client-side because the column has a server-side default.
    // The list is kept alphabetical so a new hire lands in their natural slot
    // without a manual refresh.
    // crypto.randomUUID() (not Date.now()) so two rapid additions can't collide.
    const tempId = 'temp-' + crypto.randomUUID()
    set((s) => ({
      employees: sortByName([...s.employees, { ...data, id: tempId, archivedAt: null }]),
    }))
    supabase
      .from('employees')
      .insert({
        name: data.name,
        role: data.role,
        base: data.base,
        avatar_color: data.avatarColor,
        vacation_balance: data.vacationBalance,
      })
      .select()
      .single()
      .then(({ data: row, error }) => {
        if (error || !row) {
          console.error('addEmployee', error)
          toastError('addEmployee', error)
          set((s) => ({ employees: s.employees.filter((e) => e.id !== tempId) }))
          return
        }
        set((s) => ({
          employees: s.employees.map((e) => (e.id === tempId ? { ...e, id: row.id } : e)),
        }))
      })
    logChange('addEmployee', { name: data.name, role: data.role })
  },

  updateEmployee(id, data) {
    const patch = toEmployeeRow(data)
    if (Object.keys(patch).length === 0) return
    const before = get().employees.find((e) => e.id === id)
    set((s) => ({
      employees: sortByName(s.employees.map((e) => (e.id === id ? { ...e, ...data } : e))),
    }))
    supabase.from('employees').update(patch).eq('id', id).then(logErr('updateEmployee'))
    logChange('updateEmployee', { id, name: before?.name, changes: Object.keys(data) })
  },

  archiveEmployee(id) {
    const before = get().employees.find((e) => e.id === id)
    const at = new Date().toISOString()
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, archivedAt: at } : e)) }))
    supabase.from('employees').update({ archived_at: at }).eq('id', id).then(logErr('archiveEmployee'))
    logChange('archiveEmployee', { id, name: before?.name })
  },

  restoreEmployee(id) {
    const before = get().employees.find((e) => e.id === id)
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, archivedAt: null } : e)) }))
    supabase.from('employees').update({ archived_at: null }).eq('id', id).then(logErr('restoreEmployee'))
    logChange('restoreEmployee', { id, name: before?.name })
  },

  removeEmployee(id) {
    // Hard delete: Supabase cascades to assignments via FK, but we also drop
    // the employee from every cached month — both assignments and notes — so
    // the UI matches without a reload.
    const before = get().employees.find((e) => e.id === id)
    set((s) => {
      const byMonth: Assignments = {}
      for (const [k, m] of Object.entries(s.byMonth)) {
        const trimmed = { ...m }
        delete trimmed[id]
        byMonth[k] = trimmed
      }
      const notesByMonth: Notes = {}
      for (const [k, m] of Object.entries(s.notesByMonth)) {
        const trimmed = { ...m }
        delete trimmed[id]
        notesByMonth[k] = trimmed
      }
      return { employees: s.employees.filter((e) => e.id !== id), byMonth, notesByMonth }
    })
    supabase.from('employees').delete().eq('id', id).then(logErr('removeEmployee'))
    logChange('removeEmployee', { id, name: before?.name })
  },

  setRules(rules) {
    set({ rules })
    const rows = rules.map((r) => ({ id: r.id, enabled: r.enabled, value: r.value }))
    supabase.from('rules').upsert(rows, { onConflict: 'id,owner_id' }).then(logErr('setRules'))
    logChange('setRules', { count: rules.length })
  },

  setDayNote(year, month, day, content) {
    const key = `${year}-${month}-${day}`
    const trimmed = content.trim()
    set((s) => {
      const next = { ...s.dayNotes }
      if (trimmed) next[key] = trimmed
      else delete next[key]
      return { dayNotes: next }
    })
    const iso = dateStr(year, month, day)
    if (trimmed) {
      supabase.from('day_notes').upsert({ day: iso, content: trimmed }, { onConflict: 'day,owner_id' })
        .then(logErr('setDayNote upsert'))
    } else {
      supabase.from('day_notes').delete().eq('day', iso).then(logErr('setDayNote delete'))
    }
    logChange('setDayNote', { year, month, day, cleared: !trimmed })
  },

  setCustomHoliday(year, month, day, name) {
    const key = `${year}-${month}-${day}`
    const trimmed = name.trim()
    set((s) => {
      const next = { ...s.customHolidays }
      if (trimmed) next[key] = trimmed
      else delete next[key]
      return { customHolidays: next }
    })
    const iso = dateStr(year, month, day)
    if (trimmed) {
      supabase.from('holidays').upsert({ day: iso, name: trimmed, kind: 'local' }, { onConflict: 'day,owner_id' })
        .then(logErr('setCustomHoliday upsert'))
    } else {
      supabase.from('holidays').delete().eq('day', iso).then(logErr('setCustomHoliday delete'))
    }
    logChange('setCustomHoliday', { year, month, day, name: trimmed || null })
  },
}))

/** Stable case-insensitive sort by name. Mirrors the order Supabase returns
 *  on load (`order by name`) so the UI stays consistent without a refetch. */
function sortByName(emps: Employee[]): Employee[] {
  return [...emps].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
  )
}

interface EmployeeRow {
  name?: string
  role?: string
  base?: Employee['base']
  avatar_color?: string
  vacation_balance?: number
  archived_at?: string | null
}

/**
 * Map the domain `Employee` (camelCase) onto the Supabase `employees` row
 * (snake_case). Only fields present in `data` end up in the result, so this
 * doubles as both an insert payload builder and a PATCH builder.
 */
function toEmployeeRow(data: Partial<Omit<Employee, 'id'>>): EmployeeRow {
  const out: EmployeeRow = {}
  if (data.name !== undefined) out.name = data.name
  if (data.role !== undefined) out.role = data.role
  if (data.base !== undefined) out.base = data.base
  if (data.avatarColor !== undefined) out.avatar_color = data.avatarColor
  if (data.vacationBalance !== undefined) out.vacation_balance = data.vacationBalance
  if (data.archivedAt !== undefined) out.archived_at = data.archivedAt
  return out
}
