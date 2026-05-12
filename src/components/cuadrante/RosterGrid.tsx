import { type CSSProperties, type MouseEvent, memo, useEffect, useRef, useState } from 'react'
import type { Employee, EmployeeMonth, ShiftCode, Holiday } from '../../types'
import { dowOf, isWeekend } from '../../utils/date'
import { DOW_ES, SHIFTS } from '../../constants/shifts'
import { Tooltip } from '../ui/Tooltip'

interface RosterGridProps {
  year: number
  month: number
  dim: number
  employees: Employee[]
  assignments: EmployeeMonth
  notes: Record<string, Record<number, string>>
  minVal: number
  coverage: Record<ShiftCode, Record<number, number>>
  errorCells: Set<string>
  holidayFor: (y: number, m: number, d: number) => Holiday | null
  selection: Set<string>
  onDayClick: (d: number) => void
  onCellMouseDown: (empId: string, day: number, e: MouseEvent) => void
  onCellEnter: (empId: string, day: number, target?: HTMLElement) => void
  onCellContext: (empId: string, day: number, e: MouseEvent) => void
}

const thBase: CSSProperties = {
  padding: '10px 4px',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  color: 'var(--ink-3)',
  background: 'var(--paper)',
  borderBottom: '1px solid var(--rule)',
  position: 'sticky',
  top: 0,
  zIndex: 3,
}

