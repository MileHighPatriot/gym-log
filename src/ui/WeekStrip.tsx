import { SCHEDULE, WEEKDAY_SHORT, dayById, dayKind } from '../data/program.ts'
import { sundayWeekDates, weekdayOf } from '../lib/dates.ts'
import type { DayProgram } from '../types.ts'
import { DayMark } from './DayMark.tsx'

export function WeekStrip({
  today,
  selected,
  days,
  completed,
  offDays,
  onPick,
}: {
  today: string
  selected?: string
  days: DayProgram[]
  completed: Set<string>
  offDays?: number[]
  onPick?: (date: string) => void
}) {
  const dates = sundayWeekDates(today)
  return (
    <div className="week-strip">
      {dates.map((date) => {
        const weekday = weekdayOf(date)
        const slot = SCHEDULE.find((s) => s.weekday === weekday)!
        const day = slot.dayProgramId && !offDays?.includes(weekday) ? dayById(days, slot.dayProgramId) : null
        const isToday = date === today
        const done = completed.has(date)
        const kind = dayKind(day)
        return (
          <button
            key={date}
            type="button"
            className={`week-day kind-${kind}${isToday ? ' today' : ''}${selected === date || (!selected && isToday) ? ' selected' : ''}${done ? ' done' : ''}`}
            onClick={() => onPick?.(date)}
          >
            <span className="fight-when">
              <em>{WEEKDAY_SHORT[weekday]}</em>
              <strong>{date.slice(8)}</strong>
            </span>
            <DayMark kind={kind} done={done} />
          </button>
        )
      })}
    </div>
  )
}
