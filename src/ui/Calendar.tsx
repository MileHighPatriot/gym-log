import { SCHEDULE, WEEKDAY_SHORT, dayById } from '../data/program.ts'
import { monthGrid, monthLabel, sameMonth, shiftMonth, weekdayOf } from '../lib/dates.ts'
import type { DayProgram } from '../types.ts'

export function Calendar({
  today,
  selected,
  days,
  completed,
  onPick,
}: {
  today: string
  selected: string
  days: DayProgram[]
  completed: Set<string>
  onPick: (date: string) => void
}) {
  const cells = monthGrid(selected)
  const month = selected.slice(0, 7)

  return (
    <div className="cal">
      <div className="cal-nav">
        <button type="button" onClick={() => onPick(shiftMonth(selected, -1))}>
          ‹
        </button>
        <strong>{monthLabel(selected)}</strong>
        <button type="button" onClick={() => onPick(shiftMonth(selected, 1))}>
          ›
        </button>
      </div>
      <div className="cal-weekdays">
        {WEEKDAY_SHORT.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((date) => {
          const weekday = weekdayOf(date)
          const slot = SCHEDULE.find((s) => s.weekday === weekday)!
          const day = slot.dayProgramId ? dayById(days, slot.dayProgramId) : null
          const inMonth = sameMonth(date, `${month}-01`)
          const isToday = date === today
          const isSelected = date === selected
          const done = completed.has(date)
          const mark = day ? (day.id.startsWith('push') ? 'U' : day.id.startsWith('pull') ? 'P' : 'L') : 'R'
          const kind = !day ? 'rest' : day.id.startsWith('push') ? 'push' : day.id.startsWith('pull') ? 'pull' : 'legs'
          return (
            <button
              key={date}
              type="button"
              className={`cal-cell kind-${kind}${inMonth ? '' : ' dim'}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${done ? ' done' : ''}`}
              onClick={() => onPick(date)}
            >
              <span className="cal-num">{date.slice(8)}</span>
              <em>{mark}</em>
            </button>
          )
        })}
      </div>
      <p className="muted cal-legend">U push · P pull · L legs · R rest. Tap a day to see that day’s work.</p>
    </div>
  )
}
