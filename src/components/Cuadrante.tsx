import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRosterStore } from '../store/useRosterStore'
import { validate } from '../rules'
import type { ShiftCode, Holiday } from '../types'
import { getDaysInMonth, monthKey } from '../utils/date'
import { autoFill } from '../utils/autoFill'
import { nationalHoliday } from '../data/holidays'
import { buildMatrix, exportCSV, exportXLS, exportPDF } from '../utils/export'
import { printWithBodyClass } from '../utils/print'
import { visibleInMonth } from '../utils/employee'
import { TopBar } from './cuadrante/TopBar'
import { FilterBar } from './cuadrante/FilterBar'
import { PrintHeader } from './cuadrante/print/PrintHeader'
import { RosterGrid } from './cuadrante/RosterGrid'
import { SidePanel } from './cuadrante/SidePanel'
import { SelectionActionBar } from './cuadrante/SelectionActionBar'
import { EmployeesModal } from './modals/EmployeesModal'
import { RulesModal } from './modals/RulesModal'
import { HelpModal } from './modals/HelpModal'
import { AutoFillModal } from './modals/AutoFillModal'
import { CopyMonthModal } from './modals/CopyMonthModal'
import { DaySummary } from './modals/DaySummary'
import { NoteModal } from './modals/NoteModal'
import { MonthlyReportModal } from './modals/MonthlyReportModal'
import { DataModal } from './modals/DataModal'
import { HistoryModal } from './modals/HistoryModal'
import { IndividualSchedulesPrint } from './cuadrante/print/IndividualSchedulesPrint'
import { YearRosterPrint } from './cuadrante/print/YearRosterPrint'
import { NotesFooter } from './cuadrante/print/NotesFooter'
import { HolidaysFooter } from './cuadrante/print/HolidaysFooter'

