import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import type { Employee, ShiftCode } from '../../types'
import { SHIFTS } from '../../constants/shifts'

interface Props {
  open: boolean
  employee: Employee
  day: number
  shift: ShiftCode | undefined
  initialNote: string
  onSave: (note: string) => void
  onClose: () => void
}

export function NoteModal({ open, employee, day, shift, initialNote, onSave, onClose }: Props) {
  const [text, setText] = useState(initialNote)

  useEffect(() => {
    if (open) setText(initialNote)
  }, [open, initialNote])

  const canSave = !!shift

  return (
    <Modal open={open} onClose={onClose} title={`Nota · ${employee.name} · día ${day}`} width={460}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
          {shift
            ? `Turno: ${SHIFTS[shift].label} (${SHIFTS[shift].hours})`
            : 'Sin turno asignado. Asigna un turno antes de añadir una nota.'}
        </div>
        <textarea
          autoFocus
          disabled={!canSave}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: permiso médico, intercambio con Pedro, llegará tarde…"
          rows={5}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid var(--rule)',
            borderRadius: 8,
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontFamily: 'var(--sans)',
            fontSize: 14,
            resize: 'vertical',
            opacity: canSave ? 1 : 0.5,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {initialNote && canSave ? (
            <button
              type="button"
              onClick={() => { onSave(''); onClose() }}
              style={btn('ghost')}
            >
              Borrar nota
            </button>
          ) : <span />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={btn('ghost')}>Cancelar</button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => { onSave(text); onClose() }}
              style={btn('primary')}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function btn(kind: 'primary' | 'ghost'): React.CSSProperties {
  const isPrimary = kind === 'primary'
  return {
    padding: '8px 14px',
    border: '1px solid var(--rule)',
    background: isPrimary ? 'var(--ink)' : 'var(--card)',
    color: isPrimary ? 'var(--card)' : 'var(--ink)',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
  }
}
