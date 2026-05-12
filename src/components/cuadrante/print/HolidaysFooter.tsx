import type { Holiday } from '../../../types'
import { getDaysInMonth } from '../../../utils/date'

interface Props {
  year: number
  month: number
  holidayFor: (y: number, m: number, d: number) => Holiday | null
  /** Tag with .cdr-print-only so the block is hidden on screen. */
  printOnly?: boolean
  /** Optional class for layout-specific overrides (e.g. year-page tweaks). */
  className?: string
}

/**
 * Footnote block listing every holiday in the month, e.g. "Día 1 — Año Nuevo".
 * Lives at the page foot of any printed view that shows holiday triangles.
 * Renders nothing if the month has no holidays.
 */
export function HolidaysFooter({ year, month, holidayFor, printOnly, className }: Props) {
  const dim = getDaysInMonth(year, month)
  const items: Array<{ day: number; name: string; kind: Holiday['kind'] }> = []
  for (let d = 1; d <= dim; d++) {
    const h = holidayFor(year, month, d)
    if (h) items.push({ day: d, name: h.name, kind: h.kind })
  }
  if (items.length === 0) return null

  const cls = ['cdr-hols-footer', printOnly ? 'cdr-print-only' : '', className || '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls}>
      <div className="cdr-hols-footer__hd">FERIADOS</div>
      <ol className="cdr-hols-footer__list">
        {items.map((h) => (
          <li key={h.day}>
            <span className="cdr-hols-footer__mark" aria-hidden />
            <span className="cdr-hols-footer__day">Día {h.day}</span>
            <span className="cdr-hols-footer__name">
              {h.name}
              {h.kind === 'local' && <span className="cdr-hols-footer__tag"> · local</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
