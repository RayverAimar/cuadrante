import { useEffect, useState } from 'react'
import type { Employee, RuleIssue, ShiftCode } from '../../types'
import { SHIFTS } from '../../constants/shifts'
import { DEFAULT_RULES } from '../../rules'
import { Icon } from '../ui/Icon'

const RULE_LABEL: Record<string, string> = Object.fromEntries(
  DEFAULT_RULES.map((r) => [r.id, r.name]),
)

interface SidePanelProps {
  issues: RuleIssue[]
  employees: Employee[]
  coverage: Record<ShiftCode, Record<number, number>>
  dim: number
  open: boolean
  onClose: () => void
}

export function SidePanel({ issues, employees, coverage, dim, open, onClose }: SidePanelProps) {
  const errs = issues.filter((i) => i.level === 'error')
  const warns = issues.filter((i) => i.level === 'warn')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Two-state animation: keep the DOM mounted briefly after `open` flips to
  // false so the slide-out transition can play, then unmount.
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const EXIT_MS = 360
  useEffect(() => {
    if (open) {
      setMounted(true)
      // Two RAFs so the browser commits the initial off-screen styles before
      // the transition target is applied — otherwise some browsers skip the
      // enter transition.
      let r2 = 0
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setShown(true))
      })
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
    }
    setShown(false)
    const id = window.setTimeout(() => setMounted(false), EXIT_MS)
    return () => window.clearTimeout(id)
  }, [open])

  if (!mounted) return null

  return (
    <>
      <div
        onClick={onClose}
        className="cdr-no-print"
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.22)',
          opacity: shown ? 1 : 0,
          transition: 'opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
          zIndex: 80,
        }}
      />
    <aside
      className="cdr-no-print"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        maxWidth: '90vw',
        border: '1px solid var(--rule)',
        background: 'var(--card)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 90,
        boxShadow: shown ? '-16px 0 40px rgba(0,0,0,0.14)' : '-16px 0 40px rgba(0,0,0,0)',
        transform: shown ? 'translateX(0)' : 'translateX(100%)',
        opacity: shown ? 1 : 0.6,
        transition:
          'transform 0.36s cubic-bezier(0.22, 1, 0.36, 1),' +
          ' opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1),' +
          ' box-shadow 0.36s ease',
        willChange: 'transform, opacity',
      }}
    >
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <span className="cdr-eyebrow">VALIDACIÓN</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
            {issues.length} ITEM{issues.length !== 1 ? 'S' : ''}
          </span>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--ink-3)', padding: 2, lineHeight: 1, fontSize: 18,
            }}
          >
            ×
          </button>
        </span>
      </div>

      {issues.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              margin: '8px auto 16px',
              display: 'grid',
              placeItems: 'center',
              border: '1px solid var(--ok)',
              color: 'var(--ok)',
            }}
          >
            <Icon name="check" size={20} strokeWidth={1.8} />
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 14 }}>
            Cuadrante válido
          </div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--ink-3)',
              marginTop: 4,
              letterSpacing: '0.08em',
            }}
          >
            TODAS LAS REGLAS SE CUMPLEN
          </div>
        </div>
      ) : (
        <div>
          {errs.length > 0 && <IssueGroup title="INFRACCIONES" color="var(--err)" issues={errs} />}
          {warns.length > 0 && <IssueGroup title="AVISOS" color="var(--warn)" issues={warns} />}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--rule)', padding: '16px 18px' }}>
        <div className="cdr-eyebrow" style={{ marginBottom: 12 }}>COBERTURA TOTAL DEL MES</div>
        {(['M', 'T', 'N', 'V', 'L', 'D'] as ShiftCode[]).map((code) => {
          const total = Object.values(coverage[code]).reduce((s, v) => s + v, 0)
          const denom = Math.max(employees.length * dim, 1)
          const pct = (total / denom) * 100
          return (
            <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  display: 'grid',
                  placeItems: 'center',
                  background: `var(--${code}-bg)`,
                  color: `var(--${code}-fg)`,
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {code}
              </span>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 12, flex: 1 }}>{SHIFTS[code].label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)' }}>{total}</span>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--ink-3)',
                  width: 38,
                  textAlign: 'right',
                }}
              >
                {pct.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </aside>
    </>
  )
}

function IssueGroup({ title, color, issues }: { title: string; color: string; issues: RuleIssue[] }) {
  return (
    <div>
      <div
        style={{
          padding: '10px 18px',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.1em',
          fontWeight: 600,
          color,
          borderBottom: '1px solid var(--rule)',
          background: 'var(--paper-2)',
        }}
      >
        {title} · {issues.length}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {issues.map((it, i) => (
          <li
            key={i}
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid var(--rule)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ color, marginTop: 2, flexShrink: 0 }}>
              <Icon name="alert" size={14} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--ink)' }}>{it.msg}</div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: 'var(--ink-3)',
                }}
              >
                {RULE_LABEL[it.ruleId] || it.ruleId}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