export function RosterGrid({
  year, month, dim, employees, assignments, notes, minVal, coverage,
  errorCells, holidayFor, selection,
  onDayClick, onCellMouseDown, onCellEnter, onCellContext,
}: RosterGridProps) {
  // Min cell width keeps a single letter legible while letting cells stretch
  // horizontally to fill the viewport. The name column has a min too so it
  // doesn't get squeezed.
  const cellMinW = 32
  const nameW = 240
  const days = Array.from({ length: dim }, (_, i) => i + 1)

  // Stretch row heights so the grid fills the vertical space available.
  // We can't rely on `table { height: 100% }` alone — browsers don't stretch
  // rows reliably inside an overflow:auto container, so we measure and apply.
  const wrapRef = useRef<HTMLDivElement>(null)
  const [rowH, setRowH] = useState(40)
  const empCount = employees.length
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const HEADER_H = 50
    const COVERAGE_H = 28 * 3
    const MIN = 36
    const MAX = 84
    const compute = () => {
      const avail = el.clientHeight - HEADER_H - COVERAGE_H
      const ideal = empCount > 0 ? Math.floor(avail / empCount) : MIN
      setRowH(Math.max(MIN, Math.min(MAX, ideal)))
    }
    // Defer to next frame so the DOM has settled after the row-count change.
    const raf = requestAnimationFrame(compute)
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [empCount])

  return (
    <div
      ref={wrapRef}
      className="cdr-grid-wrap"
      style={{
        border: '1px solid var(--rule)',
        background: 'var(--card)',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <table
        style={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontFamily: 'var(--mono)',
          fontSize: 11,
          userSelect: 'none',
          width: '100%',
          tableLayout: 'fixed',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                ...thBase,
                width: nameW,
                minWidth: nameW,
                textAlign: 'left',
                paddingLeft: 16,
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 5,
                background: 'var(--paper)',
                borderRight: '1px solid var(--rule)',
              }}
            >
              <span className="cdr-eyebrow">EMPLEADO / DÍA</span>
            </th>
            {days.map((d) => {
              const wknd = isWeekend(year, month, d)
              const hol = holidayFor(year, month, d)
              return (
                <th
                  key={d}
                  onClick={() => onDayClick(d)}
                  style={{
                    ...thBase,
                    minWidth: cellMinW,
                    textAlign: 'center',
                    background: hol
                      ? 'color-mix(in oklch, var(--err) 12%, var(--paper))'
                      : wknd
                      ? 'var(--paper-2)'
                      : 'var(--paper)',
                    color: hol ? 'var(--err)' : wknd ? 'var(--ink-3)' : 'var(--ink-2)',
                    borderLeft: '1px solid var(--rule)',
                    borderTop: hol ? '2px solid var(--err)' : 'none',
                    cursor: 'pointer',
                  }}
                  title={
                    hol
                      ? `${hol.name}${hol.kind === 'local' ? ' (local)' : ''} · Click para ver el día`
                      : 'Click para ver el día'
                  }
                >
                  <div style={{ fontWeight: 700 }}>{d}</div>
                  <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>
                    {DOW_ES[dowOf(year, month, d)]}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr
              key={emp.id}
              style={{
                height: rowH,
                transition: 'height 0.18s ease',
              }}
            >
              <td
                style={{
                  padding: '0 16px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  background: 'var(--card)',
                  borderTop: '1px solid var(--rule)',
                  borderRight: '1px solid var(--rule)',
                  whiteSpace: 'nowrap',
                  height: rowH,
                }}
              >
                <Tooltip
                  content={`${emp.name}\n${emp.role}\nTurno base: ${SHIFTS[emp.base].label}`}
                  placement="right"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                      {emp.name}
                    </span>
                    <span
                      className="cdr-no-print"
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        color: 'var(--ink-3)',
                        marginLeft: 'auto',
                      }}
                    >
                      {emp.role}
                    </span>
                  </div>
                </Tooltip>
              </td>
              {days.map((d) => {
                const code = assignments[emp.id]?.[d]
                const wknd = isWeekend(year, month, d)
                const isErr = errorCells.has(`${emp.id}:${d}`)
                const note = notes[emp.id]?.[d]
                const tooltip = `${emp.name} · día ${d}\n${
                  code ? `${SHIFTS[code].label} (${SHIFTS[code].hours})` : 'sin asignar'
                }${isErr ? '\n⚠ Conflicto de regla' : ''}${note ? `\n📝 ${note}` : ''}\n\nClic derecho: añadir nota`
                return (
                  <Cell
                    key={d}
                    code={code}
                    wknd={wknd}
                    isErr={isErr}
                    hasNote={!!note}
                    selected={selection.has(`${emp.id}:${d}`)}
                    onMouseDown={(e) => onCellMouseDown(emp.id, d, e)}
                    onMouseEnter={(e) => onCellEnter(emp.id, d, e.currentTarget as HTMLElement)}
                    onContext={(e) => onCellContext(emp.id, d, e)}
                    tooltip={tooltip}
                  />
                )
              })}
            </tr>
          ))}

          {(['M', 'T', 'N'] as ShiftCode[]).map((code, i) => {
            // Stack the 3 coverage rows pinned to the bottom of the scroll
            // container. N (last) sits at bottom:0, T above it, M above T.
            // Local to coverage rows: distinct from the dynamic `rowH` state
            // above (which sizes employee rows).
            const covRowH = 28
            const bottomOffset = (2 - i) * covRowH
            return (
            <tr
              key={'cov-' + code}
              style={{ background: 'var(--paper-2)' }}
            >
              <td
                style={{
                  padding: '0 16px',
                  height: 28,
                  position: 'sticky',
                  left: 0,
                  bottom: bottomOffset,
                  zIndex: 4,
                  background: 'var(--paper-2)',
                  borderTop: '1px solid var(--rule-2)',
                  borderRight: '1px solid var(--rule)',
                }}
              >
                <span className="cdr-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      display: 'grid',
                      placeItems: 'center',
                      background: `var(--${code}-bg)`,
                      color: `var(--${code}-fg)`,
                      fontFamily: 'var(--mono)',
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {code}
                  </span>
                  COBERTURA
                </span>
              </td>
              {days.map((d) => {
                const n = coverage[code][d] || 0
                const wknd = isWeekend(year, month, d)
                const under = !wknd && minVal > 0 && n < minVal
                return (
                  <Tooltip
                    key={d}
                    content={`${SHIFTS[code].label} · día ${d}: ${n} empleado${n !== 1 ? 's' : ''}${under ? ` (mín ${minVal})` : ''}`}
                  >
                    <td
                      style={{
                        borderTop: '1px solid var(--rule-2)',
                        borderLeft: '1px solid var(--rule)',
                        textAlign: 'center',
                        height: 28,
                        fontFamily: 'var(--mono)',
                        fontWeight: 600,
                        fontSize: 11,
                        color: under ? 'var(--err)' : n === 0 ? 'var(--ink-4)' : 'var(--ink-2)',
                        background: under ? 'rgba(193,39,26,0.08)' : 'var(--paper-2)',
                        position: 'sticky',
                        bottom: bottomOffset,
                        zIndex: 3,
                      }}
                    >
                      {n || '·'}
                    </td>
                  </Tooltip>
                )
              })}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface CellProps {
  code: ShiftCode | undefined
  wknd: boolean
  isErr: boolean
  hasNote: boolean
  selected: boolean
  onMouseDown: (e: MouseEvent) => void
  onMouseEnter: (e: MouseEvent) => void
  onContext: (e: MouseEvent) => void
  tooltip: string
}

// memo: search keystrokes and selection drags re-render <RosterGrid />; the
// cell only cares about its own props, so skip the work when they're stable.
const Cell = memo(function Cell({
  code, wknd, isErr, hasNote, selected,
  onMouseDown, onMouseEnter, onContext, tooltip,
}: CellProps) {
  const [hovered, setHovered] = useState(false)
  const bg = selected
    ? 'color-mix(in oklch, var(--accent) 22%, var(--card))'
    : code
    ? `var(--${code}-bg)`
    : wknd
    ? 'var(--paper-2)'
    : 'var(--card)'
  const fg = code ? `var(--${code}-fg)` : 'var(--ink-4)'
  return (
    <Tooltip content={tooltip} delay={350}>
      <td
        data-cdr-cell
        onMouseDown={onMouseDown}
        onMouseEnter={(e) => { setHovered(true); onMouseEnter(e) }}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={(e) => { e.preventDefault(); onContext(e) }}
        style={{
          minWidth: 32,
          padding: 0,
          borderTop: '1px solid var(--rule)',
          borderLeft: '1px solid var(--rule)',
          background: bg,
          color: fg,
          textAlign: 'center',
          verticalAlign: 'middle',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'cell',
          position: 'relative',
          boxShadow: isErr
            ? 'inset 0 0 0 2px var(--err)'
            : selected
            ? 'inset 0 0 0 2px var(--accent)'
            : hovered
            ? 'inset 0 0 0 1px var(--ink-3)'
            : undefined,
          transition: 'box-shadow .08s ease, background .15s ease',
        }}
      >
        {code || ''}
        {hasNote && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderTop: '8px solid var(--accent, #c1271a)',
              pointerEvents: 'none',
            }}
          />
        )}
      </td>
    </Tooltip>
  )
})
