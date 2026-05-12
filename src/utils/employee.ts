import type { Employee, EmployeeMonth } from '../types'

/**
 * Active employees + archived employees that still have data in the current
 * month. Used in every view that paints a single month (screen grid, report,
 * print pages) so an employee archived mid-month doesn't disappear from past
 * cuadrantes.
 */
export function visibleInMonth(employees: Employee[], assignments: EmployeeMonth): Employee[] {
  return employees.filter((e) => {
    if (!e.archivedAt) return true
    return assignments[e.id] && Object.keys(assignments[e.id]).length > 0
  })
}
