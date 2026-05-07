export type ShiftCode = 'M' | 'T' | 'N' | 'V' | 'L' | 'D'
export type DefaultShift = 'M' | 'T' | 'N'

export interface ShiftDef {
  label: string
  shortLabel: string
  color: string    // hex for text
  bg: string       // hex for background
  border: string   // hex for border
  time?: string
  icon: string
  description: string
}

export interface Employee {
  id: string
  name: string
  role: string
  defaultShift: DefaultShift
  avatarColor: string
}

// assignments[`${year}-${month}`][employeeId][day] = ShiftCode
export type MonthMap = Record<string, Record<number, ShiftCode>>
export type Assignments = Record<string, MonthMap>

export interface RuleViolation {
  level: 'error' | 'warning'
  employeeId?: string
  days?: number[]
  message: string
  ruleId?: string
  ruleName?: string
}

export interface RuleParamDef {
  key: string
  label: string
  min: number
  max: number
}

export interface ValidationContext {
  year: number
  month: number
  employees: Employee[]
  getAssignment: (empId: string, day: number) => ShiftCode | null
  daysInMonth: number
}

export interface Rule {
  id: string
  name: string
  description: string
  enabled: boolean
  params: Record<string, number>
  paramDefs: RuleParamDef[]
  validate: (ctx: ValidationContext) => RuleViolation[]
}

export interface RuleOverride {
  enabled: boolean
  params: Record<string, number>
}
