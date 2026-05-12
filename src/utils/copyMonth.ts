import type { EmployeeMonth, ShiftCode } from '../types'
import { getDaysInMonth } from './date'

export interface CopyMonthOptions {
  codes: Set<ShiftCode>
  overwrite: boolean
}

export interface CopyMonthResult {
  next: EmployeeMonth
  copied: number
  skipped: number
  byCode: Record<ShiftCode, number>
}

/** Pure function: produce a new EmployeeMonth combining target + selected cells from source. */
export function copyMonth(
  source: EmployeeMonth,
  target: EmployeeMonth,
  toYear: number,
  toMonth: number,
  opts: CopyMonthOptions,
): CopyMonthResult {
  const dim = getDaysInMonth(toYear, toMonth)
  const next: EmployeeMonth = {}
  Object.entries(target).forEach(([empId, days]) => { next[empId] = { ...days } })
  let copied = 0
  let skipped = 0
  const byCode: Record<ShiftCode, number> = { M: 0, T: 0, N: 0, V: 0, L: 0, D: 0 }

  for (const [empId, days] of Object.entries(source)) {
    for (const [dStr, code] of Object.entries(days)) {
      const d = Number(dStr)
      if (d < 1 || d > dim) continue
      if (!opts.codes.has(code)) continue
      const existing = next[empId]?.[d]
      if (existing && !opts.overwrite) { skipped++; continue }
      if (!next[empId]) next[empId] = {}
      next[empId][d] = code
      byCode[code]++
      copied++
    }
  }

  return { next, copied, skipped, byCode }
}
