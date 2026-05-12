export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** JS getDay returns 0=sun..6=sat. We want 0=lun..6=dom (matches DOW_ES). */
export function dowOf(year: number, month: number, day: number): number {
  const js = new Date(year, month, day).getDay()
  return (js + 6) % 7
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const dow = dowOf(year, month, day)
  return dow === 5 || dow === 6 // sat or sun
}

export function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}
