export type ShiftCode = 'M' | 'T' | 'N' | 'V' | 'L' | 'D'
export type DefaultShift = 'M' | 'T' | 'N' | 'D'

export interface ShiftDef {
  code: ShiftCode
  label: string
  shortLabel: string
  hours: string
  kind: 'work' | 'leave' | 'rest'
  bg: string
  fg: string
}

export interface Employee {
  id: string
  name: string
  role: string
  base: DefaultShift
  avatarColor: string
  vacationBalance: number
  archivedAt: string | null
}

// assignments[`${year}-${month}`][employeeId][day] = ShiftCode
export type EmployeeMonth = Record<string, Record<number, ShiftCode>>
export type Assignments = Record<string, EmployeeMonth>

// notes[`${year}-${month}`][employeeId][day] = "note text"
export type EmployeeMonthNotes = Record<string, Record<number, string>>
export type Notes = Record<string, EmployeeMonthNotes>

export interface Rule {
  id: string
  name: string
  description: string
  param: string
  value: number | null
  enabled: boolean
}

export interface RuleIssue {
  level: 'error' | 'warn'
  empId: string | null
  day: number | null
  ruleId: string
  msg: string
}

export interface Holiday {
  name: string
  kind: 'national' | 'local'
}
