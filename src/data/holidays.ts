// Feriados nacionales del Perú
// month is 0-indexed.

export interface NationalHolidayEntry {
  month: number
  day: number
  name: string
}

export const PE_HOLIDAYS_BY_YEAR: Record<number, NationalHolidayEntry[]> = {
  2025: [
    { month: 0,  day: 1,  name: 'Año Nuevo' },
    { month: 3,  day: 17, name: 'Jueves Santo' },
    { month: 3,  day: 18, name: 'Viernes Santo' },
    { month: 4,  day: 1,  name: 'Día del Trabajo' },
    { month: 5,  day: 7,  name: 'Batalla de Arica y Día de la Bandera' },
    { month: 5,  day: 29, name: 'San Pedro y San Pablo' },
    { month: 6,  day: 28, name: 'Fiestas Patrias' },
    { month: 6,  day: 29, name: 'Fiestas Patrias' },
    { month: 7,  day: 30, name: 'Santa Rosa de Lima' },
    { month: 9,  day: 8,  name: 'Combate de Angamos' },
    { month: 10, day: 1,  name: 'Todos los Santos' },
    { month: 11, day: 8,  name: 'Inmaculada Concepción' },
    { month: 11, day: 25, name: 'Navidad' },
  ],
  2026: [
    { month: 0,  day: 1,  name: 'Año Nuevo' },
    { month: 3,  day: 2,  name: 'Jueves Santo' },
    { month: 3,  day: 3,  name: 'Viernes Santo' },
    { month: 4,  day: 1,  name: 'Día del Trabajo' },
    { month: 5,  day: 7,  name: 'Batalla de Arica y Día de la Bandera' },
    { month: 5,  day: 29, name: 'San Pedro y San Pablo' },
    { month: 6,  day: 23, name: 'Día de la Fuerza Aérea del Perú' },
    { month: 6,  day: 28, name: 'Fiestas Patrias' },
    { month: 6,  day: 29, name: 'Fiestas Patrias' },
    { month: 7,  day: 6,  name: 'Batalla de Junín' },
    { month: 7,  day: 30, name: 'Santa Rosa de Lima' },
    { month: 9,  day: 8,  name: 'Combate de Angamos' },
    { month: 10, day: 1,  name: 'Todos los Santos' },
    { month: 11, day: 8,  name: 'Inmaculada Concepción' },
    { month: 11, day: 9,  name: 'Batalla de Ayacucho' },
    { month: 11, day: 25, name: 'Navidad' },
  ],
}

export function nationalHoliday(year: number, month: number, day: number): string | null {
  const list = PE_HOLIDAYS_BY_YEAR[year]
  if (!list) return null
  return list.find((h) => h.month === month && h.day === day)?.name ?? null
}
