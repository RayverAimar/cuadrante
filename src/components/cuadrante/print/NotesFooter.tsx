import type { Employee } from '../../../types'

interface Props {
  employees: Employee[]
  notes: Record<string, Record<number, string>>
}

/**
 * Print-only footnote block listing every cell-note for the current month,
 * grouped by employee. Shown under the monthly grid when the user prints.
 * Hidden on screen via the .cdr-print-only class.
 */
export function NotesFooter({ employees, notes }: Props) {
  const rows: Array<{ name: string; day: number; text: string }> = []
  employees.forEach((emp) => {
    const own = notes[emp.id] || {}
    Object.keys(own).forEach((k) => {
      const day = parseInt(k, 10)
      const text = own[day]?.trim()
      if (text) rows.push({ name: emp.name, day, text })
    })
  })
  if (rows.length === 0) return null
  rows.sort((a, b) => a.day - b.day || a.name.localeCompare(b.name))

  return (
    <div className="cdr-print-only cdr-notes-footer">
      <div className="cdr-notes-footer__hd">NOTAS DEL MES</div>
      <ol className="cdr-notes-footer__list">
        {rows.map((r, i) => (
          <li key={i}>
            <span className="cdr-notes-footer__day">Día {r.day}</span>
            <span className="cdr-notes-footer__name">{r.name}</span>
            <span className="cdr-notes-footer__text">{r.text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
