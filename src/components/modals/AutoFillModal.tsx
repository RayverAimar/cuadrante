import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { SHIFT_ORDER, SHIFTS } from '../../constants/shifts'
import type { Employee, EmployeeMonth } from '../../types'
import type { AutoFillResult } from '../../utils/autoFill'
import { getDaysInMonth } from '../../utils/date'

interface Props {
  open: boolean
  year: number
  month: number
  employees: Employee[]
  assignments: EmployeeMonth
  preview: AutoFillResult
  onClose: () => void
  onApply: (next: EmployeeMonth) => void
}

export function AutoFillModal({
  open, year, month, employees, assignments, preview, onClose, onApply,
}: Props) {
  const dim = getDaysInMonth(year, month)
  let emptyBefore = 0
  for (let d = 1; d <= dim; d++) {
    employees.forEach((e) => { if (!assignments[e.id]?.[d]) emptyBefore++ })
  }
  const totalCells = employees.length * dim
  const filledNow = totalCells - emptyBefore
  const willFill = preview.filled
  const completion = totalCells > 0 ? (((filledNow + willFill) / totalCells) * 100).toFixed(0) : '0'

  return (
    <Modal open={open} onClose={onClose} title="Llenado automático" width={620}>
      <div
        style={{
          padding: 14,
          marginBottom: 16,
          border: '1px solid var(--rule)',
          background: 'color-mix(in oklch, var(--accent) 8%, var(--paper))',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Icon name="sparkles" size={20} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {willFill === 0
              ? 'El cuadrante ya está completo.'
              : `Se completarán ${willFill} celda${willFill !== 1 ? 's' : ''} vacía${willFill !== 1 ? 's' : ''}.`}
          </div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--ink-3)',
              letterSpacing: '0.08em',
              marginTop: 2,
            }}
          >
            COMPLETITUD FINAL: {completion}% · {employees.length} EMPL × {dim} DÍAS
          </div>
        </div>
      </div>

      {willFill > 0 && (
        <>
          <div className="cdr-eyebrow" style={{ marginBottom: 10 }}>DISTRIBUCIÓN PROPUESTA</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 1,
              background: 'var(--rule)',
              border: '1px solid var(--rule)',
              marginBottom: 18,
            }}
          >
            {SHIFT_ORDER.map((code) => {
              const sh = SHIFTS[code]
              const n = preview.byShift[code] || 0
              return (
                <div key={code} style={{ padding: '12px 8px', background: 'var(--paper)', textAlign: 'center' }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      margin: '0 auto 6px',
                      background: `var(--${code}-bg)`,
                      color: `var(--${code}-fg)`,
                      fontFamily: 'var(--mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {code}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700 }}>+{n}</div>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 9,
                      color: 'var(--ink-3)',
                      letterSpacing: '0.06em',
                      marginTop: 2,
                    }}
                  >
                    {sh.label.split(' ')[0].toUpperCase()}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <p style={{ margin: '0 0 24px', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
        Respeta cobertura mínima M/T/N, descansos post-noche, tope de 6 días seguidos, y nunca toca celdas ya asignadas.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid var(--rule)',
        }}
      >
        <button onClick={onClose} className="cdr-btn cdr-btn--ghost">Cancelar</button>
        <button
          onClick={() => onApply(preview.newAssignments)}
          disabled={willFill === 0}
          className="cdr-btn cdr-btn--primary"
          style={willFill === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <Icon name="check" size={13} /> Aplicar llenado
        </button>
      </div>
    </Modal>
  )
}
