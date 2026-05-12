import { useToastStore } from '../../store/useToastStore'
import { Icon } from './Icon'

export function Toasts() {
  const { toasts, dismiss } = useToastStore()
  if (toasts.length === 0) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 9999,
        maxWidth: 380,
      }}
    >
      {toasts.map((t) => {
        const color =
          t.level === 'error' ? 'var(--err)' : t.level === 'success' ? 'var(--ok, #2a8a3a)' : 'var(--ink)'
        return (
          <div
            key={t.id}
            role="status"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              background: 'var(--paper)',
              border: `1px solid ${color}`,
              borderLeft: `4px solid ${color}`,
              boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
              fontSize: 13,
              fontFamily: 'var(--sans)',
              color: 'var(--ink)',
            }}
          >
            <Icon name="alert" size={14} />
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--ink-3)',
                padding: 2,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
