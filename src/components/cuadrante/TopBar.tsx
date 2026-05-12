import { useEffect, useState, type CSSProperties } from 'react'
import { Tooltip } from '../ui/Tooltip'
import { Icon } from '../ui/Icon'
import { MONTHS_ES } from '../../constants/shifts'
import { useAuth, signOut } from '../../lib/useAuth'

interface TopBarProps {
  year: number
  month: number
  setYear: (y: number) => void
  setMonth: (m: number) => void
  onPrev: () => void
  onNext: () => void
  onEmps: () => void
  onRules: () => void
  onHelp: () => void
  onAutoFill: () => void
  onCopyMonth: () => void
  onReport: () => void
  onData: () => void
  onExportCSV: () => void
  onExportXLS: () => void
  onExportPDF: () => void
  errCount: number
  warnCount: number
  onToggleValidation: () => void
  onUndo: () => void
  onRedo: () => void
  onHistory: () => void
  canUndo: boolean
  canRedo: boolean
}

// Render platform-appropriate shortcut hints. Mac users expect ⌘, everyone
// else expects Ctrl — mixing them is the easiest way to confuse a user.
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const UNDO_HINT = isMac ? '⌘Z' : 'Ctrl+Z'
const REDO_HINT = isMac ? '⌘⇧Z' : 'Ctrl+Shift+Z'

export function TopBar(props: TopBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  return (
    <header className="cdr-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="logo" size={18} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>
          CUADRANTE
        </span>
        <span style={{ display: 'inline-flex', gap: 4, marginLeft: 10, paddingLeft: 12, borderLeft: '1px solid var(--rule)' }}>
          <Tooltip content={`Deshacer${props.canUndo ? '' : ' (nada que deshacer)'} · ${UNDO_HINT}`} placement="bottom">
            <button
              onClick={props.onUndo}
              disabled={!props.canUndo}
              className="cdr-iconbtn"
              aria-label="Deshacer"
              style={{ opacity: props.canUndo ? 1 : 0.4, cursor: props.canUndo ? 'pointer' : 'not-allowed' }}
            >
              <Icon name="undo" size={14} />
            </button>
          </Tooltip>
          <Tooltip content={`Rehacer${props.canRedo ? '' : ' (nada que rehacer)'} · ${REDO_HINT}`} placement="bottom">
            <button
              onClick={props.onRedo}
              disabled={!props.canRedo}
              className="cdr-iconbtn"
              aria-label="Rehacer"
              style={{ opacity: props.canRedo ? 1 : 0.4, cursor: props.canRedo ? 'pointer' : 'not-allowed' }}
            >
              <Icon name="redo" size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Historial de cambios" placement="bottom">
            <button onClick={props.onHistory} className="cdr-iconbtn" aria-label="Historial">
              <Icon name="history" size={14} />
            </button>
          </Tooltip>
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 16, position: 'relative' }}>
        <Tooltip content="Mes anterior" placement="bottom">
          <button onClick={props.onPrev} className="cdr-iconbtn" aria-label="Mes anterior">
            <Icon name="arrow-l" size={14} />
          </button>
        </Tooltip>
        <button
          onClick={() => setPickerOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
            color: 'inherit',
            font: 'inherit',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--serif)',
              fontWeight: 500,
              fontSize: 32,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {MONTHS_ES[props.month]}{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>{props.year}</span>
          </h1>
        </button>
        <Tooltip content="Mes siguiente" placement="bottom">
          <button onClick={props.onNext} className="cdr-iconbtn" aria-label="Mes siguiente">
            <Icon name="arrow-r" size={14} />
          </button>
        </Tooltip>
        {pickerOpen && (
          <MonthPicker
            year={props.year}
            month={props.month}
            onPick={(y, m) => {
              props.setYear(y)
              props.setMonth(m)
              setPickerOpen(false)
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        {(props.errCount > 0 || props.warnCount > 0) && (
          <StatusPill
            errCount={props.errCount}
            warnCount={props.warnCount}
            onClick={props.onToggleValidation}
          />
        )}

        <Tooltip
          content="Llenado automático inteligente — completa días vacíos respetando reglas"
          placement="bottom"
        >
          <button
            onClick={props.onAutoFill}
            className="cdr-btn cdr-btn--primary"
            style={{ fontSize: 12, padding: '0 12px', height: 28 }}
          >
            <Icon name="sparkles" size={14} /> Auto-llenar
          </button>
        </Tooltip>

        <div style={{ position: 'relative' }}>
          <Tooltip content="Exportar el cuadrante" placement="bottom">
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="cdr-iconbtn"
              aria-label="Exportar"
            >
              <Icon name="download" size={14} />
            </button>
          </Tooltip>
          {exportOpen && (
            <ExportMenu
              onClose={() => setExportOpen(false)}
              onCSV={() => { props.onExportCSV(); setExportOpen(false) }}
              onXLS={() => { props.onExportXLS(); setExportOpen(false) }}
              onPDF={() => { props.onExportPDF(); setExportOpen(false) }}
            />
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <Tooltip content="Más acciones" placement="bottom">
            <button
              onClick={() => setMoreOpen((o) => !o)}
              className="cdr-iconbtn"
              aria-label="Más acciones"
            >
              <Icon name="more" size={14} />
            </button>
          </Tooltip>
          {moreOpen && (
            <OverflowMenu
              onClose={() => setMoreOpen(false)}
              onEmps={props.onEmps}
              onRules={props.onRules}
              onHelp={props.onHelp}
              onReport={props.onReport}
              onData={props.onData}
              onCopyMonth={props.onCopyMonth}
            />
          )}
        </div>

        <UserMenu />
      </div>
    </header>
  )
}

function UserMenu() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  if (!user) return null
  const meta = (user.user_metadata || {}) as Record<string, unknown>
  const fullName = typeof meta.full_name === 'string' ? meta.full_name : typeof meta.name === 'string' ? meta.name : ''
  const avatarUrl = typeof meta.avatar_url === 'string' ? meta.avatar_url : typeof meta.picture === 'string' ? meta.picture : ''
  const email = user.email || ''
  const initial = (fullName || email).trim().charAt(0).toUpperCase() || '?'

  return (
    <div style={{ position: 'relative', marginLeft: 4 }}>
      <Tooltip content={fullName || email} placement="bottom">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Cuenta"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid var(--rule)',
            padding: 0,
            cursor: 'pointer',
            background: 'var(--paper-2)',
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--ink)',
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initial
          )}
        </button>
      </Tooltip>
      {open && <UserMenuDropdown fullName={fullName} email={email} avatarUrl={avatarUrl} initial={initial} onClose={() => setOpen(false)} />}
    </div>
  )
}

function UserMenuDropdown({
  fullName, email, avatarUrl, initial, onClose,
}: { fullName: string; email: string; avatarUrl: string; initial: string; onClose: () => void }) {
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
  )
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('cuadrante:theme', next) } catch { /* storage disabled */ }
    setTheme(next)
  }

  useEffect(() => {
    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t || !t.closest || !t.closest('[data-cdr-user]')) onClose()
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const id = window.setTimeout(() => window.addEventListener('mousedown', click), 0)
    window.addEventListener('keydown', esc)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('mousedown', click)
      window.removeEventListener('keydown', esc)
    }
  }, [onClose])

  return (
    <div
      data-cdr-user
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 6,
        zIndex: 80,
        background: 'var(--card)',
        border: '1px solid var(--ink)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        minWidth: 240,
        animation: 'cdr-pop .14s cubic-bezier(.2,.7,.2,1)',
      }}
    >
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '1px solid var(--rule)', overflow: 'hidden',
            display: 'grid', placeItems: 'center',
            background: 'var(--paper-2)',
            fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 16,
            color: 'var(--ink)',
            flexShrink: 0,
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : initial}
        </div>
        <div style={{ minWidth: 0 }}>
          {fullName && (
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fullName}
            </div>
          )}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </div>
        </div>
      </div>
      <button onClick={toggleTheme} className="cdr-menuitem">
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={14} />
        <span style={{ flex: 1 }}>Tema {theme === 'light' ? 'oscuro' : 'claro'}</span>
      </button>
      <div style={{ borderTop: '1px solid var(--rule)' }} />
      <button onClick={() => { onClose(); signOut() }} className="cdr-menuitem">
        <Icon name="logout" size={14} />
        <span style={{ flex: 1 }}>Cerrar sesión</span>
      </button>
    </div>
  )
}

