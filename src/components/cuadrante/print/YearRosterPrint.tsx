import { createPortal } from 'react-dom'
import { MONTHS_ES, DOW_ES } from '../../../constants/shifts'
import type { Employee, EmployeeMonth, Holiday, ShiftCode } from '../../../types'
import { dowOf, getDaysInMonth, isWeekend, monthKey } from '../../../utils/date'
import { visibleInMonth } from '../../../utils/employee'
import { HolidaysFooter } from './HolidaysFooter'

interface Props {
  year: number
  employees: Employee[]
  byMonth: Record<string, EmployeeMonth>
  notesByMonth: Record<string, Record<string, Record<number, string>>>
  holidayFor: (y: number, m: number, d: number) => Holiday | null
}

/**
 * Year PDF: 12 landscape A4 pages, one per month, in the same compact layout
 * as the monthly print. Renders flat HTML (no Tooltips / hover) so it stays
 * cheap to mount transiently during print.
 *
 * Portaled to <body> and gated by body.cdr-printing-year so the rest of the
 * app is hidden during the print preview.
 */
export function YearRosterPrint({ year, employees, byMonth, notesByMonth, holidayFor }: Props) {
  return createPortal(
    <div className="cdr-year-print">
      {Array.from({ length: 12 }, (_, m) => m).map((m) => {
        const k = monthKey(year, m)
        const assignments = byMonth[k] || {}
        const notes = notesByMonth[k] || {}
        const dim = getDaysInMonth(year, m)

        const visible = visibleInMonth(employees, assignments)

        const coverage: Record<ShiftCode, Record<number, number>> = { M: {}, T: {}, N: {}, V: {}, L: {}, D: {} }
        for (let d = 1; d <= dim; d++) {
          visible.forEach((e) => {
            const c = assignments[e.id]?.[d]
            if (c) coverage[c][d] = (coverage[c][d] || 0) + 1
          })
        }

        return (
          <section key={m} className="cdr-year-page">
            <header className="cdr-year-page__hd">
              <div>
                <div className="cdr-year-page__eyebrow">CUADRANTE · PLANIFICACIÓN DE TURNOS</div>
                <h1 className="cdr-year-page__title">
                  {MONTHS_ES[m]} <span style={{ fontStyle: 'italic', opacity: 0.6 }}>{year}</span>
                </h1>
              </div>
              <div className="cdr-year-page__meta">
                <span>{visible.length} EMPLEADOS</span>
              </div>
            </header>

            <table className="cdr-year-page__tbl">
              <thead>
                <tr>
                  <th>EMPLEADO</th>
                  {Array.from({ length: dim }, (_, i) => i + 1).map((d) => {
                    const wknd = isWeekend(year, m, d)
                    const hol = holidayFor(year, m, d)
                    return (
                      <th
                        key={d}
                        className={(hol ? 'is-hol' : '') + ' ' + (wknd ? 'is-wknd' : '')}
                      >
                        <div>{d}</div>
                        <div className="cdr-year-page__dow">{DOW_ES[dowOf(year, m, d)]}</div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {visible.map((emp) => (
                  <tr key={emp.id}>
                    <td className="cdr-year-page__name">{emp.name}</td>
                    {Array.from({ length: dim }, (_, i) => i + 1).map((d) => {
                      const code = assignments[emp.id]?.[d]
                      const hasNote = !!notes[emp.id]?.[d]?.trim()
                      return (
                        <td
                          key={d}
                          style={code ? { background: `var(--${code}-bg)`, color: `var(--${code}-fg)` } : undefined}
                        >
                          {code || ''}
                          {hasNote && <span className="cdr-year-page__note-tri" aria-hidden />}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {(['M', 'T', 'N'] as ShiftCode[]).map((code) => (
                  <tr key={'cov-' + code} className="cdr-year-page__cov">
                    <td>COBERTURA {code}</td>
                    {Array.from({ length: dim }, (_, i) => i + 1).map((d) => (
                      <td key={d}>{coverage[code][d] || ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <HolidaysFooter year={year} month={m} holidayFor={holidayFor} className="cdr-year-page__hols" />
          </section>
        )
      })}
    </div>,
    document.body,
  )
}
