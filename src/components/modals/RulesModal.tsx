import { Settings, RefreshCcw } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Toggle } from '../ui/Toggle'
import { useRosterStore } from '../../store/useRosterStore'

interface RulesModalProps {
  open: boolean
  onClose: () => void
}

export function RulesModal({ open, onClose }: RulesModalProps) {
  const { rules, toggleRule, updateRuleParam, resetRules } = useRosterStore()

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Settings size={18} className="text-blue-600" />
          Configurar Reglas
        </span>
      }
    >
      <p className="mb-4 text-xs text-gray-500">
        Las reglas se validan en tiempo real y marcan las celdas afectadas en la planilla.
        Activá o desactivá cada regla, y ajustá sus parámetros según tu política interna.
      </p>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`rounded-xl border p-4 transition-colors ${
              rule.enabled
                ? 'border-blue-200 bg-blue-50/40'
                : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
          >
            {/* Rule header */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800">{rule.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
              </div>
              <Toggle
                checked={rule.enabled}
                onChange={(v) => toggleRule(rule.id, v)}
                label={`Activar regla: ${rule.name}`}
              />
            </div>

            {/* Rule params */}
            {rule.paramDefs.length > 0 && rule.enabled && (
              <div className="mt-3 space-y-2 border-t border-blue-100 pt-3">
                {rule.paramDefs.map((pd) => (
                  <div key={pd.key} className="flex items-center gap-3">
                    <label className="flex-1 text-xs text-gray-600">{pd.label}:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={pd.min}
                        max={pd.max}
                        value={rule.params[pd.key] ?? pd.min}
                        onChange={(e) => {
                          const val = Math.min(pd.max, Math.max(pd.min, Number(e.target.value)))
                          updateRuleParam(rule.id, pd.key, val)
                        }}
                        className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center text-sm font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="text-xs text-gray-400">días</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Developer hint */}
      <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">
        <p className="text-[11px] text-gray-400">
          <span className="font-semibold">Para agregar una regla nueva</span>: agregá un objeto al
          array <code className="font-mono bg-gray-200 px-1 rounded">DEFAULT_RULES</code> en{' '}
          <code className="font-mono bg-gray-200 px-1 rounded">src/rules/index.ts</code>. No se requiere
          ningún otro cambio — la UI la detecta automáticamente.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <button
          onClick={() => {
            if (window.confirm('¿Restaurar todas las reglas a sus valores por defecto?')) resetRules()
          }}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCcw size={12} />
          Restaurar defaults
        </button>
        <button
          onClick={onClose}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Listo
        </button>
      </div>
    </Modal>
  )
}
