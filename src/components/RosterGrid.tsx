import { useMemo } from 'react'
import { useRosterStore } from '../store/useRosterStore'
import { runValidations } from '../rules'
import { SHIFT_DEFS, SHIFT_GROUPS, DAYS_SHORT } from '../constants/shifts'
import { getDaysInMonth, getDayOfWeek, isWeekend, monthKey, getInitials } from '../utils/date'
import type { ShiftCode } from '../types'
import { ShiftPicker } from './ShiftPicker'
import { Tooltip } from './ui/Tooltip'

export function RosterGrid() {
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

  const violCells = useMemo(() => {
    const s = new Set<string>()
    violations.forEach((v) => {
      if (v.employeeId && v.days)
        v.days.forEach((d) => s.add(`${v.employeeId}:${d}`))
    })
    return s
  }, [violations])

  const maxVacDays = rules.find((r) => r.id === 'max_vac_per_month')?.params.maxDays ?? 5

  const vacCount = (empId: string) => {
    let n = 0
    for (let d = 1; d <= days; d++) {
      const a = getAssignment(empId, d)
      if (a === 'V' || a === 'L') n++
    }
    return n
  }

  // Column widths
  const cellW = 36

  return (
    <div className="overflow-auto rounded-xl border border-gray-200 shadow-sm bg-white">
      <table className="border-collapse" style={{ width: 'max-content', minWidth: '100%' }}>
        {/* ── HEADER ── */}
        <thead>
          <tr>
            {/* Employee name column */}
            <th
              className="sticky left-0 top-0 z-30 bg-white border-b border-r border-gray-200 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
              style={{ minWidth: 168 }}
            >
              Empleado
            </th>

            {/* Day columns */}
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
              const dow = getDayOfWeek(year, month, d)
              const we = isWeekend(year, month, d)
              return (
                <th
                  key={d}
                  className={`sticky top-0 z-20 border-b border-r border-gray-200 text-center ${
                    we ? 'bg-orange-50' : 'bg-white'
                  }`}
                  style={{ width: cellW, minWidth: cellW }}
                >
                  <div
                    className={`py-1.5 text-[10px] font-medium ${we ? 'text-orange-500' : 'text-gray-400'}`}
                  >
                    {DAYS_SHORT[dow]}
                  </div>
                  <div
                    className={`pb-1.5 text-[13px] font-bold leading-none ${we ? 'text-orange-600' : 'text-gray-700'}`}
                  >
                    {d}
                  </div>
                </th>
              )
            })}

            {/* Summary column */}
            <th
              className="sticky right-0 top-0 z-30 bg-white border-b border-l border-gray-200 px-2 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide"
              style={{ minWidth: 56 }}
            >
              V/L<br />días
            </th>
          </tr>
        </thead>

        <tbody>
          {SHIFT_GROUPS.map((sk) => {
            const group = employees.filter((e) => e.defaultShift === sk)
            if (group.length === 0) return null
            const def = SHIFT_DEFS[sk]

            return (
              <>
                {/* Group header row */}
                <tr key={`gh-${sk}`}>
                  <td
                    colSpan={days + 2}
                    className="border-b border-t-2 border-t-gray-200 border-r border-gray-200 px-3 py-1.5"
                    style={{ backgroundColor: def.bg }}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: def.color }}>
                      {def.icon} Turno {def.label}
                      {def.time && (
                        <span className="ml-1.5 font-normal opacity-70">· {def.time}</span>
                      )}
                    </span>
                    <span className="ml-2 text-[10px] font-medium opacity-60" style={{ color: def.color }}>
                      {group.length} empleado{group.length > 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>

                {/* Employee rows */}
                {group.map((emp) => {
                  const vc = vacCount(emp.id)
                  const overLimit = vc > maxVacDays
                  return (
                    <tr key={emp.id} className="group/row hover:bg-blue-50/30 transition-colors">
                      {/* Name cell */}
                      <td className="sticky left-0 z-10 border-b border-r border-gray-200 bg-white px-3 py-1.5 group-hover/row:bg-blue-50/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: emp.avatarColor }}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-800 leading-tight">{emp.name}</div>
                            <div className="text-[10px] text-gray-400 leading-none">{emp.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Day cells */}
                      {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
                        const assignment = getAssignment(emp.id, d)
                        const we = isWeekend(year, month, d)
                        // weekend with no override → show neutral dot
                        const effective: ShiftCode = assignment ?? (we ? 'D' : emp.defaultShift)
                        const isDefault = assignment === null
                        const hasViol = violCells.has(`${emp.id}:${d}`)
                        const shiftDef = SHIFT_DEFS[effective]

                        const cellContent = (
                          <ShiftPicker employee={emp} day={d} currentAssignment={assignment}>
                            <button
                              className="relative flex h-full w-full items-center justify-center focus:outline-none transition-opacity hover:opacity-75"
                              style={{
                                backgroundColor: isDefault && we ? '#FAFAFA' : shiftDef.bg,
                                ...(hasViol
                                  ? { outline: '2px solid #EF4444', outlineOffset: '-2px' }
                                  : {}),
                              }}
                            >
                              <span
                                className="text-[11px] font-bold select-none"
                                style={{
                                  color: isDefault && we ? '#D1D5DB' : shiftDef.color,
                                  opacity: isDefault && !we ? 0.45 : 1,
                                }}
                              >
                                {isDefault && we ? '·' : shiftDef.shortLabel}
                              </span>
                            </button>
                          </ShiftPicker>
                        )

                        return (
                          <td
                            key={d}
                            className="border-b border-r border-gray-200 p-0"
                            style={{ width: cellW, height: 34 }}
                          >
                            {hasViol ? (
                              <Tooltip
                                content={
                                  violations
                                    .filter(
                                      (v) => v.employeeId === emp.id && v.days?.includes(d),
                                    )
                                    .map((v) => v.message)
                                    .join(' · ')
                                }
                                placement="top"
                              >
                                {cellContent}
                              </Tooltip>
                            ) : (
                              cellContent
                            )}
                          </td>
                        )
                      })}

                      {/* Summary cell */}
                      <td className="sticky right-0 z-10 border-b border-l border-gray-200 bg-white px-2 text-center group-hover/row:bg-blue-50/30 transition-colors">
                        <span
                          className="text-xs font-bold"
                          style={{ color: overLimit ? '#DC2626' : '#059669' }}
                        >
                          {vc}
                        </span>
                        <div className="text-[9px] text-gray-400">/ {maxVacDays}</div>
                      </td>
                    </tr>
                  )
                })}
              </>
            )
          })}

          {/* Coverage row */}
          <tr className="bg-gray-50">
            <td className="sticky left-0 z-10 border-t-2 border-t-gray-300 border-r border-gray-200 bg-gray-50 px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              Cobertura
            </td>
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
              const we = isWeekend(year, month, d)
              return (
                <td
                  key={d}
                  className="border-t-2 border-t-gray-300 border-r border-b border-gray-200 text-center"
                  style={{ backgroundColor: we ? '#FFF7ED' : undefined }}
                >
                  <div className="flex flex-col items-center py-0.5 gap-px">
                    {SHIFT_GROUPS.map((sk) => {
                      const inGroup = employees.filter((e) => e.defaultShift === sk)
                      if (inGroup.length === 0) return null
                      const working = inGroup.filter((e) => {
                        const a = getAssignment(e.id, d)
                        return a === null || a === sk
                      }).length
                      return (
                        <Tooltip
                          key={sk}
                          content={`Turno ${SHIFT_DEFS[sk].label}: ${working} activo${working !== 1 ? 's' : ''}`}
                        >
                          <span
                            className="text-[10px] font-bold leading-none"
                            style={{ color: SHIFT_DEFS[sk].color }}
                          >
                            {SHIFT_DEFS[sk].shortLabel}:{working}
                          </span>
                        </Tooltip>
                      )
                    })}
                  </div>
                </td>
              )
            })}
            <td className="sticky right-0 z-10 border-t-2 border-t-gray-300 border-l border-gray-200 bg-gray-50" />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
