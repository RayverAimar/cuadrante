import { createPortal } from 'react-dom'
import { SHIFTS, MONTHS_ES, DOW_ES } from '../../../constants/shifts'
import type { Employee, EmployeeMonth, Holiday, ShiftCode } from '../../../types'
import { getDaysInMonth, dowOf } from '../../../utils/date'
import { visibleInMonth } from '../../../utils/employee'
import { HolidaysFooter } from './HolidaysFooter'

interface Props {
  year: number
  month: number
  employees: Employee[]
  /** If set, only these employee IDs are printed (in their natural order).
      Useful when the user picks a subset from MonthlyReportModal. */
  empIds?: string[]
  assignments: EmployeeMonth
  notes: Record<string, Record<number, string>>
  holidayFor: (y: number, m: number, d: number) => Holiday | null
}

/**
 * One A4 landscape page per visible employee. Each page shows:
 *   - centered title "CUADRANTE · PLANILLA DE TURNOS"
 *   - employee name/role + month/year header
 *   - 7-column calendar with full shift word per day (Mañana, Tarde, …)
 *   - holiday triangle marker (top-right of the cell, same shape as the main grid)
 *   - footnote list of every day that has a note attached
 *   - legend + totals at the bottom
 *
 * Portaled to <body> so the print CSS can hide every sibling and leave only
 * this container visible.
 */
export function IndividualSchedulesPrint({
  year, month, employees, empIds, assignments, notes, holidayFor,
}: Props) {
  const dim = getDaysInMonth(year, month)
  const base = visibleInMonth(employees, assignments)
  const visible = empIds ? base.filter((e) => empIds.includes(e.id)) : base

  return createPortal(
    <div className="cdr-individuals-print">
      {visible.map((emp) => {
        const counts: Record<ShiftCode, number> = { M: 0, T: 0, N: 0, V: 0, L: 0, D: 0 }
        for (let d = 1; d <= dim; d++) {
          const c = assignments[emp.id]?.[d]
          if (c) counts[c]++
        }
        const hours = (counts.M + counts.T + counts.N) * 8

        const firstDow = dowOf(year, month, 1)
        const cells: Array<{ day: number | null }> = []
        for (let i = 0; i < firstDow; i++) cells.push({ day: null })
        for (let d = 1; d <= dim; d++) cells.push({ day: d })
        while (cells.length % 7 !== 0) cells.push({ day: null })

        // Footnotes: days with a note attached, in calendar order.
        const empNotes = notes[emp.id] || {}
        const noteDays = Object.keys(empNotes)
          .map((s) => parseInt(s, 10))
          .filter((d) => empNotes[d]?.trim())
          .sort((a, b) => a - b)

        return (
          <section key={emp.id} className="cdr-emp-page">
            <div className="cdr-emp-page__title">CUADRANTE · PLANILLA DE TURNOS</div>

            <header className="cdr-emp-page__hd">
              <div>
                <div className="cdr-emp-page__name">{emp.name}</div>
                <div className="cdr-emp-page__role">{emp.role}</div>
              </div>
              <div className="cdr-emp-page__month">
                {MONTHS_ES[month]} <span style={{ fontStyle: 'italic', opacity: 0.6 }}>{year}</span>
              </div>
            </header>

            <div className="cdr-emp-page__cal">
              {DOW_ES.map((d) => (
                <div key={d} className="cdr-emp-page__dow">{d}</div>
              ))}
              {cells.map((cell, i) => {
                if (cell.day === null) return <div key={i} className="cdr-emp-page__cell cdr-emp-page__cell--empty" />
                const code = assignments[emp.id]?.[cell.day]
                const hol = holidayFor(year, month, cell.day)
                const hasNote = !!empNotes[cell.day]?.trim()
                return (
                  <div
                    key={i}
                    className="cdr-emp-page__cell"
                    style={code ? { background: `var(--${code}-bg)`, color: `var(--${code}-fg)` } : undefined}
                  >
                    <span className="cdr-emp-page__day">{cell.day}</span>
                    {code && <span className="cdr-emp-page__shift">{SHIFTS[code].label}</span>}
                    {hol && <span className="cdr-emp-page__hol" title={hol.name} />}
                    {hasNote && <span className="cdr-emp-page__note-tri" aria-hidden />}
                  </div>
                )
              })}
            </div>

            <HolidaysFooter year={year} month={month} holidayFor={holidayFor} className="cdr-emp-page__hols" />

            {noteDays.length > 0 && (
              <div className="cdr-emp-page__notes">
                <div className="cdr-emp-page__notes-hd">NOTAS</div>
                <ol className="cdr-emp-page__notes-list">
                  {noteDays.map((d) => (
                    <li key={d}>
                      <span className="cdr-emp-page__notes-day">Día {d}</span>
                      <span className="cdr-emp-page__notes-text">{empNotes[d]}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <footer className="cdr-emp-page__ft">
              <div className="cdr-emp-page__legend">
                {(['M', 'T', 'N', 'V', 'L', 'D'] as ShiftCode[]).map((c) => (
                  <span key={c} className="cdr-emp-page__legend-item">
                    <span
                      className="cdr-emp-page__chip"
                      style={{ background: `var(--${c}-bg)`, color: `var(--${c}-fg)` }}
                    >
                      {c}
                    </span>
                    <span>{SHIFTS[c].label}</span>
                    <strong>{counts[c]}</strong>
                  </span>
                ))}
              </div>
              <div className="cdr-emp-page__totals">
                <span>HORAS</span>
                <strong>{hours}h</strong>
              </div>
            </footer>
          </section>
        )
      })}
    </div>,
    document.body,
  )
}
