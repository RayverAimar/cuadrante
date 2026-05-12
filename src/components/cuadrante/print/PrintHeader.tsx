import { MONTHS_ES, SHIFTS, SHIFT_ORDER } from '../../../constants/shifts'

interface Props {
  year: number
  month: number
  employeeCount: number
}

export function PrintHeader({ year, month, employeeCount }: Props) {
  const now = new Date()
  const generated = now.toLocaleString('es-PE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  return (
    <div
      className="cdr-print-only"
      style={{
        padding: '4px 0 10px',
        marginBottom: 8,
        borderBottom: '1px solid #000',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: '0.18em',
              color: '#555',
              marginBottom: 2,
            }}
          >
            CUADRANTE · PLANIFICACIÓN DE TURNOS
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--serif)',
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {MONTHS_ES[month]}{' '}
            <span style={{ fontStyle: 'italic', color: '#555' }}>{year}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: '#555' }}>
          <span>{employeeCount} EMPLEADOS</span>
          <span style={{ borderLeft: '1px solid #999', paddingLeft: 14 }}>GEN. {generated}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: 9 }}>
        {SHIFT_ORDER.map((code) => {
          const sh = SHIFTS[code]
          return (
            <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 14, height: 14,
                  display: 'inline-grid', placeItems: 'center',
                  background: `var(--${code}-bg)`, color: `var(--${code}-fg)`,
                  fontWeight: 700, fontSize: 9,
                }}
              >
                {code}
              </span>
              <span style={{ color: '#222' }}>{sh.label}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