function pillBase(color: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 7px',
    fontFamily: 'var(--mono)',
    fontSize: 11,
    fontWeight: 700,
    color,
    border: `1px solid ${color}`,
  }
}

function StatusPill({
  errCount, warnCount, onClick,
}: {
  errCount: number
  warnCount: number
  onClick: () => void
}) {
  const btn: CSSProperties = { background: 'transparent', cursor: 'pointer' }
  return (
    <span style={{ display: 'inline-flex', gap: 6 }}>
      {errCount > 0 && (
        <Tooltip
          content={`${errCount} infraccion${errCount === 1 ? '' : 'es'} — abrir panel de validación.`}
          placement="bottom"
        >
          <button onClick={onClick} style={{ ...pillBase('var(--err)'), ...btn }}>
            <Icon name="alert" size={11} /> {errCount}
          </button>
        </Tooltip>
      )}
      {warnCount > 0 && (
        <Tooltip
          content={`${warnCount} aviso${warnCount === 1 ? '' : 's'} — abrir panel de validación.`}
          placement="bottom"
        >
          <button onClick={onClick} style={{ ...pillBase('var(--warn)'), ...btn }}>
            <Icon name="alert" size={11} /> {warnCount}
          </button>
        </Tooltip>
      )}
    </span>
  )
}

