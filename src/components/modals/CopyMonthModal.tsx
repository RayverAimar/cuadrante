import { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Select } from '../ui/Select'
import { useRosterStore } from '../../store/useRosterStore'
import { MONTHS_ES, SHIFTS, SHIFT_ORDER } from '../../constants/shifts'
import { monthKey } from '../../utils/date'
import { copyMonth } from '../../utils/copyMonth'
import type { ShiftCode } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
}

export function CopyMonthModal({ open, onClose }: Props) {
  const { year, month, byMonth, replaceMonth } = useRosterStore()

  // Default source = previous month
  const defaultY = month === 0 ? year - 1 : year
  const defaultM = month === 0 ? 11 : month - 1

  const [srcYear, setSrcYear] = useState(defaultY)
  const [srcMonth, setSrcMonth] = useState(defaultM)
  const [overwrite, setOverwrite] = useState(false)
  const [selectedCodes, setSelectedCodes] = useState<Set<ShiftCode>>(
    new Set(['V', 'L', 'D']),
  )

  const targetK = monthKey(year, month)
  const srcK = monthKey(srcYear, srcMonth)
  const target = byMonth[targetK] || {}
  const source = byMonth[srcK] || {}

  const result = useMemo(
    () => copyMonth(source, target, year, month, { codes: selectedCodes, overwrite }),
    [source, target, year, month, selectedCodes, overwrite],
  )

  const toggleCode = (c: ShiftCode) => {
    const next = new Set(selectedCodes)
    if (next.has(c)) next.delete(c)
    else next.add(c)
    setSelectedCodes(next)
  }

  const apply = () => {
    replaceMonth(year, month, result.next)
    onClose()
  }

  const yearOptions = [year - 2, year - 1, year, year + 1]

  return (
    <Modal open={open} onClose={onClose} title="Copiar de otro mes" width={600}>
      <p style={{ margin: '0 0 16px', color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.5 }}>
        Copia asignaciones de otro mes a <strong>{MONTHS_ES[month]} {year}</strong>. Solo se
        copian los códigos seleccionados; por defecto se respetan las celdas que ya tienes
        pintadas.
      </p>

      <div className="cdr-eyebrow" style={{ marginBottom: 8 }}>MES DE ORIGEN</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <Select<number>
            value={srcMonth}
            onChange={setSrcMonth}
            options={MONTHS_ES.map((name, i) => ({ value: i, label: name }))}
            fullWidth
          />
        </div>
        <Select<number>
          value={srcYear}
          onChange={setSrcYear}
          options={yearOptions.map((y) => ({ value: y, label: String(y) }))}
          width={110}
        />
      </div>

      <div className="cdr-eyebrow" style={{ marginBottom: 8 }}>QUÉ COPIAR</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {SHIFT_ORDER.map((code) => {
          const sh = SHIFTS[code]
          const on = selectedCodes.has(code)
          return (
            <button
              key={code}
              onClick={() => toggleCode(code)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                background: on ? `var(--${code}-bg)` : 'var(--card)',
                color: on ? `var(--${code}-fg)` : 'var(--ink-3)',
                border: on ? `1px solid var(--${code}-fg)` : '1px solid var(--rule)',
                fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--mono)', fontWeight: 700,
                  width: 18, height: 18, display: 'grid', placeItems: 'center',
                  background: `var(--${code}-bg)`, color: `var(--${code}-fg)`,
                  fontSize: 11,
                }}
              >
                {code}
              </span>
              {sh.label}
            </button>
          )
        })}
      </div>

      <label
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', border: '1px solid var(--rule)',
          marginBottom: 20, cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={overwrite}
          onChange={(e) => setOverwrite(e.target.checked)}
        />
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>Sobrescribir celdas existentes</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            Si está desactivado, solo se llenan las celdas vacías.
          </div>
        </div>
      </label>

      <div
        style={{
          padding: '14px 16px', background: 'var(--paper-2)', border: '1px solid var(--rule)',
          marginBottom: 16, fontFamily: 'var(--mono)', fontSize: 12,
        }}
      >
        <div style={{ marginBottom: 6, color: 'var(--ink-3)', fontSize: 10, letterSpacing: '0.08em' }}>VISTA PREVIA</div>
        {result.copied === 0 ? (
          <div style={{ color: 'var(--ink-3)' }}>
            Sin celdas a copiar — el mes origen está vacío para los códigos seleccionados, o
            todas las celdas destino ya tienen valor.
          </div>
        ) : (
          <div>
            <strong>{result.copied}</strong> celdas a copiar
            {result.skipped > 0 && <span style={{ color: 'var(--ink-3)' }}> · {result.skipped} saltadas (ya tenían valor)</span>}
            <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11 }}>
              {SHIFT_ORDER.map((code) => result.byCode[code] > 0 && (
                <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      width: 14, height: 14, display: 'inline-grid', placeItems: 'center',
                      background: `var(--${code}-bg)`, color: `var(--${code}-fg)`,
                      fontWeight: 700, fontSize: 9,
                    }}
                  >
                    {code}
                  </span>
                  {result.byCode[code]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="cdr-btn" onClick={onClose}>Cancelar</button>
        <button
          className="cdr-btn cdr-btn--primary"
          onClick={apply}
          disabled={result.copied === 0}
        >
          <Icon name="download" size={14} /> Copiar {result.copied} celdas
        </button>
      </div>
    </Modal>
  )
}
