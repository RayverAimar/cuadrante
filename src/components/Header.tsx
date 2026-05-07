import { ChevronLeft, ChevronRight, Users, Settings, Plus, Printer, HelpCircle } from 'lucide-react'
import { useRosterStore } from '../store/useRosterStore'
import { MONTHS_ES } from '../constants/shifts'
import { Tooltip } from './ui/Tooltip'

interface HeaderProps {
  onAddEmployee: () => void
  onEmployeeList: () => void
  onRules: () => void
  onHelp: () => void
}

export function Header({ onAddEmployee, onEmployeeList, onRules, onHelp }: HeaderProps) {
  const { year, month, prevMonth, nextMonth } = useRosterStore()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 px-5 py-3">
        {/* Logo + title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm select-none">
            C
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-gray-900 leading-tight">Cuadrante</h1>
            <p className="text-[10px] text-gray-400 leading-none">Planilla de turnos</p>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Month nav */}
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
          <Tooltip content="Mes anterior">
            <button
              onClick={prevMonth}
              className="rounded-md p-1.5 text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm transition-all"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
          </Tooltip>

          <span className="min-w-[160px] text-center text-sm font-semibold text-gray-800 select-none px-2">
            {MONTHS_ES[month]} {year}
          </span>

          <Tooltip content="Mes siguiente">
            <button
              onClick={nextMonth}
              className="rounded-md p-1.5 text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm transition-all"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </Tooltip>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Tooltip content="Ver y gestionar empleados">
            <button
              onClick={onEmployeeList}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Users size={14} />
              Empleados
            </button>
          </Tooltip>

          <Tooltip content="Configurar reglas de validación">
            <button
              onClick={onRules}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Settings size={14} />
              Reglas
            </button>
          </Tooltip>

          <Tooltip content="Imprimir planilla">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Printer size={14} />
              Imprimir
            </button>
          </Tooltip>

          <button
            onClick={onAddEmployee}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} />
            Agregar empleado
          </button>

          <Tooltip content="Ayuda e instrucciones">
            <button
              onClick={onHelp}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <HelpCircle size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Legend bar */}
      <div className="flex items-center gap-4 overflow-x-auto px-5 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 whitespace-nowrap">
        <span className="font-semibold text-gray-400 shrink-0">Turnos:</span>
        {[
          { code: 'M', label: 'Mañana 06–14h', bg: '#DBEAFE', color: '#1D4ED8' },
          { code: 'T', label: 'Tarde 14–22h',  bg: '#FEF3C7', color: '#92400E' },
          { code: 'N', label: 'Noche 22–06h',  bg: '#EDE9FE', color: '#5B21B6' },
          { code: 'V', label: 'Vacaciones',     bg: '#D1FAE5', color: '#065F46' },
          { code: 'L', label: 'Licencia c/goce',bg: '#FCE7F3', color: '#9D174D' },
          { code: 'D', label: 'Descanso',       bg: '#F3F4F6', color: '#374151' },
        ].map(({ code, label, bg, color }) => (
          <div key={code} className="flex items-center gap-1.5 shrink-0">
            <span
              className="flex h-5 w-6 items-center justify-center rounded text-[10px] font-bold"
              style={{ backgroundColor: bg, color }}
            >
              {code}
            </span>
            <span>{label}</span>
          </div>
        ))}
        <span className="ml-auto shrink-0 italic text-gray-400">
          Clic en cualquier celda para asignar turno
        </span>
      </div>
    </header>
  )
}
