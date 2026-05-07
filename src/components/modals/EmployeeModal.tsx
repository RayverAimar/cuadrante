import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Tooltip } from '../ui/Tooltip'
import { useRosterStore } from '../../store/useRosterStore'
import { SHIFT_DEFS, SHIFT_GROUPS, AVATAR_COLORS } from '../../constants/shifts'
import type { DefaultShift, Employee } from '../../types'

interface EmployeeModalProps {
  open: boolean
  onClose: () => void
  editEmployee?: Employee | null
}

const emptyForm = { name: '', role: '', defaultShift: 'M' as DefaultShift, avatarColor: AVATAR_COLORS[0] }

export function EmployeeModal({ open, onClose, editEmployee }: EmployeeModalProps) {
  const { addEmployee, updateEmployee, employees } = useRosterStore()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (editEmployee) {
        setForm({
          name: editEmployee.name,
          role: editEmployee.role,
          defaultShift: editEmployee.defaultShift,
          avatarColor: editEmployee.avatarColor,
        })
      } else {
        setForm({
          ...emptyForm,
          avatarColor: AVATAR_COLORS[employees.length % AVATAR_COLORS.length],
        })
      }
      setError('')
    }
  }, [open, editEmployee, employees.length])

  const handleSave = () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    if (editEmployee) {
      updateEmployee(editEmployee.id, form)
    } else {
      addEmployee(form)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <UserPlus size={18} className="text-blue-600" />
          {editEmployee ? 'Editar empleado' : 'Agregar empleado'}
        </span>
      }
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            autoFocus
            value={form.name}
            onChange={(e) => { setForm({ ...form, name: e.target.value }); setError('') }}
            placeholder="Ej: Ana García"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>

        {/* Role */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Cargo / Posición
          </label>
          <input
            type="text"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="Ej: Guardia, Supervisor..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Default shift */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            Turno base
            <Tooltip content="El turno que se asigna por defecto en días laborables. Se puede sobrescribir celda a celda.">
              <span className="ml-1 cursor-help text-gray-400">ⓘ</span>
            </Tooltip>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SHIFT_GROUPS.map((sk) => {
              const def = SHIFT_DEFS[sk]
              const selected = form.defaultShift === sk
              return (
                <button
                  key={sk}
                  type="button"
                  onClick={() => setForm({ ...form, defaultShift: sk })}
                  className="rounded-xl border-2 p-3 text-center transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: def.bg,
                    borderColor: selected ? def.color : 'transparent',
                  }}
                >
                  <div className="text-xl mb-1">{def.icon}</div>
                  <div className="text-xs font-bold" style={{ color: def.color }}>{def.label}</div>
                  {def.time && <div className="text-[10px] opacity-70" style={{ color: def.color }}>{def.time}</div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Avatar color */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-gray-600">Color de avatar</label>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, avatarColor: c })}
                className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: form.avatarColor === c ? `3px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            {editEmployee ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
