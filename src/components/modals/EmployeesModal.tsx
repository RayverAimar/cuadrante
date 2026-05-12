import { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Select } from '../ui/Select'
import { useRosterStore } from '../../store/useRosterStore'
import { SHIFTS, AVATAR_COLORS } from '../../constants/shifts'
import type { DefaultShift, Employee } from '../../types'

interface EmployeesModalProps {
  open: boolean
  onClose: () => void
}

export function EmployeesModal({ open, onClose }: EmployeesModalProps) {
  const { employees, addEmployee, updateEmployee, archiveEmployee, restoreEmployee, removeEmployee } = useRosterStore()

  const { active, archived } = useMemo(() => {
    const a: Employee[] = []
    const z: Employee[] = []
    employees.forEach((e) => (e.archivedAt ? z.push(e) : a.push(e)))
    return { active: a, archived: z }
  }, [employees])

  const [showArchived, setShowArchived] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const archive = (emp: Employee) => {
    if (!window.confirm(`Desactivar a ${emp.name}? Su historial se conserva — no aparecerá en meses futuros.`)) return
    archiveEmployee(emp.id)
  }

  const hardDelete = (emp: Employee) => {
    if (!window.confirm(`Eliminar PERMANENTEMENTE a ${emp.name} y todas sus asignaciones. No se puede deshacer.`)) return
    removeEmployee(emp.id)
  }

  const cols = '32px 2fr 1.4fr 64px 72px 32px'

  return (
    <>
      <Modal open={open} onClose={onClose} title="Empleados" width={760}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="cdr-eyebrow">ACTIVOS · {active.length}</span>
          <button className="cdr-btn cdr-btn--primary" onClick={() => setShowNew(true)}>
            <Icon name="plus" size={14} /> Agregar empleado
          </button>
        </div>

        <div style={{ border: '1px solid var(--rule)', marginBottom: 24 }}>
          <HeaderRow cols={cols} />
          {active.map((emp) => (
            <Row key={emp.id} cols={cols}>
              <span style={{ width: 14, height: 14, background: emp.avatarColor, borderRadius: 2 }} />
              <span style={{ fontWeight: 500 }}>{emp.name}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>{emp.role}</span>
              <BaseChip code={emp.base} />
              <VacInput value={emp.vacationBalance} onChange={(n) => updateEmployee(emp.id, { vacationBalance: n })} />
              <button
                onClick={() => archive(emp)}
                className="cdr-iconbtn"
                title="Desactivar (conserva historial)"
                aria-label="Desactivar empleado"
              >
                <Icon name="x" size={12} />
              </button>
            </Row>
          ))}
          {active.length === 0 && (
            <div style={{ padding: 18, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              Aún no hay empleados activos. Pulsa <strong>Agregar empleado</strong>.
            </div>
          )}
        </div>

        {archived.length > 0 && (
          <div style={{ border: '1px solid var(--rule)' }}>
            <button
              onClick={() => setShowArchived((v) => !v)}
              style={{
                width: '100%', padding: '10px 14px', textAlign: 'left',
                background: 'var(--paper-2)', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-3)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Icon name={showArchived ? 'arrow-l' : 'arrow-r'} size={10} />
              ARCHIVADOS · {archived.length}
            </button>
            {showArchived && archived.map((emp) => (
              <div
                key={emp.id}
                style={{
                  display: 'grid', gridTemplateColumns: '32px 2fr 1.4fr auto auto', gap: 8,
                  padding: '8px 14px', borderTop: '1px solid var(--rule)',
                  alignItems: 'center', opacity: 0.7,
                }}
              >
                <span style={{ width: 12, height: 12, background: emp.avatarColor }} />
                <span style={{ fontWeight: 500 }}>{emp.name}</span>
                <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>{emp.role}</span>
                <button
                  onClick={() => restoreEmployee(emp.id)}
                  className="cdr-btn"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  Reactivar
                </button>
                <button
                  onClick={() => hardDelete(emp)}
                  className="cdr-btn cdr-btn--danger"
                  title="Eliminar permanentemente (borra historial)"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {showNew && (
        <NewEmployeeModal
          onClose={() => setShowNew(false)}
          onCreate={(draft) => {
            addEmployee(draft)
            setShowNew(false)
          }}
        />
      )}
    </>
  )
}

interface NewDraft {
  name: string
  role: string
  base: DefaultShift
  avatarColor: string
  vacationBalance: number
}

function NewEmployeeModal({ onClose, onCreate }: { onClose: () => void; onCreate: (d: NewDraft) => void }) {
  const [draft, setDraft] = useState<NewDraft>({
    name: '', role: '', base: 'M', avatarColor: AVATAR_COLORS[0], vacationBalance: 30,
  })
  const valid = draft.name.trim().length > 0

  const submit = () => {
    if (!valid) return
    onCreate({ ...draft, name: draft.name.trim(), role: draft.role.trim() })
  }

  const baseOptions: DefaultShift[] = ['M', 'T', 'N', 'D']

  return (
    <Modal open onClose={onClose} title="Nuevo empleado" width={520}>
      <div style={{ display: 'grid', gap: 14 }}>
        <Field label="Nombre completo">
          <input
            autoFocus
            className="cdr-input"
            placeholder="Ej. María García"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          />
        </Field>
        <Field label="Cargo">
          <input
            className="cdr-input"
            placeholder="Ej. Enfermería"
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Turno base">
            <Select<DefaultShift>
              value={draft.base}
              onChange={(v) => setDraft({ ...draft, base: v })}
              options={baseOptions.map((c) => ({ value: c, label: `${c} · ${SHIFTS[c].label}` }))}
              fullWidth
            />
          </Field>
          <Field label="Saldo vacaciones (días)">
            <input
              type="number"
              className="cdr-input"
              min={0}
              max={365}
              value={draft.vacationBalance}
              onChange={(e) => setDraft({ ...draft, vacationBalance: parseInt(e.target.value || '0', 10) })}
            />
          </Field>
        </div>
        <Field label="Color">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setDraft({ ...draft, avatarColor: c })}
                style={{
                  width: 26, height: 26, background: c,
                  border: draft.avatarColor === c ? '2px solid var(--ink)' : '1px solid var(--rule)',
                  cursor: 'pointer', padding: 0,
                }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
        <button className="cdr-btn cdr-btn--ghost" onClick={onClose}>Cancelar</button>
        <button
          className="cdr-btn cdr-btn--primary"
          onClick={submit}
          disabled={!valid}
          style={!valid ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <Icon name="plus" size={14} /> Crear empleado
        </button>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
        color: 'var(--ink-3)', textTransform: 'uppercase',
      }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function HeaderRow({ cols }: { cols: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cols,
        padding: '8px 12px',
        background: 'var(--paper-2)',
        borderBottom: '1px solid var(--rule)',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-3)',
        letterSpacing: '0.1em',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <span>·</span>
      <span>NOMBRE</span>
      <span>CARGO</span>
      <span>BASE</span>
      <span>VAC.</span>
      <span />
    </div>
  )
}

function Row({ cols, children }: { cols: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cols,
        padding: '10px 12px',
        borderTop: '1px solid var(--rule)',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
    </div>
  )
}

function BaseChip({ code }: { code: DefaultShift }) {
  return (
    <span
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 6px',
        background: `var(--${code}-bg)`,
        color: `var(--${code}-fg)`,
        width: 'fit-content',
      }}
    >
      {code}
    </span>
  )
}

function VacInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [local, setLocal] = useState(String(value))
  return (
    <input
      type="number"
      min={0}
      max={365}
      className="cdr-input"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const n = parseInt(local || '0', 10)
        if (!Number.isNaN(n) && n !== value) onChange(n)
        else setLocal(String(value))
      }}
      style={{ padding: '4px 6px', fontSize: 12, width: 56 }}
      title="Saldo de vacaciones (días)"
    />
  )
}
