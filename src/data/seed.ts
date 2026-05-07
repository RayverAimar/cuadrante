import type { Employee, Assignments } from '../types'
import { AVATAR_COLORS } from '../constants/shifts'
import { monthKey } from '../utils/date'

export const SEED_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Ana García',      role: 'Supervisora',       defaultShift: 'M', avatarColor: AVATAR_COLORS[0] },
  { id: 'e2', name: 'Carlos López',    role: 'Guardia',           defaultShift: 'M', avatarColor: AVATAR_COLORS[1] },
  { id: 'e3', name: 'María Rodríguez', role: 'Guardia',           defaultShift: 'M', avatarColor: AVATAR_COLORS[2] },
  { id: 'e4', name: 'Pedro Martínez',  role: 'Guardia',           defaultShift: 'T', avatarColor: AVATAR_COLORS[3] },
  { id: 'e5', name: 'Laura Sánchez',   role: 'Supervisora',       defaultShift: 'T', avatarColor: AVATAR_COLORS[4] },
  { id: 'e6', name: 'José Torres',     role: 'Guardia',           defaultShift: 'T', avatarColor: AVATAR_COLORS[5] },
  { id: 'e7', name: 'Roberto Díaz',    role: 'Guardia Nocturno',  defaultShift: 'N', avatarColor: AVATAR_COLORS[6] },
  { id: 'e8', name: 'Carmen Vega',     role: 'Guardia Nocturno',  defaultShift: 'N', avatarColor: AVATAR_COLORS[7] },
  { id: 'e9', name: 'Miguel Flores',   role: 'Supervisor Noche',  defaultShift: 'N', avatarColor: AVATAR_COLORS[8] },
]

export function buildSeedAssignments(year: number, month: number): Assignments {
  const k = monthKey(year, month)
  const assignments: Assignments = { [k]: {} }
  const set = (empId: string, days: number[], code: 'V' | 'L' | 'D') => {
    if (!assignments[k][empId]) assignments[k][empId] = {}
    days.forEach((d) => { assignments[k][empId][d] = code })
  }
  set('e1', [10, 11], 'V')
  set('e2', [17, 18, 19], 'V')
  set('e3', [24, 25], 'V')
  set('e4', [5, 6], 'V')
  set('e5', [14, 15, 16, 17], 'V') // intentionally triggers consecutive-days rule
  set('e6', [21, 22], 'V')
  set('e7', [8, 9], 'V')
  set('e8', [20, 21, 22], 'L')
  set('e9', [3, 4], 'V')
  set('e1', [13], 'D')
  set('e7', [1], 'D')
  return assignments
}
