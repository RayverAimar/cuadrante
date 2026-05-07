import { type ReactNode, useState, useRef } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  placement?: 'top' | 'bottom'
}

export function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), 400)
  }
  const hide = () => {
    if (timer.current) clearTimeout(timer.current)
    setVisible(false)
  }

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <span
          className={`pointer-events-none absolute z-50 w-max max-w-xs rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg animate-fade-in
            ${placement === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'}`}
        >
          {content}
          <span
            className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent
              ${placement === 'top' ? 'top-full border-t-gray-900' : 'bottom-full border-b-gray-900'}`}
          />
        </span>
      )}
    </span>
  )
}
