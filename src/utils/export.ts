import type * as XLSXType from 'xlsx-js-style'
import type { Employee, EmployeeMonth, ShiftCode } from '../types'

// xlsx-js-style is ~600KB; defer until the user actually triggers an XLS export.
const loadXLSX = (): Promise<typeof XLSXType> =>
  import('xlsx-js-style') as unknown as Promise<typeof XLSXType>
import { SHIFTS, MONTHS_ES } from '../constants/shifts'
import { getDaysInMonth } from './date'
import { printWithBodyClass } from './print'

type Row = (string | number)[]

export function buildMatrix(
  employees: Employee[],
  assignments: EmployeeMonth,
  coverage: Record<ShiftCode, Record<number, number>>,
  year: number,
  month: number,
): Row[] {
  const dim = getDaysInMonth(year, month)
  const rows: Row[] = []
  const header: Row = ['Empleado', 'Cargo', 'Turno base']
  for (let d = 1; d <= dim; d++) header.push(String(d))
  rows.push(header)
  employees.forEach((emp) => {
    const row: Row = [emp.name, emp.role, emp.base]
    for (let d = 1; d <= dim; d++) row.push(assignments[emp.id]?.[d] || '')
    rows.push(row)
  })
  ;(['M', 'T', 'N'] as ShiftCode[]).forEach((code) => {
    const row: Row = [`Cobertura ${code}`, '', '']
    for (let d = 1; d <= dim; d++) row.push(coverage[code]?.[d] || 0)
    rows.push(row)
  })
  return rows
}

function fileBase(year: number, month: number) {
  return `cuadrante-${MONTHS_ES[month].toLowerCase()}-${year}`
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function exportCSV(rows: Row[], year: number, month: number) {
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? '')
          return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(','),
    )
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, `${fileBase(year, month)}.csv`)
}

export async function exportXLS(rows: Row[], year: number, month: number) {
  const XLSX = await loadXLSX()
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Column widths: name + role + base + 1..N days
  const dayColCount = rows[0].length - 3
  ws['!cols'] = [
    { wch: 24 }, // Empleado
    { wch: 16 }, // Cargo
    { wch: 10 }, // Turno base
    ...Array.from({ length: dayColCount }, () => ({ wch: 4 })),
  ]
  ws['!freeze'] = { xSplit: 3, ySplit: 1 }

  // Style header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C })
    const cell = ws[addr]
    if (cell) {
      cell.s = {
        fill: { patternType: 'solid', fgColor: { rgb: '1A1A1A' } },
        font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' },
      }
    }
  }

  // Style shift cells (rows 1..n-3 since last 3 are coverage; days start at col 3)
  for (let R = 1; R <= range.e.r; R++) {
    for (let C = 3; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C })
      const cell = ws[addr]
      if (!cell) continue
      const value = String(cell.v ?? '')
      const sh = value in SHIFTS ? SHIFTS[value as ShiftCode] : null
      if (sh) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: sh.bg.replace('#', '') } },
          font: { color: { rgb: sh.fg.replace('#', '') }, bold: true, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' },
        }
      } else {
        cell.s = { alignment: { horizontal: 'center', vertical: 'center' } }
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `${MONTHS_ES[month]} ${year}`.slice(0, 31))
  XLSX.writeFile(wb, `${fileBase(year, month)}.xlsx`)
}

// Build matrix without coverage rows — used in import/export round-trip
function buildPlainMatrix(employees: Employee[], assignments: EmployeeMonth, year: number, month: number): Row[] {
  const dim = getDaysInMonth(year, month)
  const rows: Row[] = []
  const header: Row = ['Empleado', 'Cargo', 'Turno base']
  for (let d = 1; d <= dim; d++) header.push(String(d))
  rows.push(header)
  employees.forEach((emp) => {
    const row: Row = [emp.name, emp.role, emp.base]
    for (let d = 1; d <= dim; d++) row.push(assignments[emp.id]?.[d] || '')
    rows.push(row)
  })
  return rows
}