function MonthPicker({
  year, month, onPick, onClose,
}: {
  year: number
  month: number
  onPick: (y: number, m: number) => void
  onClose: () => void
}) {
  const [y, setY] = useState(year)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t || !t.closest || !t.closest('[data-cdr-picker]')) onClose()
    }
    window.addEventListener('keydown', esc)
    const id = window.setTimeout(() => window.addEventListener('mousedown', click), 0)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', esc)
      window.removeEventListener('mousedown', click)
    }
  }, [onClose])
  return (
    <div
      data-cdr-picker
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: 8,
        zIndex: 100,
        background: 'var(--card)',
        border: '1px solid var(--ink)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        width: 360,
        animation: 'cdr-pop .14s cubic-bezier(.2,.7,.2,1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--paper-2)',
        }}
      >
        <button onClick={() => setY(y - 1)} className="cdr-iconbtn" aria-label="Año anterior">
          <Icon name="arrow-l" size={12} />
        </button>
        <span style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 22 }}>{y}</span>
        <button onClick={() => setY(y + 1)} className="cdr-iconbtn" aria-label="Año siguiente">
          <Icon name="arrow-r" size={12} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {MONTHS_ES.map((name, i) => {
          const isCurrent = y === year && i === month
          return (
            <button
              key={i}
              onClick={() => onPick(y, i)}
              style={{
                padding: '14px 10px',
                borderRight: i % 3 === 2 ? 'none' : '1px solid var(--rule)',
                borderBottom: i < 9 ? '1px solid var(--rule)' : 'none',
                background: isCurrent ? 'var(--ink)' : 'var(--card)',
                color: isCurrent ? 'var(--paper)' : 'var(--ink)',
                fontFamily: 'var(--sans)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'center',
                border: 'none',
              }}
              onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = 'var(--paper-2)' }}
              onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = 'var(--card)' }}
            >
              {name.slice(0, 3).toUpperCase()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ExportMenu({
  onClose, onCSV, onXLS, onPDF,
}: { onClose: () => void; onCSV: () => void; onXLS: () => void; onPDF: () => void }) {
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t || !t.closest || !t.closest('[data-cdr-export]')) onClose()
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const id = window.setTimeout(() => window.addEventListener('mousedown', click), 0)
    window.addEventListener('keydown', esc)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('mousedown', click)
      window.removeEventListener('keydown', esc)
    }
  }, [onClose])
  const items = [
    { label: 'PDF',   sub: 'Imprimir o guardar', icon: 'print' as const,    onClick: onPDF },
    { label: 'Excel', sub: '.xls con formato',   icon: 'grid' as const,     onClick: onXLS },
    { label: 'CSV',   sub: 'Texto plano',        icon: 'download' as const, onClick: onCSV },
  ]
  return (
    <div
      data-cdr-export
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 6,
        zIndex: 80,
        background: 'var(--card)',
        border: '1px solid var(--ink)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        minWidth: 220,
        animation: 'cdr-pop .14s cubic-bezier(.2,.7,.2,1)',
      }}
    >
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
        <span className="cdr-eyebrow">EXPORTAR</span>
      </div>
      {items.map((it, i) => (
        <button key={i} onClick={it.onClick} className="cdr-menuitem">
          <Icon name={it.icon} size={16} />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600 }}>{it.label}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{it.sub}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function OverflowMenu({
  onClose, onEmps, onRules, onHelp, onReport, onData, onCopyMonth,
}: {
  onClose: () => void
  onEmps: () => void
  onRules: () => void
  onHelp: () => void
  onReport: () => void
  onData: () => void
  onCopyMonth: () => void
}) {
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t || !t.closest || !t.closest('[data-cdr-overflow]')) onClose()
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const id = window.setTimeout(() => window.addEventListener('mousedown', click), 0)
    window.addEventListener('keydown', esc)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('mousedown', click)
      window.removeEventListener('keydown', esc)
    }
  }, [onClose])

  type Item =
    | { divider: true }
    | {
        icon: 'users' | 'shield' | 'help' | 'calendar' | 'database' | 'copy'
        label: string
        onClick: () => void
      }
  const items: Item[] = [
    { icon: 'copy',     label: 'Copiar mes',      onClick: onCopyMonth },
    { icon: 'calendar', label: 'Reporte del mes', onClick: onReport },
    { divider: true },
    { icon: 'users',    label: 'Empleados',       onClick: onEmps },
    { icon: 'shield',   label: 'Reglas',          onClick: onRules },
    { icon: 'database', label: 'Datos · año',     onClick: onData },
    { divider: true },
    { icon: 'help',     label: 'Ayuda',           onClick: onHelp },
  ]
  return (
    <div
      data-cdr-overflow
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 6,
        zIndex: 80,
        background: 'var(--card)',
        border: '1px solid var(--ink)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        minWidth: 220,
        animation: 'cdr-pop .14s cubic-bezier(.2,.7,.2,1)',
      }}
    >
      {items.map((it, i) => {
        if ('divider' in it) return <div key={i} style={{ borderTop: '1px solid var(--rule)' }} />
        return (
          <button
            key={i}
            onClick={() => { it.onClick(); onClose() }}
            className="cdr-menuitem"
          >
            <Icon name={it.icon} size={14} />
            <span style={{ flex: 1 }}>{it.label}</span>
          </button>
        )
      })}
    </div>
  )
}
