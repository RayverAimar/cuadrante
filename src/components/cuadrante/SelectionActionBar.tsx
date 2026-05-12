import { useLayoutEffect, useRef, useState } from 'react'
import { Tooltip } from '../ui/Tooltip'
import { Icon } from '../ui/Icon'
import { SHIFT_ORDER, SHIFTS } from '../../constants/shifts'
import type { ShiftCode } from '../../types'

interface Anchor { x: number; y: number; w: number; h: number }

interface Props {
  count: number
  onPick: (code: ShiftCode) => void
  onClear: () => void
  onDismiss: () => void
  /** Bounding rect of the cell to anchor the popover to. Falls back to a
   *  centered bottom toast if not provided. */
  anchor: Anchor | null
}

// Padding from the viewport edges and gap between the anchor and the bar.
const MARGIN = 16
const GAP = 8

function computePosition(anchor: Anchor, w: number, h: number, vw: number, vh: number) {
  // Horizontal: center on the anchor, clamped to viewport.
  let left = anchor.x + anchor.w / 2 - w / 2
  left = Math.max(MARGIN, Math.min(vw - w - MARGIN, left))
  // Vertical: prefer below; flip above if it'd run off the bottom; last resort
  // pin to viewport bottom.
  let top = anchor.y + anchor.h + GAP
  if (top + h > vh - MARGIN) {
    const above = anchor.y - h - GAP
    top = above >= MARGIN ? above : Math.max(MARGIN, vh - h - MARGIN)
  }
  return { left, top }
}

export function SelectionActionBar({ count, onPick, onClear, onDismiss, anchor }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    if (!anchor || !ref.current) { setPos(null); return }
    const recompute = () => {
      const el = ref.current
      if (!el || !anchor) return
      setPos(computePosition(anchor, el.offsetWidth, el.offsetHeight, window.innerWidth, window.innerHeight))
    }
    recompute()
    window.addEventListener('resize', recompute)
    window.addEventListener('scroll', recompute, true)
    return () => {
      window.removeEventListener('resize', recompute)
      window.removeEventListener('scroll', recompute, true)
    }
  }, [anchor])

  // While we haven't measured yet, render the bar far off-screen so it doesn't
  // flicker at the center on first paint.
  const positioned = anchor && pos
  return (
    <div
      ref={ref}
      className="cdr-action-bar cdr-no-print"
      style={{
        position: 'fixed',
        ...(positioned
          ? { left: pos!.left, top: pos!.top }
          : { left: '50%', bottom: 24, transform: 'translateX(-50%)' }),
        visibility: anchor && !pos ? 'hidden' : 'visible',
        zIndex: 600,
        display: 'flex',
        alignItems: 'stretch',
        background: 'var(--card)',
        color: 'var(--ink)',
        border: '1px solid var(--ink)',
        boxShadow: '0 18px 44px rgba(0,0,0,0.22)',
        animation: 'cdr-pop .16s cubic-bezier(.2,.7,.2,1)',
        maxWidth: 'calc(100vw - 32px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '10px 16px',
          borderRight: '1px solid var(--rule)',
          background: 'var(--paper-2)',
          minWidth: 120,
        }}
      >
        <span className="cdr-eyebrow" style={{ marginBottom: 2 }}>SELECCIÓN</span>
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 16 }}>
          {count}{' '}
          <span style={{ fontWeight: 400, color: 'var(--ink-3)', fontSize: 12 }}>
            celda{count !== 1 ? 's' : ''}
          </span>
        </span>
      </div>
      <div style={{ display: 'flex' }}>
        {SHIFT_ORDER.map((code, i) => {
          const sh = SHIFTS[code]
          return (
            <Tooltip key={code} content={`${sh.label} · ${sh.hours}\nAtajo: ${code}`} placement="top">
              <button
                onClick={() => onPick(code)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: '10px 14px',
                  minWidth: 64,
                  borderLeft: i === 0 ? 'none' : '1px solid var(--rule)',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'var(--sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `var(--${code}-bg)`
                  e.currentTarget.style.color = `var(--${code}-fg)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--card)'
                  e.currentTarget.style.color = 'var(--ink)'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontWeight: 700,
                    fontSize: 14,
                    width: 22,
                    height: 22,
                    display: 'grid',
                    placeItems: 'center',
                    background: `var(--${code}-bg)`,
                    color: `var(--${code}-fg)`,
                  }}
                >
                  {code}
                </span>
                <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{sh.label.split(' ')[0]}</span>
              </button>
            </Tooltip>
          )
        })}
      </div>
      <Tooltip content="Limpiar las celdas seleccionadas (⌫)" placement="top">
        <button
          onClick={onClear}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 16px',
            borderLeft: '1px solid var(--rule)',
            background: 'var(--card)',
            color: 'var(--ink-2)',
            cursor: 'pointer',
            border: 'none',
            fontFamily: 'var(--sans)',
            fontSize: 12,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--paper-2)'
            e.currentTarget.style.color = 'var(--err)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card)'
            e.currentTarget.style.color = 'var(--ink-2)'
          }}
        >
          <Icon name="x" size={12} /> Limpiar
        </button>
      </Tooltip>
      <Tooltip content="Cerrar selección (Esc)" placement="top">
        <button
          onClick={onDismiss}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 14px',
            borderLeft: '1px solid var(--rule)',
            background: 'var(--paper-2)',
            color: 'var(--ink-3)',
            cursor: 'pointer',
            border: 'none',
          }}
          aria-label="Cerrar"
        >
          <Icon name="x" size={14} />
        </button>
      </Tooltip>
    </div>
  )
}
