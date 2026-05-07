import { useMemo } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import { useRosterStore } from '../store/useRosterStore'
import { runValidations } from '../rules'
import { getDaysInMonth, monthKey } from '../utils/date'
import type { ShiftCode } from '../types'

export function ViolationsPanel() {
  const { year, month, employees, assignments, rules } = useRosterStore()
  const days = getDaysInMonth(year, month)
  const k = monthKey(year, month)

  const getAssignment = (empId: string, day: number): ShiftCode | null =>
    assignments[k]?.[empId]?.[day] ?? null

  const violations = useMemo(
    () =>
      runValidations(rules, {
        year,
        month,
        employees,
        getAssignment,
        daysInMonth: days,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, year, month, employees, assignments],
  )

  const errors = violations.filter((v) => v.level === 'error')
  const warnings = violations.filter((v) => v.level === 'warning')

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 bg-white animate-slide-in">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          {violations.length === 0 ? (
            <CheckCircle size={16} className="text-emerald-500" />
          ) : errors.length > 0 ? (
            <AlertCircle size={16} className="text-red-500" />
          ) : (
            <AlertTriangle size={16} className="text-amber-500" />
          )}
          <h2 className="text-sm font-bold text-gray-800">Validaciones</h2>
          {violations.length > 0 && (
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                errors.length > 0 ? 'bg-red-500' : 'bg-amber-500'
              }`}
            >
              {violations.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {violations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle size={32} className="text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-700">Todo en orden</p>
            <p className="text-xs text-gray-400">No se detectaron infracciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {errors.length > 0 && (
              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-600">
                  <AlertCircle size={11} /> Errores ({errors.length})
                </h3>
                <div className="space-y-2">
                  {errors.map((v, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-red-200 bg-red-50 p-3"
                    >
                      <p className="text-[11px] font-semibold text-red-800 mb-0.5">
                        {v.ruleName}
                      </p>
                      <p className="text-[11px] text-red-700 leading-snug">{v.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {warnings.length > 0 && (
              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                  <AlertTriangle size={11} /> Avisos ({warnings.length})
                </h3>
                <div className="space-y-2">
                  {warnings.map((v, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                    >
                      <p className="text-[11px] font-semibold text-amber-800 mb-0.5">
                        {v.ruleName}
                      </p>
                      <p className="text-[11px] text-amber-700 leading-snug">{v.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
