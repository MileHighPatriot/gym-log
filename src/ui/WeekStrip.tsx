import { SCHEDULE, WEEKDAY_SHORT, dayById } from '../data/program.ts'
import { weekDates, weekdayOf } from '../lib/dates.ts'
import type { DayProgram } from '../types.ts'

export function WeekStrip({
  today,
  days,
  completed,
  onPick,
}: {
  today: string
  days: DayProgram[]
  completed: Set<string>
  onPick?: (date: string) => void
}) {
  const dates = weekDates(today)
  return (
    <div className="week-strip">
      {dates.map((date) => {
        const weekday = weekdayOf(date)
        const slot = SCHEDULE.find((s) => s.weekday === weekday)!
        const day = slot.dayProgramId ? dayById(days, slot.dayProgramId) : null
        const isToday = date === today
        const done = completed.has(date)
        return (
          <button
            key={date}
            type="button"
            className={`week-day${isToday ? ' today' : ''}${done ? ' done' : ''}`}
            onClick={() => onPick?.(date)}
          >
            <span>{WEEKDAY_SHORT[weekday]}</span>
            <strong>{date.slice(8)}</strong>
            <em>{day ? (day.id.startsWith('push') ? 'U' : day.id.startsWith('pull') ? 'P' : 'L') : 'R'}</em>
          </button>
        )
      })}
    </div>
  )
}
