import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { SHIFT_ORDER, SHIFTS, MONTHS_ES } from '../../constants/shifts'
import type { Employee, EmployeeMonth, ShiftCode } from '../../types'
import { getDaysInMonth } from '../../utils/date'
import { visibleInMonth } from '../../utils/employee'

interface Props {
  open: boolean
  year: number
  month: number
  employees: Employee[]
  assignments: EmployeeMonth
  onClose: () => void
  /** Called with the IDs the user picked. Empty array = nothing selected. */
  onIndividualPDFs: (empIds: string[]) => void
}

interface Row {
  emp: Employee
  counts: Record<ShiftCode, number>
  workedDays: number
  hours: number
  empty: number
}

export function MonthlyReportModal({
  open, year, month, employees, assignments, onClose, onIndividualPDFs,
}: Props) {
  const dim = getDaysInMonth(year, month)

  const rows = useMemo<Row[]>(() => {
    return visibleInMonth(employees, assignments).map((emp) => {
      const counts: Record<ShiftCode, number> = { M: 0, T: 0, N: 0, V: 0, L: 0, D: 0 }
      let empty = 0
      for (let d = 1; d <= dim; d++) {
        const c = assignments[emp.id]?.[d]
        if (c) counts[c]++
        else empty++
      }
      const workedDays = counts.M + counts.T + counts.N
      const hours = workedDays * 8
      return { emp, counts, workedDays, hours, empty }
    })
  }, [employees, assignments, dim])

  const totals = useMemo(() => {
    const counts: Record<ShiftCode, number> = { M: 0, T: 0, N: 0, V: 0, L: 0, D: 0 }
    let workedDays = 0, hours = 0, empty = 0
    rows.forEach((r) => {
      SHIFT_ORDER.forEach((c) => { counts[c] += r.counts[c] })
      workedDays += r.workedDays
      hours += r.hours
      empty += r.empty
    })
    return { counts, workedDays, hours, empty }
  }, [rows])

  // 28px checkbox + name + hours + 6 shift cols + worked + vac + balance
  const cols = '28px 1.8fr 70px 50px 50px 50px 50px 50px 50px 70px 70px 70px'

  // Selection state — defaults to all visible rows; re-syncs if the row set
  // changes underneath us (e.g. month switch with the modal still open).
  const allIds = useMemo(() => rows.map((r) => r.emp.id), [rows])
  const [selected, setSelected] = useState<Set<string>>(() => new Set(allIds))
  useEffect(() => {
    setSelected(new Set(allIds))
  }, [allIds])
  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }
  const allOn = selected.size === allIds.length && allIds.length > 0
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(allIds))

  return (
    <Modal open={open} onClose={onClose} title={`Reporte · ${MONTHS_ES[month]} ${year}`} width={1040}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 14,
          marginBottom: 18,
          border: '1px solid var(--rule)',
          background: 'color-mix(in oklch, var(--accent) 6%, var(--paper))',
        }}
      >
        <Icon name="calendar" size={20} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {rows.length} empleado{rows.length !== 1 ? 's' : ''} · {totals.hours.toLocaleString()} horas trabajadas
          </div>
          <div
            style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
              letterSpacing: '0.08em', marginTop: 2,
            }}
          >
            {totals.workedDays} DÍAS-TURNO · {totals.counts.V} VACACIONES · {totals.counts.L} LICENCIAS · {totals.counts.D} DESCANSOS
            {totals.empty > 0 && ` · ${totals.empty} CELDAS VACÍAS`}
          </div>
        </div>
        <button
          onClick={() => onIndividualPDFs(Array.from(selected))}
          disabled={selected.size === 0}
          className="cdr-btn"
          style={{ fontSize: 12, opacity: selected.size === 0 ? 0.5 : 1 }}
          title={
            selected.size === 0
              ? 'Selecciona al menos un empleado'
              : `Imprimir ${selected.size} horario${selected.size !== 1 ? 's' : ''}`
          }
        >
          <Icon name="print" size={13} /> Horarios individuales · {selected.size}
        </button>
      </div>

      <div style={{ border: '1px solid var(--rule)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid', gridTemplateColumns: cols, gap: 0,
            padding: '8px 12px', background: 'var(--paper-2)',
            borderBottom: '1px solid var(--rule)',
            fontFamily: 'var(--mono)', fontSize: 10,
            color: 'var(--ink-3)', letterSpacing: '0.1em',
            alignItems: 'center',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={allOn}
              onChange={toggleAll}
              title={allOn ? 'Deseleccionar todos' : 'Seleccionar todos'}
              aria-label="Seleccionar todos"
            />
          </span>
          <span>EMPLEADO</span>
          <span style={{ textAlign: 'right' }}>HORAS</span>
          {SHIFT_ORDER.map((c) => (
            <span key={c} style={{ textAlign: 'center' }}>{c}</span>
          ))}
          <span style={{ textAlign: 'right' }}>TRAB.</span>
          <span style={{ textAlign: 'right' }}>VAC.</span>
          <span style={{ textAlign: 'right' }}>SALDO</span>
        </div>

        {rows.map((r) => (
          <label
            key={r.emp.id}
            style={{
              display: 'grid', gridTemplateColumns: cols, gap: 0,
              padding: '10px 12px', borderTop: '1px solid var(--rule)',
              alignItems: 'center', fontSize: 13, cursor: 'pointer',
              background: selected.has(r.emp.id) ? 'transparent' : 'color-mix(in oklch, var(--paper-2) 60%, transparent)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={selected.has(r.emp.id)}
                onChange={() => toggle(r.emp.id)}
                aria-label={`Seleccionar ${r.emp.name}`}
              />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ width: 10, height: 10, background: r.emp.avatarColor, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.emp.name}</span>
            </span>
            <span style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>
              {r.hours}h
            </span>
            {SHIFT_ORDER.map((c) => (
              <span key={c} style={{ textAlign: 'center' }}>
                {r.counts[c] > 0 ? (
                  <ShiftBadge code={c} n={r.counts[c]} />
                ) : (
                  <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11 }}>·</span>
                )}
              </span>
            ))}
            <span style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12 }}>
              {r.workedDays}
            </span>
            <span style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12 }}>
              {r.counts.V}
            </span>
            <span
              style={{
                textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12,
                color: r.emp.vacationBalance - r.counts.V < 0 ? 'var(--err)' : 'var(--ink)',
                fontWeight: 600,
              }}
              title="Saldo de vacaciones tras este mes"
            >
              {r.emp.vacationBalance - r.counts.V}
            </span>
          </label>
        ))}

        {rows.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Sin empleados visibles en este mes.
          </div>
        )}

        {rows.length > 0 && (
          <div
            style={{
              display: 'grid', gridTemplateColumns: cols, gap: 0,
              padding: '10px 12px', borderTop: '2px solid var(--ink)',
              alignItems: 'center', fontSize: 13, background: 'var(--paper-2)',
              fontWeight: 600,
            }}
          >
            <span />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em' }}>TOTAL</span>
            <span style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{totals.hours}h</span>
            {SHIFT_ORDER.map((c) => (
              <span key={c} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12 }}>
                {totals.counts[c]}
              </span>
            ))}
            <span style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{totals.workedDays}</span>
            <span style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{totals.counts.V}</span>
            <span />
          </div>
        )}
      </div>

      <p style={{ margin: '14px 0 0', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55 }}>
        Cálculo: cada turno de trabajo (M/T/N) cuenta 8h. V/L/D no suman horas. El saldo descontado se calcula
        contra las vacaciones tomadas este mes.
      </p>
    </Modal>
  )
}

function ShiftBadge({ code, n }: { code: ShiftCode; n: number }) {
  return (
    <span
      title={SHIFTS[code].label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 22, padding: '2px 6px',
        background: `var(--${code}-bg)`, color: `var(--${code}-fg)`,
        fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
      }}
    >
      {n}
    </span>
  )
}

