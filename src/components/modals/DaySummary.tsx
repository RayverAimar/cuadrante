import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { SHIFT_ORDER, SHIFTS, MONTHS_ES, DOW_ES } from '../../constants/shifts'
import { dowOf, isWeekend } from '../../utils/date'
import { useRosterStore } from '../../store/useRosterStore'
import type { Employee, EmployeeMonth, Holiday, ShiftCode } from '../../types'

interface Props {
  day: number
  year: number
  month: number
  employees: Employee[]
  assignments: EmployeeMonth
  holidayFor: (y: number, m: number, d: number) => Holiday | null
  onClose: () => void
}

export function DaySummary({ day, year, month, employees, assignments, holidayFor, onClose }: Props) {
  const { customHolidays, setCustomHoliday, dayNotes, setDayNote } = useRosterStore()
  const dow = dowOf(year, month, day)
  const isWk = isWeekend(year, month, day)
  const hol = holidayFor(year, month, day)
  const customKey = `${year}-${month}-${day}`
  const isCustom = !!customHolidays[customKey]
  const [localName, setLocalName] = useState(isCustom ? customHolidays[customKey] : '')
  const [editingHol, setEditingHol] = useState(false)
  const existingNote = dayNotes[customKey] || ''
  const [noteDraft, setNoteDraft] = useState(existingNote)

  const byShift: Record<ShiftCode | '_empty', Employee[]> = {
    M: [], T: [], N: [], V: [], L: [], D: [], _empty: [],
  }
  employees.forEach((emp) => {
    const code = assignments[emp.id]?.[day]
    if (code && byShift[code]) byShift[code].push(emp)
    else byShift._empty.push(emp)
  })

  const dateLabel = `${day} de ${MONTHS_ES[month].toLowerCase()} ${year}`
  const dowLabel = DOW_ES[dow]

  return (
    <Modal open={true} onClose={onClose} title={`${dowLabel}, ${dateLabel}`} width={680}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          marginBottom: 16,
          border: '1px solid var(--rule)',
          background: hol ? 'color-mix(in oklch, var(--err) 8%, var(--paper))' : 'var(--paper-2)',
        }}
      >
        <Icon name={hol ? 'flag' : 'calendar'} size={16} />
        <div style={{ flex: 1 }}>
          {hol ? (
            <>
              <div style={{ fontWeight: 600, color: 'var(--err)', fontSize: 14 }}>{hol.name}</div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--ink-3)',
                  letterSpacing: '0.08em',
                  marginTop: 2,
                }}
              >
                {hol.kind === 'national' ? 'FERIADO NACIONAL · PERÚ' : 'FERIADO LOCAL / EMPRESA'}
                {isWk && ' · FIN DE SEMANA'}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {isWk ? 'Fin de semana' : 'Día laboral'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--ink-3)',
                  letterSpacing: '0.08em',
                  marginTop: 2,
                }}
              >
                SIN FERIADO REGISTRADO
              </div>
            </>
          )}
        </div>
        {hol?.kind !== 'national' && !editingHol && (
          <button
            onClick={() => setEditingHol(true)}
            className="cdr-btn cdr-btn--ghost"
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            <Icon name="edit" size={11} /> {isCustom ? 'Editar' : 'Marcar feriado'}
          </button>
        )}
      </div>

      {editingHol && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="cdr-input"
            placeholder="Nombre del feriado local…"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            autoFocus
            style={{ flex: 1, minWidth: 200, padding: '8px 10px', fontSize: 13 }}
          />
          <button
            onClick={() => { setCustomHoliday(year, month, day, localName); setEditingHol(false) }}
            className="cdr-btn cdr-btn--primary"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Guardar
          </button>
          {isCustom && (
            <button
              onClick={() => { setCustomHoliday(year, month, day, ''); setLocalName(''); setEditingHol(false) }}
              className="cdr-btn cdr-btn--ghost"
              style={{ fontSize: 12, padding: '6px 10px', color: 'var(--err)' }}
            >
              Quitar
            </button>
          )}
          <button
            onClick={() => {
              setEditingHol(false)
              setLocalName(isCustom ? customHolidays[customKey] : '')
            }}
            className="cdr-btn cdr-btn--ghost"
            style={{ fontSize: 12, padding: '6px 10px' }}
          >
            Cancelar
          </button>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div className="cdr-eyebrow" style={{ marginBottom: 8 }}>NOTA DEL DÍA</div>
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Agrega una nota general para este día (visible para todo el equipo)…"
          rows={2}
          style={{
            width: '100%',
            padding: '8px 10px',
            fontFamily: 'var(--sans)',
            fontSize: 13,
            border: '1px solid var(--rule)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        {noteDraft !== existingNote && (
          <div style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setNoteDraft(existingNote)}
              className="cdr-btn cdr-btn--ghost"
              style={{ fontSize: 12, padding: '5px 10px' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => setDayNote(year, month, day, noteDraft)}
              className="cdr-btn cdr-btn--primary"
              style={{ fontSize: 12, padding: '5px 12px' }}
            >
              Guardar nota
            </button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div className="cdr-eyebrow" style={{ marginBottom: 10 }}>CRONOLOGÍA DEL DÍA</div>
        {SHIFT_ORDER.map((code) => {
          const sh = SHIFTS[code]
          const list = byShift[code]
          if (!list || list.length === 0) return null
          return (
            <div
              key={code}
              style={{
                display: 'grid',
                gridTemplateColumns: '64px 1fr auto',
                alignItems: 'start',
                gap: 12,
                padding: '10px 0',
                borderTop: '1px solid var(--rule)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    background: `var(--${code}-bg)`,
                    color: `var(--${code}-fg)`,
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {code}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                  {sh.label.split(' ')[0].toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {list.map((emp) => (
                  <span
                    key={emp.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 8px',
                      border: '1px solid var(--rule)',
                      fontSize: 12,
                      background: 'var(--paper)',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: emp.avatarColor }} />
                    {emp.name}
                  </span>
                ))}
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)', fontWeight: 700 }}>
                {list.length}
              </span>
            </div>
          )
        })}
        {byShift._empty.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr auto',
              alignItems: 'start',
              gap: 12,
              padding: '10px 0',
              borderTop: '1px solid var(--rule)',
              borderBottom: '1px solid var(--rule)',
              opacity: 0.7,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  border: '1px dashed var(--rule)',
                  color: 'var(--ink-3)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                }}
              >
                ·
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                SIN ASIG.
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {byShift._empty.map((emp) => (
                <span key={emp.id} style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {emp.name}
                </span>
              ))}
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
              {byShift._empty.length}
            </span>
          </div>
        )}
      </div>
    </Modal>
  )
}
