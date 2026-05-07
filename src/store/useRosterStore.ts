import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Employee, Assignments, ShiftCode, Rule, RuleOverride } from '../types'
import { DEFAULT_RULES } from '../rules'
import { SEED_EMPLOYEES, buildSeedAssignments } from '../data/seed'
import { AVATAR_COLORS } from '../constants/shifts'
import { monthKey } from '../utils/date'

function cloneRules(base: Rule[], overrides: Record<string, RuleOverride>): Rule[] {
  return base.map((r) => {
    const ov = overrides[r.id]
    if (!ov) return { ...r, params: { ...r.params } }
    return { ...r, enabled: ov.enabled, params: { ...r.params, ...ov.params } }
  })
}

interface RosterStore {
  // ── state ──
  year: number
  month: number
  employees: Employee[]
  assignments: Assignments
  rules: Rule[]

  // ── month navigation ──
  prevMonth: () => void
  nextMonth: () => void

  // ── assignment management ──
  setAssignment: (empId: string, day: number, code: ShiftCode | null) => void
  clearMonthAssignments: (empId: string) => void

  // ── employee management ──
  addEmployee: (data: Omit<Employee, 'id'>) => void
  updateEmployee: (id: string, data: Partial<Omit<Employee, 'id'>>) => void
  removeEmployee: (id: string) => void

  // ── rules management ──
  toggleRule: (ruleId: string, enabled: boolean) => void
  updateRuleParam: (ruleId: string, key: string, value: number) => void
  resetRules: () => void
}

const now = new Date()

export const useRosterStore = create<RosterStore>()(
  persist(
    (set, get) => ({
      year: now.getFullYear(),
      month: now.getMonth(),
      employees: SEED_EMPLOYEES,
      assignments: buildSeedAssignments(now.getFullYear(), now.getMonth()),
      rules: DEFAULT_RULES.map((r) => ({ ...r, params: { ...r.params } })),

      prevMonth() {
        const { year, month } = get()
        set(month === 0 ? { year: year - 1, month: 11 } : { month: month - 1 })
      },

      nextMonth() {
        const { year, month } = get()
        set(month === 11 ? { year: year + 1, month: 0 } : { month: month + 1 })
      },

      setAssignment(empId, day, code) {
        const { year, month, assignments } = get()
        const k = monthKey(year, month)
        const prev = assignments[k] ?? {}
        const empPrev = prev[empId] ?? {}
        const updated: Record<number, ShiftCode> = { ...empPrev }
        if (code === null) {
          delete updated[day]
        } else {
          updated[day] = code
        }
        set({
          assignments: {
            ...assignments,
            [k]: { ...prev, [empId]: updated },
          },
        })
      },

      clearMonthAssignments(empId) {
        const { year, month, assignments } = get()
        const k = monthKey(year, month)
        const prev = assignments[k] ?? {}
        const next = { ...prev }
        delete next[empId]
        set({ assignments: { ...assignments, [k]: next } })
      },

      addEmployee(data) {
        const color = AVATAR_COLORS[get().employees.length % AVATAR_COLORS.length]
        set((s) => ({
          employees: [...s.employees, { ...data, id: `e${Date.now()}`, avatarColor: data.avatarColor || color }],
        }))
      },

      updateEmployee(id, data) {
        set((s) => ({
          employees: s.employees.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }))
      },

      removeEmployee(id) {
        set((s) => {
          // Remove all assignments for this employee
          const assignments: Assignments = {}
          for (const [k, month] of Object.entries(s.assignments)) {
            const next = { ...month }
            delete next[id]
            assignments[k] = next
          }
          return { employees: s.employees.filter((e) => e.id !== id), assignments }
        })
      },

      toggleRule(ruleId, enabled) {
        set((s) => ({
          rules: s.rules.map((r) => (r.id === ruleId ? { ...r, enabled } : r)),
        }))
      },

      updateRuleParam(ruleId, key, value) {
        set((s) => ({
          rules: s.rules.map((r) =>
            r.id === ruleId ? { ...r, params: { ...r.params, [key]: value } } : r,
          ),
        }))
      },

      resetRules() {
        set({ rules: DEFAULT_RULES.map((r) => ({ ...r, params: { ...r.params } })) })
      },
    }),
    {
      name: 'cuadrante-v1',
      // Only persist the serializable parts; validate functions come from DEFAULT_RULES
      partialize: (s) => ({
        year: s.year,
        month: s.month,
        employees: s.employees,
        assignments: s.assignments,
        ruleOverrides: Object.fromEntries(
          s.rules.map((r) => [r.id, { enabled: r.enabled, params: { ...r.params } }]),
        ),
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as {
          year?: number
          month?: number
          employees?: Employee[]
          assignments?: Assignments
          ruleOverrides?: Record<string, RuleOverride>
        }
        return {
          ...current,
          year: p.year ?? current.year,
          month: p.month ?? current.month,
          employees: p.employees ?? current.employees,
          assignments: p.assignments ?? current.assignments,
          rules: cloneRules(DEFAULT_RULES, p.ruleOverrides ?? {}),
        }
      },
    },
  ),
)
