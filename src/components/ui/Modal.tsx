import { type ReactNode, useEffect } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}

export function Modal({ open, onClose, title, children, width = 560 }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      data-cdr-modal-root
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(10,10,10,0.45)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        animation: 'cdr-fade .15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: '88vh',
          overflow: 'auto',
          background: 'var(--card)',
          color: 'var(--ink)',
          border: '1px solid var(--rule)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          animation: 'cdr-pop .18s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '20px 24px 12px',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--ink-3)',
                marginBottom: 4,
              }}
            >
              Cuadrante / Diálogo
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--sans)',
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h2>
          </div>
          <button onClick={onClose} className="cdr-iconbtn" aria-label="Cerrar">
            <Icon name="x" size={14} />
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>{children}</div>
      </div>
    </div>
  )
}
