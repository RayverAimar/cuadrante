import type { ShiftCode, ShiftDef } from '../types'

// Hex colors mirror the design's CSS variables (light theme) — used for exports
// (CSV/XLS) and any inline rendering that can't read CSS variables.
export const SHIFTS: Record<ShiftCode, ShiftDef> = {
  M: { code: 'M', label: 'Mañana',          shortLabel: 'M', hours: '06–14h',     kind: 'work',  bg: '#dbe7f7', fg: '#1a3a8c' },
  T: { code: 'T', label: 'Tarde',           shortLabel: 'T', hours: '14–22h',     kind: 'work',  bg: '#f8e6c1', fg: '#6e3f00' },
  N: { code: 'N', label: 'Noche',           shortLabel: 'N', hours: '22–06h',     kind: 'work',  bg: '#d9d3ee', fg: '#2c1a72' },
  V: { code: 'V', label: 'Vacaciones',      shortLabel: 'V', hours: 'todo el día', kind: 'leave', bg: '#c8eed9', fg: '#0a4a2c' },
  L: { code: 'L', label: 'Licencia c/goce', shortLabel: 'L', hours: 'todo el día', kind: 'leave', bg: '#f6d8e4', fg: '#6b1438' },
  D: { code: 'D', label: 'Descanso',        shortLabel: 'D', hours: '—',           kind: 'rest',  bg: '#ebe7dd', fg: '#4a4642' },
}

export const SHIFT_ORDER: ShiftCode[] = ['M', 'T', 'N', 'V', 'L', 'D']
export const WORK_SHIFTS: ShiftCode[] = ['M', 'T', 'N']

export const AVATAR_COLORS = [
  '#1a3a8c', '#6e3f00', '#0a4a2c', '#2c1a72',
  '#6b1438', '#ff4500', '#4a4642',
]

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Lunes-domingo (the design uses ES week order)
// Two letters to avoid visual collision with shift codes (M=Mañana, V=Vacaciones, D=Descanso).
export const DOW_ES = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']
