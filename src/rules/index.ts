import type { Rule, RuleViolation, ValidationContext } from '../types'
import { isWeekend } from '../utils/date'
import { SHIFT_DEFS, SHIFT_GROUPS } from '../constants/shifts'

// ─── RULES ENGINE ─────────────────────────────────────────────────────────────
// To add a new rule: push an object that implements Rule to this array.
// Each rule's validate() receives a ValidationContext and returns RuleViolation[].
// The UI in RulesModal picks up paramDefs automatically — no other registration needed.

export const DEFAULT_RULES: Rule[] = [
  {
    id: 'max_vac_per_month',
    name: 'Límite de licencias/vacaciones',
    description:
      'Un empleado no puede superar N días entre vacaciones (V) y licencias (L) en el mes.',
    enabled: true,
    params: { maxDays: 5 },
    paramDefs: [{ key: 'maxDays', label: 'Días máximos por mes', min: 1, max: 31 }],
    validate({ employees, getAssignment, daysInMonth }: ValidationContext): RuleViolation[] {
      const violations: RuleViolation[] = []
      for (const emp of employees) {
        const usedDays: number[] = []
        for (let d = 1; d <= daysInMonth; d++) {
          const a = getAssignment(emp.id, d)
          if (a === 'V' || a === 'L') usedDays.push(d)
        }
        if (usedDays.length > this.params.maxDays) {
          violations.push({
            level: 'error',
            employeeId: emp.id,
            days: usedDays,
            message: `${emp.name} tiene ${usedDays.length} días de licencia/vacaciones (máx: ${this.params.maxDays}).`,
          })
        }
      }
      return violations
    },
  },

  {
    id: 'max_consecutive_vac',
    name: 'Días consecutivos de vacaciones/licencia',
    description: 'No se permiten más de N días consecutivos de vacaciones o licencia.',
    enabled: true,
    params: { maxConsecutive: 2 },
    paramDefs: [{ key: 'maxConsecutive', label: 'Días consecutivos máximos', min: 1, max: 30 }],
    validate({ employees, getAssignment, daysInMonth }: ValidationContext): RuleViolation[] {
      const violations: RuleViolation[] = []
      for (const emp of employees) {
        let streak = 0
        let streakDays: number[] = []
        for (let d = 1; d <= daysInMonth; d++) {
          const a = getAssignment(emp.id, d)
          if (a === 'V' || a === 'L') {
            streak++
            streakDays.push(d)
            if (streak > this.params.maxConsecutive) {
              violations.push({
                level: 'error',
                employeeId: emp.id,
                days: [...streakDays],
                message: `${emp.name}: ${streak} días consecutivos de licencia/vacaciones a partir del día ${streakDays[0]} (máx: ${this.params.maxConsecutive}).`,
              })
              streak = 0
              streakDays = []
            }
          } else {
            streak = 0
            streakDays = []
          }
        }
      }
      return violations
    },
  },

  {
    id: 'min_coverage',
    name: 'Cobertura mínima por turno',
    description: 'Cada turno debe tener al menos N empleados activos en días hábiles.',
    enabled: true,
    params: { minPerShift: 1 },
    paramDefs: [{ key: 'minPerShift', label: 'Empleados mínimos por turno (días hábiles)', min: 1, max: 10 }],
    validate({ employees, getAssignment, daysInMonth, year, month }: ValidationContext): RuleViolation[] {
      const violations: RuleViolation[] = []
      for (let d = 1; d <= daysInMonth; d++) {
        if (isWeekend(year, month, d)) continue
        for (const sk of SHIFT_GROUPS) {
          const inGroup = employees.filter((e) => e.defaultShift === sk)
          if (inGroup.length === 0) continue
          const working = inGroup.filter((e) => {
            const a = getAssignment(e.id, d)
            return a === null || a === sk
          }).length
          if (working < this.params.minPerShift) {
            violations.push({
              level: 'warning',
              days: [d],
              message: `Día ${d} — Turno ${SHIFT_DEFS[sk].label}: ${working} empleado(s) activo(s) (mín: ${this.params.minPerShift}).`,
            })
          }
        }
      }
      return violations
    },
  },

  {
    id: 'rest_after_night',
    name: 'Descanso obligatorio post-turno noche',
    description: 'Un empleado de turno noche no debe tener turno laboral el día siguiente.',
    enabled: true,
    params: {},
    paramDefs: [],
    validate({ employees, getAssignment, daysInMonth }: ValidationContext): RuleViolation[] {
      const violations: RuleViolation[] = []
      for (const emp of employees) {
        for (let d = 1; d < daysInMonth; d++) {
          const today = getAssignment(emp.id, d) ?? emp.defaultShift
          const tomorrow = getAssignment(emp.id, d + 1)
          if (today === 'N' && (tomorrow === 'M' || tomorrow === 'T' || tomorrow === 'N')) {
            violations.push({
              level: 'warning',
              employeeId: emp.id,
              days: [d, d + 1],
              message: `${emp.name}: turno noche el día ${d} seguido de turno laboral el día ${d + 1} (se recomienda descanso).`,
            })
          }
        }
      }
      return violations
    },
  },

  {
    id: 'vac_on_weekend',
    name: 'Licencia en fin de semana',
    description: 'Aviso cuando se asignan vacaciones o licencia en sábado/domingo (no descuentan días hábiles).',
    enabled: false,
    params: {},
    paramDefs: [],
    validate({ employees, getAssignment, daysInMonth, year, month }: ValidationContext): RuleViolation[] {
      const violations: RuleViolation[] = []
      for (const emp of employees) {
        for (let d = 1; d <= daysInMonth; d++) {
          if (!isWeekend(year, month, d)) continue
          const a = getAssignment(emp.id, d)
          if (a === 'V' || a === 'L') {
            violations.push({
              level: 'warning',
              employeeId: emp.id,
              days: [d],
              message: `${emp.name}: licencia asignada el día ${d} (fin de semana — no descuenta días hábiles).`,
            })
          }
        }
      }
      return violations
    },
  },
]

export function runValidations(
  rules: Rule[],
  ctx: ValidationContext,
): RuleViolation[] {
  const all: RuleViolation[] = []
  for (const rule of rules) {
    if (!rule.enabled) continue
    const violations = rule.validate(ctx)
    violations.forEach((v) => all.push({ ...v, ruleId: rule.id, ruleName: rule.name }))
  }
  return all
}
