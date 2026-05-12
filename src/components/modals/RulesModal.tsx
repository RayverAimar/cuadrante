import { Modal } from '../ui/Modal'
import { Toggle } from '../ui/Toggle'
import { useRosterStore } from '../../store/useRosterStore'
import type { Rule } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
}

export function RulesModal({ open, onClose }: Props) {
  const { rules, setRules } = useRosterStore()

  const update = (id: string, patch: Partial<Rule>) =>
    setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <Modal open={open} onClose={onClose} title="Reglas de validación" width={680}>
      <p style={{ margin: '0 0 20px', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.5 }}>
        Cuando una regla se activa, sus violaciones aparecen en el panel lateral y las celdas afectadas se marcan en la grilla.
      </p>
      <div style={{ border: '1px solid var(--rule)' }}>
        {rules.map((r, i) => (
          <div
            key={r.id}
            style={{
              padding: '16px 18px',
              borderTop: i === 0 ? 'none' : '1px solid var(--rule)',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 16,
              alignItems: 'flex-start',
              background: r.enabled ? 'transparent' : 'var(--paper-2)',
              opacity: r.enabled ? 1 : 0.65,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    color: 'var(--accent)',
                    letterSpacing: '0.1em',
                  }}
                >
                  R/{(i + 1).toString().padStart(2, '0')}
                </span>
                <h4 style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{r.name}</h4>
              </div>
              <p style={{ margin: 0, color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.45 }}>{r.description}</p>
              {r.value !== null && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label className="cdr-label" style={{ margin: 0 }}>
                    {r.param}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={r.value}
                    onChange={(e) => update(r.id, { value: parseInt(e.target.value) || 1 })}
                    className="cdr-input"
                    style={{ width: 80, padding: '6px 10px', fontFamily: 'var(--mono)' }}
                    disabled={!r.enabled}
                  />
                </div>
              )}
            </div>
            <Toggle checked={r.enabled} onChange={(v) => update(r.id, { enabled: v })} ariaLabel={r.name} />
          </div>
        ))}
      </div>
    </Modal>
  )
}
