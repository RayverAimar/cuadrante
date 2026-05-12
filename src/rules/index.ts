import type { Rule, RuleIssue, Employee, EmployeeMonth } from '../types'
import { getDaysInMonth, isWeekend } from '../utils/date'

export const DEFAULT_RULES: Rule[] = [
  {
    id: 'minPerShift',
    name: 'Cobertura mínima por turno',
    description: 'Cada turno (M/T/N) debe tener al menos N empleados en días hábiles.',
    param: 'mín. empleados',
    value: 2,
    enabled: true,
  },
  {
    id: 'maxConsecutive',
    name: 'Días consecutivos de vacaciones/licencia',
    description: 'Un empleado no puede tener más de N días seguidos de V o L.',
    param: 'máx. días',
    value: 14,
    enabled: true,
  },
  {
    id: 'maxLeavePerMonth',
    name: 'Límite de licencias/vacaciones',
    description: 'Un empleado no puede superar N días entre V y L en el mes.',
    param: 'máx. días',
    value: 10,
    enabled: true,
  },
  {
    id: 'restAfterNight',
    name: 'Descanso post-turno noche',
    description: 'Tras un turno N, el día siguiente no debe ser M ni T.',
    param: '—',
    value: null,
    enabled: true,
  },
  {
    id: 'weekendLeave',
    name: 'Licencia en fin de semana',
    description: 'Aviso si V/L cae en sábado o domingo (no descuenta días hábiles).',
    param: '—',
    value: null,
    enabled: false,
  },
]

export function validate(
  employees: Employee[],
  assignments: EmployeeMonth,
  rules: Rule[],
  year: number,
  month: number,
): RuleIssue[] {
  const issues: RuleIssue[] = []
  const dim = getDaysInMonth(year, month)
  const enabled: Record<string, Rule | undefined> = Object.fromEntries(
    rules.map((r) => [r.id, r]),
  )

  if (enabled.minPerShift?.enabled) {
    const min = enabled.minPerShift.value ?? 0
    for (let d = 1; d <= dim; d++) {
      if (isWeekend(year, month, d)) continue
      ;(['M', 'T', 'N'] as const).forEach((sh) => {
        const count = employees.filter((e) => assignments[e.id]?.[d] === sh).length
        if (count < min) {
          issues.push({
            level: 'error',
            empId: null,
            day: d,
            ruleId: 'minPerShift',
            msg: `Día ${d} · turno ${sh}: ${count} activos (mín ${min})`,
          })
        }
      })
    }
  }

  employees.forEach((emp) => {
    const a = assignments[emp.id] || {}

    if (enabled.restAfterNight?.enabled) {
      for (let d = 1; d < dim; d++) {
        if (a[d] === 'N' && (a[d + 1] === 'M' || a[d + 1] === 'T')) {
          issues.push({
            level: 'warn',
            empId: emp.id,
            day: d + 1,
            ruleId: 'restAfterNight',
            msg: `${emp.name}: turno noche el ${d} seguido de ${a[d + 1]} el ${d + 1}`,
          })
        }
      }
    }

    if (enabled.maxConsecutive?.enabled) {
      const max = enabled.maxConsecutive.value ?? 0
      let run = 0
      let runStart = 0
      for (let d = 1; d <= dim; d++) {
        const c = a[d]
        if (c === 'V' || c === 'L') {
          if (run === 0) runStart = d
          run++
          if (run > max) {
            issues.push({
              level: 'error',
              empId: emp.id,
              day: d,
              ruleId: 'maxConsecutive',
              msg: `${emp.name}: ${run} días consecutivos V/L desde ${runStart} (máx ${max})`,
            })
          }
        } else {
          run = 0
        }
      }
    }

    if (enabled.maxLeavePerMonth?.enabled) {
      const max = enabled.maxLeavePerMonth.value ?? 0
      const total = Object.values(a).filter((c) => c === 'V' || c === 'L').length
      if (total > max) {
        issues.push({
          level: 'error',
          empId: emp.id,
          day: null,
          ruleId: 'maxLeavePerMonth',
          msg: `${emp.name}: ${total} días de V/L este mes (máx ${max})`,
        })
      }
    }

    if (enabled.weekendLeave?.enabled) {
      for (let d = 1; d <= dim; d++) {
        if ((a[d] === 'V' || a[d] === 'L') && isWeekend(year, month, d)) {
          issues.push({
            level: 'warn',
            empId: emp.id,
            day: d,
            ruleId: 'weekendLeave',
            msg: `${emp.name}: ${a[d]} el ${d} (fin de semana)`,
          })
        }
      }
    }
  })

  return issues
}
