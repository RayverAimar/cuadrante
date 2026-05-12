import { useEffect, useState } from 'react'
import { Tooltip } from './Tooltip'
import { Icon } from './Icon'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const t = document.documentElement.getAttribute('data-theme')
    return t === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('cuadrante:theme', theme) } catch {}
  }, [theme])

  return (
    <Tooltip
      content={theme === 'light' ? 'Cambiar a oscuro' : 'Cambiar a claro'}
      placement="bottom"
    >
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="cdr-iconbtn"
        aria-label="Cambiar tema"
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={14} />
      </button>
    </Tooltip>
  )
}
