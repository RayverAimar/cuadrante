import {
  type ReactElement,
  type MouseEvent as RMouseEvent,
  type FocusEvent as RFocusEvent,
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  children: ReactElement
  content: React.ReactNode
  placement?: TooltipPlacement
  delay?: number
}

interface ChildHandlerProps {
  onMouseEnter?: (e: RMouseEvent<HTMLElement>) => void
  onMouseLeave?: (e: RMouseEvent<HTMLElement>) => void
  onFocus?: (e: RFocusEvent<HTMLElement>) => void
  onBlur?: (e: RFocusEvent<HTMLElement>) => void
}

/**
 * Tooltip avoids any wrapping element by cloning the single child and
 * attaching handlers directly. The tooltip itself is portaled into the body
 * via fixed positioning. The child must be a single React element.
 */
export function Tooltip({ children, content, placement = 'top', delay = 200 }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const tRef = useRef<number | null>(null)
  const tipRef = useRef<HTMLDivElement | null>(null)
  const targetRectRef = useRef<DOMRect | null>(null)
  const [coords, setCoords] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    if (!open || !tipRef.current || !targetRectRef.current) return
    const r = targetRectRef.current
    const t = tipRef.current.getBoundingClientRect()
    let x = r.left + r.width / 2 - t.width / 2
    let y = r.top - t.height - 8
    if (placement === 'bottom') y = r.bottom + 8
    if (placement === 'right')  { x = r.right + 8;  y = r.top + r.height / 2 - t.height / 2 }
    if (placement === 'left')   { x = r.left - t.width - 8; y = r.top + r.height / 2 - t.height / 2 }
    x = Math.max(8, Math.min(window.innerWidth - t.width - 8, x))
    y = Math.max(8, Math.min(window.innerHeight - t.height - 8, y))
    setCoords({ x, y })
  }, [open, content, placement])

  useEffect(() => () => {
    if (tRef.current != null) window.clearTimeout(tRef.current)
  }, [])

  if (!isValidElement<ChildHandlerProps>(children)) return children

  const captureRect = (target: EventTarget & Element) => {
    targetRectRef.current = target.getBoundingClientRect()
  }

  const show = (e: RMouseEvent<HTMLElement> | RFocusEvent<HTMLElement>) => {
    captureRect(e.currentTarget)
    if (tRef.current != null) window.clearTimeout(tRef.current)
    tRef.current = window.setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    if (tRef.current != null) window.clearTimeout(tRef.current)
    setOpen(false)
  }

  const childProps = children.props
  const cloned = cloneElement(children, {
    onMouseEnter: (e: RMouseEvent<HTMLElement>) => { childProps.onMouseEnter?.(e); show(e) },
    onMouseLeave: (e: RMouseEvent<HTMLElement>) => { childProps.onMouseLeave?.(e); hide() },
    onFocus:      (e: RFocusEvent<HTMLElement>) => { childProps.onFocus?.(e); show(e) },
    onBlur:       (e: RFocusEvent<HTMLElement>) => { childProps.onBlur?.(e); hide() },
  })

  const tip =
    open && content != null
      ? createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            style={{
              position: 'fixed',
              left: coords.x,
              top: coords.y,
              zIndex: 1000,
              pointerEvents: 'none',
              background: 'var(--ink)',
              color: 'var(--paper)',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              lineHeight: 1.4,
              padding: '8px 10px',
              maxWidth: 280,
              letterSpacing: '0.02em',
              whiteSpace: 'pre-wrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            }}
          >
            {content}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {cloned}
      {tip}
    </>
  )
}
