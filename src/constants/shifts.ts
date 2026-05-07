import type { ShiftCode, ShiftDef, DefaultShift } from '../types'

export const SHIFT_DEFS: Record<ShiftCode, ShiftDef> = {
  M: {
    label: 'Mañana',
    shortLabel: 'M',
    color: '#1D4ED8',
    bg: '#DBEAFE',
    border: '#93C5FD',
    time: '06:00 – 14:00',
    icon: '🌅',
    description: 'Turno de mañana',
  },
  T: {
    label: 'Tarde',
    shortLabel: 'T',
    color: '#92400E',
    bg: '#FEF3C7',
    border: '#FCD34D',
    time: '14:00 – 22:00',
    icon: '🌇',
    description: 'Turno de tarde',
  },
  N: {
    label: 'Noche',
    shortLabel: 'N',
    color: '#5B21B6',
    bg: '#EDE9FE',
    border: '#C4B5FD',
    time: '22:00 – 06:00',
    icon: '🌙',
    description: 'Turno de noche (guardia nocturna)',
  },
  V: {
    label: 'Vacaciones',
    shortLabel: 'V',
    color: '#065F46',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    icon: '🏖️',
    description: 'Días de vacaciones',
  },
  L: {
    label: 'Licencia',
    shortLabel: 'L',
    color: '#9D174D',
    bg: '#FCE7F3',
    border: '#F9A8D4',
    icon: '📋',
    description: 'Licencia con goce de haber',
  },
  D: {
    label: 'Descanso',
    shortLabel: 'D',
    color: '#374151',
    bg: '#F3F4F6',
    border: '#D1D5DB',
    icon: '😴',
    description: 'Día de descanso / franco',
  },
}

export const SHIFT_GROUPS: DefaultShift[] = ['M', 'T', 'N']
export const ALL_SHIFT_CODES: ShiftCode[] = ['M', 'T', 'N', 'V', 'L', 'D']

export const AVATAR_COLORS = [
  '#2563EB', '#0891B2', '#0D9488', '#D97706',
  '#EA580C', '#7C3AED', '#DB2777', '#059669',
  '#DC2626', '#0369A1', '#6D28D9', '#B45309',
]

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
