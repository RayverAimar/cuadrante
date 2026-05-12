import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { supabase } from '../../lib/supabase'
import { MONTHS_ES } from '../../constants/shifts'
import { toastError } from '../../store/useToastStore'

interface Props {
  open: boolean
  onClose: () => void
}

interface ChangeRow {
  id: string
  user_email: string
  action: string
  detail: Record<string, unknown>
  created_at: string
}

/** Maps internal action ids to a human-readable label + a short description
 *  built from the `detail` payload. Kept here (not in i18n) because the audit
 *  view is admin-only and Spanish-only for now. */
function describe(row: ChangeRow): { title: string; subtitle: string } {
  const d = row.detail || {}
  const monthLabel = (y: unknown, m: unknown) =>
    typeof y === 'number' && typeof m === 'number' ? `${MONTHS_ES[m]} ${y}` : ''
  switch (row.action) {
    case 'setCell':
      return {
        title: 'Editó una celda',
        subtitle: `${monthLabel(d.year, d.month)} · día ${d.day} · ${d.from ?? '∅'} → ${d.to ?? '∅'}`,
      }
    case 'applyToCells':
      return {
        title: 'Pintó múltiples celdas',
        subtitle: `${monthLabel(d.year, d.month)} · ${d.count} celdas · ${d.code ?? 'borradas'}`,
      }
    case 'replaceMonth':
      return {
        title: 'Reemplazó el mes',
        subtitle: `${monthLabel(d.year, d.month)} · auto-rellenado o importado`,
      }
    case 'setCellNote':
      return {
        title: d.cleared ? 'Quitó nota de celda' : 'Editó nota de celda',
        subtitle: `${monthLabel(d.year, d.month)} · día ${d.day}`,
      }
    case 'setDayNote':
      return {
        title: d.cleared ? 'Quitó nota del día' : 'Editó nota del día',
        subtitle: `${monthLabel(d.year, d.month)} · día ${d.day}`,
      }
    case 'addEmployee':
      return { title: 'Agregó empleado', subtitle: `${d.name}${d.role ? ` · ${d.role}` : ''}` }
    case 'updateEmployee':
      return {
        title: 'Editó empleado',
        subtitle: `${d.name ?? ''} · ${Array.isArray(d.changes) ? d.changes.join(', ') : ''}`,
      }
    case 'archiveEmployee':
      return { title: 'Archivó empleado', subtitle: String(d.name ?? '') }
    case 'restoreEmployee':
      return { title: 'Restauró empleado', subtitle: String(d.name ?? '') }
    case 'removeEmployee':
      return { title: 'Eliminó empleado', subtitle: String(d.name ?? '') }
    case 'setRules':
      return { title: 'Editó reglas', subtitle: '' }
    case 'setCustomHoliday':
      return {
        title: d.name ? 'Marcó feriado local' : 'Quitó feriado local',
        subtitle: `${monthLabel(d.year, d.month)} · día ${d.day}${d.name ? ` · ${d.name}` : ''}`,
      }
    case 'undo':
      return { title: 'Deshizo un cambio', subtitle: monthLabel(d.year, d.month) }
    case 'redo':
      return { title: 'Rehizo un cambio', subtitle: monthLabel(d.year, d.month) }
    default:
      return { title: row.action, subtitle: JSON.stringify(d) }
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `Hoy · ${time}`
  return `${d.toLocaleDateString('es', { day: '2-digit', month: 'short' })} · ${time}`
}

export function HistoryModal({ open, onClose }: Props) {
  const [rows, setRows] = useState<ChangeRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    supabase
      .from('change_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) toastError('Cargar historial', error)
        else setRows((data || []) as ChangeRow[])
        setLoading(false)
      })
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="Historial de cambios" width={720}>
      <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--ink-3)' }}>
        Últimos 200 cambios registrados. El historial se guarda permanentemente y es compartido entre todos los usuarios autorizados.
      </div>

      {loading && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          Cargando…
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          Sin cambios registrados todavía.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div style={{ border: '1px solid var(--rule)', maxHeight: 480, overflow: 'auto' }}>
          {rows.map((r) => {
            const { title, subtitle } = describe(r)
            return (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr auto',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 14px',
                  borderTop: '1px solid var(--rule)',
                  fontSize: 13,
                }}
              >
                <Icon name="dot" size={10} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{title}</div>
                  {subtitle && (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        fontFamily: 'var(--mono)',
                        letterSpacing: '0.02em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {subtitle}
                    </div>
                  )}
                  <div style={{ marginTop: 2, fontSize: 10, color: 'var(--ink-4)' }}>
                    {r.user_email}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.06em',
                    color: 'var(--ink-3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatTime(r.created_at)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
