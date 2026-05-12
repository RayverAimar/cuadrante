import type { Employee, EmployeeMonth, Rule, ShiftCode } from '../types'
import { getDaysInMonth, isWeekend } from './date'

export interface AutoFillResult {
  newAssignments: EmployeeMonth
  filled: number
  skipped: number
  byShift: Record<ShiftCode, number>
}

/**
 * mulberry32 — a tiny deterministic PRNG. Same seed → same sequence, so the
 * auto-fill output is stable across reloads as long as (year, month) doesn't
 * change. The bit twiddling is the canonical mulberry32 hash; not worth
 * understanding the constants beyond "well-known, well-distributed."
 */
function mulberry32(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fill every empty cell of the month with a shift that respects:
 *   - the minimum coverage rule (M/T/N per day),
 *   - the forced rest after a night shift,
 *   - a hard cap of 6 consecutive working days,
 *   - a soft heuristic that nudges rests after long streaks and weekends.
 *
 * Cells with an existing assignment are NEVER overwritten — we only walk over
 * them to keep the per-employee running state in sync. The same (year, month)
 * always produces the same output because the tie-breaker uses a seeded RNG.
 */
export function autoFill(
  employees: Employee[],
  assignments: EmployeeMonth,
  rules: Rule[],
  year: number,
  month: number,
): AutoFillResult {
  const dim = getDaysInMonth(year, month)
  const next: EmployeeMonth = {}
  employees.forEach((e) => { next[e.id] = { ...(assignments[e.id] || {}) } })

  const minRule = rules.find((r) => r.id === 'minPerShift')
  const restRule = rules.find((r) => r.id === 'restAfterNight')
  const minPerShift = minRule && minRule.enabled ? minRule.value ?? 0 : 0
  const enforceRest = !!(restRule && restRule.enabled)

  // Per-employee running state. `lastWeekendOff` defaults to -99 so the
  // "first weekend after a long stretch" heuristic kicks in from day 1.
  interface EmpState { consecWork: number; lastN: boolean; lastWeekendOff: number }
  const stats: Record<string, EmpState> = {}
  employees.forEach((e) => { stats[e.id] = { consecWork: 0, lastN: false, lastWeekendOff: -99 } })

  // Sort employees by id (stable, arbitrary) so iteration order is repeatable.
  const orderedEmps = [...employees].sort((a, b) => a.id.localeCompare(b.id))
  const rng = mulberry32(year * 100 + month)

  let filled = 0
  const byShift: Record<ShiftCode, number> = { M: 0, T: 0, N: 0, V: 0, L: 0, D: 0 }

  for (let d = 1; d <= dim; d++) {
    const wknd = isWeekend(year, month, d)
    const cover: Record<'M' | 'T' | 'N', number> = { M: 0, T: 0, N: 0 }
    employees.forEach((e) => {
      const c = next[e.id][d]
      if (c === 'M' || c === 'T' || c === 'N') cover[c]++
    })

    for (const emp of orderedEmps) {
      const st = stats[emp.id]
      const cur = next[emp.id][d]

      // Cell already filled — only update running state, do not modify.
      if (cur) {
        if (cur === 'M' || cur === 'T' || cur === 'N') {
          st.consecWork++
          st.lastN = cur === 'N'
        } else {
          st.consecWork = 0
          st.lastN = false
          if (wknd && (cur === 'D' || cur === 'L' || cur === 'V')) st.lastWeekendOff = d
        }
        continue
      }

      // Force a rest after a night shift.
      if (enforceRest && st.lastN) {
        next[emp.id][d] = 'D'
        byShift.D++; filled++
        st.consecWork = 0; st.lastN = false
        if (wknd) st.lastWeekendOff = d
        continue
      }

      // Hard cap on consecutive working days.
      if (st.consecWork >= 6) {
        next[emp.id][d] = 'D'
        byShift.D++; filled++
        st.consecWork = 0; st.lastN = false
        if (wknd) st.lastWeekendOff = d
        continue
      }

      // Soft "this person could use a break" scoring:
      //  +2 after 5+ consecutive working days (almost always a rest)
      //  +1 after 3+ consecutive working days
      //  +1 on a weekend if it's been >2 weeks without a weekend off
      // Score ≥2 always rests; score 1 rests with 50% probability (seeded RNG).
      let restScore = 0
      if (st.consecWork >= 5) restScore += 2
      else if (st.consecWork >= 3) restScore += 1
      if (wknd && d - st.lastWeekendOff > 14) restScore += 1

      const restPick = restScore >= 2 || (restScore === 1 && rng() < 0.5)
      if (restPick) {
        next[emp.id][d] = 'D'
        byShift.D++; filled++
        st.consecWork = 0; st.lastN = false
        if (wknd) st.lastWeekendOff = d
        continue
      }

      // Place a working shift. Strategy: walk M/T/N sorted by current coverage
      // (least-covered first, with the employee's preferred base getting a
      // head start) and pick the first one that's still under the soft
      // ceiling (minPerShift + 1). If everything is already well-covered we
      // fall back to the employee's base or M.
      const baseCandidates: ('M' | 'T' | 'N')[] =
        emp.base === 'M' || emp.base === 'T' || emp.base === 'N' ? [emp.base] : []
      const order = Array.from(new Set([...baseCandidates, 'M', 'T', 'N']) as Set<'M' | 'T' | 'N'>)
      const ranked = order.sort((a, b) => cover[a] - cover[b])
      let chosen: 'M' | 'T' | 'N' | null = null
      for (const sh of ranked) {
        if (cover[sh] < minPerShift + 1) { chosen = sh; break }
      }
      if (!chosen) chosen = baseCandidates[0] ?? 'M'

      next[emp.id][d] = chosen
      cover[chosen]++
      byShift[chosen]++
      filled++
      st.consecWork++
      st.lastN = chosen === 'N'
    }
  }

  return { newAssignments: next, filled, skipped: 0, byShift }
}
