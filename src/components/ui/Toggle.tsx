interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel?: string
}

export function Toggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      style={{
        width: 44,
        height: 24,
        padding: 2,
        background: checked ? 'var(--ink)' : 'var(--rule-2)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background .15s ease',
      }}
    >
      <span
        style={{
          display: 'block',
          width: 20,
          height: 20,
          background: 'var(--paper)',
          transform: `translateX(${checked ? 20 : 0}px)`,
          transition: 'transform .15s cubic-bezier(.2,.7,.2,1)',
        }}
      />
    </button>
  )
}
