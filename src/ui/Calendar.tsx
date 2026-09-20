import { SCHEDULE, WEEKDAY_SHORT, dayById, dayKind } from '../data/program.ts'
import { monthGrid, monthLabel, sameMonth, shiftMonth, weekdayOf } from '../lib/dates.ts'
import type { DayProgram } from '../types.ts'
import { DayMark } from './DayMark.tsx'

function weeksInMonth(selected: string) {
  const cells = monthGrid(selected)
  const weeks: string[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7)
    if (week.some((date) => sameMonth(date, selected))) weeks.push(week)
  }
  return weeks
}

export function Calendar({
  today,
  selected,
  days,
  completed,
  offDays,
  onPick,
}: {
  today: string
  selected: string
  days: DayProgram[]
  completed: Set<string>
  offDays?: number[]
  onPick: (date: string) => void
}) {
  const weeks = weeksInMonth(selected)

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
      {weeks.map((week) => {
        const isOn = week.includes(selected)
        return (
          <div key={week[0]} className={`fight-week${isOn ? ' on' : ''}`}>
            {week.map((date) => {
              const weekday = weekdayOf(date)
              const slot = SCHEDULE.find((s) => s.weekday === weekday)!
              const day =
                slot.dayProgramId && !offDays?.includes(weekday) ? dayById(days, slot.dayProgramId) : null
              const inMonth = sameMonth(date, selected)
              const isToday = date === today
              const isSelected = date === selected
              const done = completed.has(date)
              const kind = dayKind(day)
              return (
                <button
                  key={date}
                  type="button"
                  className={`fight-row kind-${kind}${inMonth ? '' : ' dim'}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${done ? ' done' : ''}`}
                  onClick={() => onPick(date)}
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
      })}
      <p className="muted cal-legend">Tap a day to see that day’s work.</p>
    </div>
  )
}
