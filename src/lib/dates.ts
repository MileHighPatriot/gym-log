export function localISODate(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function weekdayOf(iso: string): number {
  return parseISODate(iso).getDay()
}

export function mondayOfWeek(iso: string): string {
  const date = parseISODate(iso)
  const day = date.getDay()
  const offset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + offset)
  return localISODate(date)
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return localISODate(date)
}

export function weekDates(iso: string): string[] {
  const monday = mondayOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function sundayOfWeek(iso: string): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() - date.getDay())
  return localISODate(date)
}

export function sundayWeekDates(iso: string): string[] {
  const start = sundayOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function formatRest(sec: number): string {
  if (sec <= 0) return '0s'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (s === 0) return `${m} min`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatClock(sec: number): string {
  const safe = Math.max(0, Math.floor(sec))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDuration(startedAt: string, endedAt: string): string {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return ''
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function formatReps(min: number, max: number): string {
  return min === max ? `${min}` : `${min}–${max}`
}

export function monthLabel(iso: string): string {
  return parseISODate(iso).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

export function shiftMonth(iso: string, delta: number): string {
  const date = parseISODate(iso)
  const day = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + delta)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, last))
  return localISODate(date)
}

export function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/** 6×7 grid starting Sunday, covering the month of `iso`. */
export function monthGrid(iso: string): string[] {
  const date = parseISODate(iso)
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const cell = new Date(start)
    cell.setDate(start.getDate() + i)
    return localISODate(cell)
  })
}
