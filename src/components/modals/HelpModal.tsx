import { Modal } from '../ui/Modal'
import { HelpCircle } from 'lucide-react'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

const steps = [
  {
    emoji: '📅',
    title: 'Navegar el mes',
    desc: 'Usá las flechas "‹" y "›" en el encabezado para moverte entre meses. Los datos se guardan por mes.',
  },
  {
    emoji: '🖱️',
    title: 'Asignar un turno',
    desc: 'Hacé clic en cualquier celda de la planilla. Se abre un selector con los tipos de turno disponibles: Mañana, Tarde, Noche, Vacaciones, Licencia o Descanso.',
  },
  {
    emoji: '🔄',
    title: 'Restaurar turno por defecto',
    desc: 'En el selector de turno, elegí "Restaurar turno por defecto" para que la celda vuelva a mostrar el turno habitual del empleado (aparece en color más suave).',
  },
  {
    emoji: '⚠️',
    title: 'Celdas marcadas en rojo',
    desc: 'Las celdas con borde rojo indican una infracción de regla. Pasá el cursor encima para ver el detalle, o mirá el panel de "Validaciones" a la derecha.',
  },
  {
    emoji: '👥',
    title: 'Gestionar empleados',
    desc: 'Usá el botón "Empleados" para ver, editar o eliminar al personal. Con "+ Agregar empleado" incorporás nuevos, asignándoles nombre, cargo, turno base y color de avatar.',
  },
  {
    emoji: '⚙️',
    title: 'Configurar reglas',
    desc: 'Con el botón "Reglas" activás o desactivás cada validación y ajustás sus parámetros (ej. límite de días de vacaciones). Las reglas nuevas se agregan en el código sin tocar la UI.',
  },
  {
    emoji: '🖨️',
    title: 'Imprimir',
    desc: 'El botón "Imprimir" abre el diálogo de impresión con la planilla optimizada para papel. El panel lateral y los botones se ocultan automáticamente.',
  },
  {
    emoji: '💾',
    title: 'Guardado automático',
    desc: 'Todo se guarda automáticamente en el navegador (localStorage). No hace falta exportar ni confirmar. Los datos persisten entre sesiones.',
  },
]

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <HelpCircle size={18} className="text-blue-600" />
          Ayuda — Cómo usar Cuadrante
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {steps.map((s) => (
          <div
            key={s.title}
            className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
          >
            <span className="text-2xl shrink-0">{s.emoji}</span>
            <div>
              <h3 className="text-xs font-bold text-gray-800 mb-0.5">{s.title}</h3>
              <p className="text-xs text-gray-500 leading-snug">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
        <button
          onClick={onClose}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Entendido
        </button>
      </div>
    </Modal>
  )
}