export function Cuadrante() {
  const {
    year, month, employees, rules, byMonth, notesByMonth, customHolidays,
    prevMonth, nextMonth, setYear, setMonth,
    applyToCells, replaceMonth, setCellNote, undo, redo,
  } = useRosterStore()
  const undoCount = useRosterStore((s) => s.undoStack.length)
  const redoCount = useRosterStore((s) => s.redoStack.length)

  const k = monthKey(year, month)
  const assignments = byMonth[k] || {}
  const notes = notesByMonth[k] || {}
  const dim = getDaysInMonth(year, month)

  // UI-only local state
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const dragRef = useRef({ active: false, additive: false, startEmp: '', startDay: 0, base: new Set<string>() })
  const [showEmps, setShowEmps] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showAutoFill, setShowAutoFill] = useState(false)
  const [showCopyMonth, setShowCopyMonth] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showData, setShowData] = useState(false)
  // null = not printing; [] would mean "print zero" (disallowed in UI).
  const [printIndividuals, setPrintIndividuals] = useState<string[] | null>(null)
  const [printYear, setPrintYear] = useState<number | null>(null)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [daySummary, setDaySummary] = useState<number | null>(null)
  const [editingNote, setEditingNote] = useState<{ empId: string; day: number } | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  // Anchor for the floating SelectionActionBar — captures the last cell the
  // user touched so the bar can position itself next to it instead of floating
  // at the viewport bottom.
  const [anchorRect, setAnchorRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  const holidayFor = useCallback(
    (y: number, m: number, d: number): Holiday | null => {
      const custom = customHolidays[`${y}-${m}-${d}`]
      if (custom) return { name: custom, kind: 'local' }
      const nat = nationalHoliday(y, m, d)
      if (nat) return { name: nat, kind: 'national' }
      return null
    },
    [customHolidays],
  )

  const visibleEmployees = useMemo(() => {
    return visibleInMonth(employees, assignments).filter((e) => {
      if (filterRole !== 'all' && e.role !== filterRole) return false
      if (search.trim() && !e.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [employees, assignments, filterRole, search])

  const issues = useMemo(
    () => validate(employees, assignments, rules, year, month),
    [employees, assignments, rules, year, month],
  )

  const errorCells = useMemo(() => {
    const set = new Set<string>()
    issues.forEach((i) => {
      if (i.empId && i.day) set.add(`${i.empId}:${i.day}`)
    })
    return set
  }, [issues])

  const errCount = issues.filter((i) => i.level === 'error').length
  const warnCount = issues.filter((i) => i.level === 'warn').length

  const minPerShift = rules.find((r) => r.id === 'minPerShift')
  const minVal = minPerShift?.enabled ? minPerShift.value ?? 0 : 0

  const coverage = useMemo(() => {
    const out: Record<ShiftCode, Record<number, number>> = { M: {}, T: {}, N: {}, V: {}, L: {}, D: {} }
    for (let d = 1; d <= dim; d++) {
      employees.forEach((e) => {
        const c = assignments[e.id]?.[d]
        if (c) out[c][d] = (out[c][d] || 0) + 1
      })
    }
    return out
  }, [employees, assignments, dim])

  const applyShiftToSelection = useCallback(
    (code: ShiftCode | null) => {
      if (selection.size === 0) return
      const cells = Array.from(selection).map((key) => {
        const [empId, dayStr] = key.split(':')
        return { empId, day: parseInt(dayStr, 10) }
      })
      applyToCells(cells, code)
    },
    [selection, applyToCells],
  )

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && target.matches('input, textarea, select')) return
      // Undo/Redo: ⌘Z and ⌘⇧Z (also ⌘Y on Windows-style users)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
        return
      }
      if ((e.metaKey || e.ctrlKey) && (
        (e.shiftKey && e.key.toLowerCase() === 'z') ||
        (!e.shiftKey && e.key.toLowerCase() === 'y')
      )) {
        e.preventDefault()
        redo()
        return
      }
      const upper = e.key.toUpperCase()
      if (selection.size > 0 && ['M', 'T', 'N', 'V', 'L', 'D'].includes(upper)) {
        applyShiftToSelection(upper as ShiftCode)
        e.preventDefault()
      } else if (selection.size > 0 && (e.key === 'Backspace' || e.key === 'Delete')) {
        applyShiftToSelection(null)
        e.preventDefault()
      } else if (e.key === 'Escape' && selection.size > 0) {
        setSelection(new Set())
      } else if (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey || e.altKey)) {
        prevMonth()
      } else if (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey || e.altKey)) {
        nextMonth()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selection, applyShiftToSelection, prevMonth, nextMonth, undo, redo])

  const computeRectSelection = useCallback(
    (startEmp: string, startDay: number, endEmp: string, endDay: number, base: Set<string>) => {
      const list = visibleEmployees
      const idA = list.findIndex((e) => e.id === startEmp)
      const idB = list.findIndex((e) => e.id === endEmp)
      if (idA < 0 || idB < 0) return new Set(base)
      const r0 = Math.min(idA, idB), r1 = Math.max(idA, idB)
      const d0 = Math.min(startDay, endDay), d1 = Math.max(startDay, endDay)
      const out = new Set(base)
      for (let r = r0; r <= r1; r++) {
        const emp = list[r]
        for (let d = d0; d <= d1; d++) out.add(`${emp.id}:${d}`)
      }
      return out
    },
    [visibleEmployees],
  )

  const onCellMouseDown = (empId: string, day: number, e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const additive = e.shiftKey || e.metaKey || e.ctrlKey
    const base = additive ? new Set(selection) : new Set<string>()
    dragRef.current = { active: true, additive, startEmp: empId, startDay: day, base }
    const next = new Set(base)
    next.add(`${empId}:${day}`)
    setSelection(next)
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setAnchorRect({ x: r.left, y: r.top, w: r.width, h: r.height })
  }
  const onCellEnter = (empId: string, day: number, target?: HTMLElement) => {
    const p = dragRef.current
    if (!p.active) return
    setSelection(computeRectSelection(p.startEmp, p.startDay, empId, day, p.base))
    if (target) {
      const r = target.getBoundingClientRect()
      setAnchorRect({ x: r.left, y: r.top, w: r.width, h: r.height })
    }
  }
  useEffect(() => {
    const up = () => { dragRef.current.active = false }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  // Drop the anchor when the selection is emptied so the next selection starts
  // from a fresh position.
  useEffect(() => {
    if (selection.size === 0) setAnchorRect(null)
  }, [selection.size])

  // Click anywhere outside a selectable cell or the floating action bar
  // clears the current selection. We exclude open modals/popovers so clicks
  // inside them don't reset the user's grid context.
  useEffect(() => {
    if (selection.size === 0) return
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      if (t.closest('[data-cdr-cell]')) return
      if (t.closest('.cdr-action-bar')) return
      if (t.closest('[data-cdr-modal-root]')) return
      setSelection(new Set())
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [selection.size])

  const handleExportCSV = () =>
    exportCSV(buildMatrix(employees, assignments, coverage, year, month), year, month)
  const handleExportXLS = () =>
    exportXLS(buildMatrix(employees, assignments, coverage, year, month), year, month)

  // Year PDF: DataModal dispatches `cdr:print-year` after closing. We mount
  // <YearRosterPrint /> via state, then printWithBodyClass handles the toggle.
  useEffect(() => {
    const onPrintYear = (e: Event) => {
      const detail = (e as CustomEvent<{ year: number }>).detail
      setPrintYear(detail.year)
      printWithBodyClass('cdr-printing-year', { onAfterPrint: () => setPrintYear(null) })
    }
    window.addEventListener('cdr:print-year', onPrintYear)
    return () => window.removeEventListener('cdr:print-year', onPrintYear)
  }, [])

  const handlePrintIndividuals = useCallback((empIds: string[]) => {
    if (empIds.length === 0) return
    setShowReport(false)
    setPrintIndividuals(empIds)
    printWithBodyClass('cdr-printing-individuals', { onAfterPrint: () => setPrintIndividuals(null) })
  }, [])

  const handleAutoFillApply = (newAssignments: typeof assignments) => {
    replaceMonth(year, month, newAssignments)
    setShowAutoFill(false)
  }

  // Only compute the autoFill preview when the modal is open — the algorithm
  // is heavy and would otherwise re-run on every keystroke in the search box.
  const autoFillPreview = useMemo(
    () => (showAutoFill ? autoFill(employees, assignments, rules, year, month) : null),
    [showAutoFill, employees, assignments, rules, year, month],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--paper)', overflow: 'hidden' }}>
      <TopBar
        year={year}
        month={month}
        setYear={setYear}
        setMonth={setMonth}
        onPrev={prevMonth}
        onNext={nextMonth}
        onEmps={() => setShowEmps(true)}
        onRules={() => setShowRules(true)}
        onHelp={() => setShowHelp(true)}
        onReport={() => setShowReport(true)}
        onData={() => setShowData(true)}
        onAutoFill={() => setShowAutoFill(true)}
        onCopyMonth={() => setShowCopyMonth(true)}
        onExportCSV={handleExportCSV}
        onExportXLS={handleExportXLS}
        onExportPDF={exportPDF}
        errCount={errCount}
        warnCount={warnCount}
        onToggleValidation={() => setShowValidation((v) => !v)}
        onUndo={undo}
        onRedo={redo}
        onHistory={() => setShowHistory(true)}
        canUndo={undoCount > 0}
        canRedo={redoCount > 0}
      />

      <FilterBar
        employees={employees}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        search={search}
        setSearch={setSearch}
        visibleCount={visibleEmployees.length}
        totalCount={employees.length}
      />

      <div className="cdr-app-body">
        <PrintHeader year={year} month={month} employeeCount={visibleEmployees.length} />
        <RosterGrid
          year={year}
          month={month}
          dim={dim}
          employees={visibleEmployees}
          assignments={assignments}
          notes={notes}
          minVal={minVal}
          coverage={coverage}
          errorCells={errorCells}
          holidayFor={holidayFor}
          selection={selection}
          onDayClick={(d) => setDaySummary(d)}
          onCellMouseDown={onCellMouseDown}
          onCellEnter={onCellEnter}
          onCellContext={(empId, day) => setEditingNote({ empId, day })}
        />
        <SidePanel
          issues={issues}
          employees={employees}
          coverage={coverage}
          dim={dim}
          open={showValidation}
          onClose={() => setShowValidation(false)}
        />
        <HolidaysFooter year={year} month={month} holidayFor={holidayFor} printOnly />
        <NotesFooter employees={visibleEmployees} notes={notes} />
      </div>

      {showEmps && <EmployeesModal open={showEmps} onClose={() => setShowEmps(false)} />}
      {showRules && <RulesModal open={showRules} onClose={() => setShowRules(false)} />}
      {showHelp && <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />}
      {showCopyMonth && <CopyMonthModal open onClose={() => setShowCopyMonth(false)} />}
      {showReport && (
        <MonthlyReportModal
          open
          year={year}
          month={month}
          employees={employees}
          assignments={assignments}
          onClose={() => setShowReport(false)}
          onIndividualPDFs={handlePrintIndividuals}
        />
      )}
      {showData && <DataModal open onClose={() => setShowData(false)} />}
      {showHistory && <HistoryModal open onClose={() => setShowHistory(false)} />}
      {printIndividuals && (
        <IndividualSchedulesPrint
          year={year}
          month={month}
          employees={employees}
          empIds={printIndividuals}
          assignments={assignments}
          notes={notes}
          holidayFor={holidayFor}
        />
      )}
      {printYear !== null && (
        <YearRosterPrint
          year={printYear}
          employees={employees}
          byMonth={byMonth}
          notesByMonth={notesByMonth}
          holidayFor={holidayFor}
        />
      )}

      {showAutoFill && (
        <AutoFillModal
          open={showAutoFill}
          year={year}
          month={month}
          employees={employees}
          assignments={assignments}
          preview={autoFillPreview!}
          onClose={() => setShowAutoFill(false)}
          onApply={handleAutoFillApply}
        />
      )}
      {editingNote && (() => {
        const emp = employees.find((e) => e.id === editingNote.empId)
        if (!emp) return null
        return (
          <NoteModal
            open
            employee={emp}
            day={editingNote.day}
            shift={assignments[editingNote.empId]?.[editingNote.day]}
            initialNote={notes[editingNote.empId]?.[editingNote.day] || ''}
            onSave={(note) => setCellNote(editingNote.empId, editingNote.day, note)}
            onClose={() => setEditingNote(null)}
          />
        )
      })()}

      {daySummary !== null && (
        <DaySummary
          day={daySummary}
          year={year}
          month={month}
          employees={employees}
          assignments={assignments}
          holidayFor={holidayFor}
          onClose={() => setDaySummary(null)}
        />
      )}

      {selection.size > 0 && (
        <SelectionActionBar
          count={selection.size}
          onPick={(code) => applyShiftToSelection(code)}
          onClear={() => applyShiftToSelection(null)}
          onDismiss={() => { setSelection(new Set()); setAnchorRect(null) }}
          anchor={anchorRect}
        />
      )}
    </div>
  )
}