export async function exportYearXLS(
  employees: Employee[],
  byMonth: Record<string, EmployeeMonth>,
  year: number,
) {
  const XLSX = await loadXLSX()
  const wb = XLSX.utils.book_new()
  for (let m = 0; m < 12; m++) {
    const k = `${year}-${m}`
    const assignments = byMonth[k] || {}
    const rows = buildPlainMatrix(employees, assignments, year, m)
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const dayCols = rows[0].length - 3
    ws['!cols'] = [
      { wch: 24 }, { wch: 16 }, { wch: 10 },
      ...Array.from({ length: dayCols }, () => ({ wch: 4 })),
    ]
    ws['!freeze'] = { xSplit: 3, ySplit: 1 }

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })]
      if (cell) cell.s = {
        fill: { patternType: 'solid', fgColor: { rgb: '1A1A1A' } },
        font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' },
      }
    }
    for (let R = 1; R <= range.e.r; R++) {
      for (let C = 3; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })]
        if (!cell) continue
        const v = String(cell.v ?? '')
        const sh = v in SHIFTS ? SHIFTS[v as ShiftCode] : null
        cell.s = sh
          ? {
              fill: { patternType: 'solid', fgColor: { rgb: sh.bg.replace('#', '') } },
              font: { color: { rgb: sh.fg.replace('#', '') }, bold: true, sz: 11 },
              alignment: { horizontal: 'center', vertical: 'center' },
            }
          : { alignment: { horizontal: 'center', vertical: 'center' } }
      }
    }
    XLSX.utils.book_append_sheet(wb, ws, `${String(m + 1).padStart(2, '0')} ${MONTHS_ES[m].slice(0, 3)}`)
  }
  XLSX.writeFile(wb, `cuadrante-anual-${year}.xlsx`)
}

export interface ImportedMonth {
  month: number          // 0..11
  matched: number        // empleados matcheados
  unmatched: string[]    // nombres no encontrados
  cells: number          // celdas con turno
  assignments: EmployeeMonth
}

export interface ImportResult {
  year: number
  months: ImportedMonth[]
  totalUnmatched: string[]
}

const SHIFT_CODES = new Set<ShiftCode>(['M', 'T', 'N', 'V', 'L', 'D'])

export async function importYearXLS(file: File, employees: Employee[]): Promise<ImportResult> {
  const XLSX = await loadXLSX()
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  // index employees by normalized name
  const norm = (s: string) => s.trim().toLowerCase()
  const byName = new Map<string, string>()
  employees.forEach((e) => byName.set(norm(e.name), e.id))

  // detect year: try to read from filename via the caller; here we infer from any cell hint.
  // Fallback to current year.
  let year = new Date().getFullYear()
  const months: ImportedMonth[] = []
  const totalUnmatched = new Set<string>()

  wb.SheetNames.forEach((sheetName) => {
    const m = sheetName.match(/^(\d{1,2})/)
    if (!m) return
    const monthIdx = parseInt(m[1], 10) - 1
    if (monthIdx < 0 || monthIdx > 11) return

    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' })
    if (rows.length < 2) return

    const assignments: EmployeeMonth = {}
    let matched = 0
    const unmatched: string[] = []
    let cells = 0

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      const name = String(row[0] || '').trim()
      if (!name) continue
      if (/^cobertura/i.test(name)) continue
      const empId = byName.get(norm(name))
      if (!empId) {
        unmatched.push(name)
        totalUnmatched.add(name)
        continue
      }
      matched++
      const dayMap: Record<number, ShiftCode> = {}
      for (let c = 3; c < row.length; c++) {
        const v = String(row[c] || '').trim().toUpperCase()
        if (SHIFT_CODES.has(v as ShiftCode)) {
          dayMap[c - 2] = v as ShiftCode
          cells++
        }
      }
      if (Object.keys(dayMap).length) assignments[empId] = dayMap
    }
    months.push({ month: monthIdx, matched, unmatched, cells, assignments })
  })

  return { year, months, totalUnmatched: Array.from(totalUnmatched) }
}

export function exportPDF() {
  printWithBodyClass('cdr-printing')
}
