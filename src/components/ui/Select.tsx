import { useEffect, useRef, useState } from 'react'

export interface SelectOption<T extends string | number> {
  value: T
  label: string
  /** Optional secondary text shown on the right of the row in mono font. */
  hint?: string
}

interface SelectProps<T extends string | number> {
  value: T
  onChange: (next: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  /** Inline width override. Use `fullWidth` for `100%`. */
  width?: number | string
  fullWidth?: boolean
  disabled?: boolean
  /** Forward to the trigger button so callers can style padding/font. */
  style?: React.CSSProperties
  className?: string
}

/**
 * Themed dropdown that replaces native `<select>` everywhere in the app so
 * options match the rest of the UI (light paper, mono hints, rule borders).
 * Behaves like a select for keyboard users (Esc to close, click outside to
 * dismiss). Doesn't try to be a combobox — no search, no multi-select.
 */
export function Select<T extends string | number>({
  value, onChange, options, placeholder, width, fullWidth, disabled, style, className,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const click = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const id = window.setTimeout(() => window.addEventListener('mousedown', click), 0)
    window.addEventListener('keydown', esc)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('mousedown', click)
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div
      ref={ref}
      style={{ position: 'relative', width: fullWidth ? '100%' : width, display: fullWidth ? 'block' : 'inline-block' }}
    >
      <button
        type="button"
        className={'cdr-input ' + (className || '')}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          width: '100%',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          fontFamily: 'inherit',
          ...style,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current?.label ?? placeholder ?? ''}
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            minWidth: '100%',
            zIndex: 200,
            background: 'var(--paper)',
            border: '1px solid var(--rule)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => {
            const selected = opt.value === value
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className="cdr-select-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: selected ? 'var(--paper-2)' : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  fontSize: 13,
                  color: 'var(--ink)',
                  textAlign: 'left',
                  transition: 'background 0.08s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-2)' }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selected ? 'var(--paper-2)' : 'transparent'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
                {opt.hint && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                    {opt.hint}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.12s ease',
        flexShrink: 0,
        color: 'var(--ink-3)',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
