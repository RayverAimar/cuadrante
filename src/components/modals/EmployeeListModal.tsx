import { useState } from 'react'
import { Pencil, Trash2, UserX } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useRosterStore } from '../../store/useRosterStore'
import { SHIFT_DEFS, SHIFT_GROUPS } from '../../constants/shifts'
import { getInitials } from '../../utils/date'
import type { Employee } from '../../types'
import { EmployeeModal } from './EmployeeModal'

interface EmployeeListModalProps {
  open: boolean
  onClose: () => void
}

export function EmployeeListModal({ open, onClose }: EmployeeListModalProps) {
  const { employees, removeEmployee } = useRosterStore()
  const [editing, setEditing] = useState<Employee | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const handleEdit = (emp: Employee) => {
    setEditing(emp)
    setEditOpen(true)
  }

  const handleDelete = (emp: Employee) => {
    if (window.confirm(`¿Eliminar a "${emp.name}" y todas sus asignaciones del año?`)) {
      removeEmployee(emp.id)
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="👥 Empleados" size="md">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <UserX size={36} className="text-gray-300" />
            <p className="text-sm text-gray-500">No hay empleados cargados.</p>
            <p className="text-xs text-gray-400">Usá el botón "Agregar empleado" en el encabezado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {SHIFT_GROUPS.map((sk) => {
              const group = employees.filter((e) => e.defaultShift === sk)
              if (group.length === 0) return null
              const def = SHIFT_DEFS[sk]
              return (
                <section key={sk}>
                  <h3
                    className="mb-2 text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: def.color }}
                  >
                    {def.icon} Turno {def.label}
                  </h3>
                  <div className="space-y-1">
                    {group.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ backgroundColor: emp.avatarColor }}
                        >
                          {getInitials(emp.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{emp.name}</p>
                          <p className="text-[11px] text-gray-400">{emp.role || '—'}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(emp)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(emp)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Listo
          </button>
        </div>
      </Modal>

      {/* Edit employee modal */}
      <EmployeeModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editEmployee={editing}
      />
    </>
  )
}
