import { type CSSProperties, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { signInWithGoogle, signOut } from '../lib/useAuth'
import { Icon } from './ui/Icon'
import { ThemeToggle } from './ui/ThemeToggle'
import type { ShiftCode } from '../types'

interface Props {
  user: User | null
  notAllowed?: boolean
}

export function Login({ user, notAllowed }: Props) {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setTime(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const stamp = time.toLocaleTimeString('es-PE', { hour12: false }) + ' · LIMA, PE'

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: `
          linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
        backgroundPosition: '-1px -1px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          padding: '20px 40px',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--paper)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="logo" size={18} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>
            CUADRANTE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="cdr-hide-mobile" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
            {stamp}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <section
        className="cdr-landing-hero-grid"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '6fr 5fr',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <div className="cdr-landing-hero" style={{ padding: '72px 48px 56px', borderRight: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span className="cdr-eyebrow" style={{ marginBottom: 24, color: 'var(--accent)' }}>
            ACCESO RESTRINGIDO
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(48px, 6.5vw, 92px)',
              lineHeight: 0.94,
              letterSpacing: '-0.04em',
              fontWeight: 500,
            }}
          >
            La planilla<br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>en su</em>{' '}
            <span
              style={{
                textDecoration: 'underline',
                textDecorationThickness: '0.055em',
                textUnderlineOffset: '0.08em',
              }}
            >
              sitio.
            </span>
          </h1>

          {notAllowed && user ? (
            <NotAllowedBlock email={user.email || ''} />
          ) : (
            <SignInBlock />
          )}
        </div>

        <div
          style={{
            padding: '64px 40px 56px',
            background: 'var(--paper-2)',
            position: 'relative',
            minWidth: 0,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <MiniRoster />
        </div>
      </section>

      <footer
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '20px 40px',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--ink-3)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          HECHO EN <PeruFlag />
        </div>
        <div style={{ letterSpacing: '0.12em' }}>© {new Date().getFullYear()} · CUADRANTE</div>
        <div style={{ textAlign: 'right' }}>
          <a
            href="https://www.linkedin.com/in/ray-emece"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'inherit',
              textDecoration: 'none',
              transition: 'color 0.12s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '' }}
          >
            <LinkedInIcon />
            CONTACTO
          </a>
        </div>
      </footer>
    </div>
  )
}

function SignInBlock() {
  return (
    <div style={{ marginTop: 36, maxWidth: 480 }}>
      <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: 'var(--ink-2)' }}>
        Esta herramienta es solo para personal autorizado. Inicia sesión con tu cuenta de Google
        de la empresa para continuar.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 32, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          className="cdr-btn cdr-btn--primary"
          onClick={signInWithGoogle}
          style={{ padding: '14px 22px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 10 }}
        >
          <GoogleIcon />
          Continuar con Google
        </button>
      </div>
    </div>
  )
}

function NotAllowedBlock({ email }: { email: string }) {
  return (
    <div style={{ marginTop: 36, maxWidth: 540 }}>
      <div
        style={{
          padding: '16px 18px',
          background: 'color-mix(in oklch, var(--err) 8%, var(--card))',
          border: '1px solid color-mix(in oklch, var(--err) 30%, var(--rule))',
          borderLeft: '3px solid var(--err)',
        }}
      >
        <div
          className="cdr-eyebrow"
          style={{ color: 'var(--err)', marginBottom: 6 }}
        >
          ACCESO DENEGADO
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink)' }}>
          El correo <strong style={{ fontFamily: 'var(--mono)' }}>{email}</strong> no está autorizado
          para usar Cuadrante. Pídele al administrador que te agregue al allowlist.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' }}>
        <button
          className="cdr-btn"
          onClick={signOut}
          style={{ padding: '12px 20px', fontSize: 14 }}
        >
          Cerrar sesión
        </button>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
          ↳ vuelve a intentar con otra cuenta
        </span>
      </div>
    </div>
  )
}

function PeruFlag() {
  // 3-stripe vertical: red / white / red.
  return (
    <span
      aria-label="Bandera de Perú"
      style={{
        display: 'inline-flex',
        width: 18,
        height: 12,
        border: '1px solid var(--rule)',
        overflow: 'hidden',
      }}
    >
      <span style={{ flex: 1, background: '#D91023' }} />
      <span style={{ flex: 1, background: '#FFFFFF' }} />
      <span style={{ flex: 1, background: '#D91023' }} />
    </span>
  )
}

function LinkedInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.15 1.45-2.15 2.95v5.67H9.32V9h3.42v1.56h.05c.48-.9 1.64-1.86 3.37-1.86 3.6 0 4.27 2.37 4.27 5.46v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.7 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13.1-5l-6.1-5c-2 1.5-4.4 2.5-7 2.5-5.2 0-9.6-3.2-11.2-7.6l-6.5 5C9.5 39 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.1 5c-.4.4 6.3-4.6 6.3-14.5 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  )
}

function MiniRoster() {
  const days = Array.from({ length: 10 }, (_, i) => i + 1)
  const sample: { name: string; base: ShiftCode; shifts: ShiftCode[] }[] = [
    { name: 'Ana García',     base: 'M', shifts: ['M', 'M', 'M', 'D', 'D', 'M', 'M', 'M', 'M', 'M'] },
    { name: 'Carlos López',   base: 'T', shifts: ['T', 'T', 'D', 'D', 'T', 'T', 'T', 'T', 'D', 'T'] },
    { name: 'M. Rodríguez',   base: 'M', shifts: ['M', 'M', 'V', 'V', 'V', 'V', 'V', 'D', 'M', 'M'] },
    { name: 'Pedro Martínez', base: 'N', shifts: ['N', 'N', 'N', 'D', 'D', 'N', 'N', 'N', 'D', 'N'] },
    { name: 'Laura Sánchez',  base: 'T', shifts: ['T', 'T', 'T', 'D', 'D', 'T', 'T', 'L', 'L', 'L'] },
  ]
  const miniTh: CSSProperties = {
    textAlign: 'left',
    padding: '8px 10px',
    fontFamily: 'var(--mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.1em',
    color: 'var(--ink-3)',
    borderBottom: '1px solid var(--rule)',
    background: 'var(--paper-2)',
  }
  return (
    <div
      style={{
        width: '100%',
        background: 'var(--card)',
        border: '1px solid var(--rule)',
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 14px',
          borderBottom: '1px solid var(--rule)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
        }}
      >
        <span>MAYO · 2026 / VISTA PREVIA</span>
        <span style={{ display: 'inline-flex', gap: 4 }}>
          <span style={{ width: 8, height: 8, background: '#ff5f57', borderRadius: '50%' }} />
          <span style={{ width: 8, height: 8, background: '#febc2e', borderRadius: '50%' }} />
          <span style={{ width: 8, height: 8, background: '#28c840', borderRadius: '50%' }} />
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: 'var(--mono)', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={miniTh}>EMPLEADO</th>
              {days.map((d) => (
                <th key={d} style={{ ...miniTh, textAlign: 'center', width: 26 }}>
                  {String(d).padStart(2, '0')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sample.map((row, i) => (
              <tr key={i}>
                <td
                  style={{
                    padding: '6px 10px',
                    borderTop: '1px solid var(--rule)',
                    fontFamily: 'var(--sans)',
                    fontSize: 12,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      background: `var(--${row.base}-fg)`,
                      marginRight: 8,
                      verticalAlign: 'middle',
                    }}
                  />
                  {row.name}
                </td>
                {row.shifts.map((c, j) => (
                  <td
                    key={j}
                    style={{
                      borderTop: '1px solid var(--rule)',
                      borderLeft: '1px solid var(--rule)',
                      background: `var(--${c}-bg)`,
                      color: `var(--${c}-fg)`,
                      textAlign: 'center',
                      padding: '6px 0',
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--rule)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--ink-3)',
          letterSpacing: '0.08em',
        }}
      >
        ACCESO RESTRINGIDO · INICIA SESIÓN PARA EDITAR
      </div>
    </div>
  )
}
