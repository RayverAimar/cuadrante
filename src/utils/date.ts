export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month, day).getDay()
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const dow = getDayOfWeek(year, month, day)
  return dow === 0 || dow === 6
}

export function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
