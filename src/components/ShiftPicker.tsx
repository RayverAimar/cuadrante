import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { Fragment, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import type { ShiftCode, Employee } from '../types'
import { ALL_SHIFT_CODES, SHIFT_DEFS } from '../constants/shifts'
import { useRosterStore } from '../store/useRosterStore'

interface ShiftPickerProps {
  employee: Employee
  day: number
  currentAssignment: ShiftCode | null
  children: ReactNode
}

export function ShiftPicker({ employee, day, currentAssignment, children }: ShiftPickerProps) {
  const setAssignment = useRosterStore((s) => s.setAssignment)
  const effective = currentAssignment ?? employee.defaultShift

  return (
    <Popover className="relative">
      {({ close }) => (
        <>
          <PopoverButton as={Fragment}>{children}</PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel className="absolute left-0 z-50 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
              {/* Header */}
              <div className="px-2 pb-2 mb-1 border-b border-gray-100">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {employee.name}
                </p>
                <p className="text-xs text-gray-400">Día {day}</p>
              </div>

              {/* Shift options */}
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_SHIFT_CODES.map((code) => {
                  const def = SHIFT_DEFS[code]
                  const isActive = effective === code
                  return (
                    <button
                      key={code}
                      onClick={() => {
                        setAssignment(employee.id, day, code)
                        close()
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-all hover:scale-[1.02] hover:shadow-sm"
                      style={{
                        backgroundColor: def.bg,
                        color: def.color,
                        outline: isActive ? `2px solid ${def.color}` : 'none',
                        outlineOffset: '-1px',
                      }}
                    >
                      <span className="text-sm">{def.icon}</span>
                      {def.label}
                    </button>
                  )
                })}
              </div>

              {/* Clear / restore default */}
              <button
                onClick={() => {
                  setAssignment(employee.id, day, null)
                  close()
                }}
                className="mt-1.5 flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-200 px-2.5 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw size={12} />
                Restaurar turno por defecto ({SHIFT_DEFS[employee.defaultShift].label})
              </button>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  )
}
