import { WEEKDAY_NAMES, dayById, slotForWeekday } from '../data/program.ts'
import { getExercise } from '../data/exercises.ts'
import { formatReps, formatRest, weekdayOf } from '../lib/dates.ts'
import { volumeForLog } from '../lib/prs.ts'
import { useStore } from '../state/Store.tsx'
import { Calendar } from '../ui/Calendar.tsx'
import { SessionView } from './Session.tsx'
import type { DayProgram, ProgramBlock } from '../types.ts'

export function TodayPage() {
  const { state, days, today, selectedDate, setSelectedDate, startWorkout, openExercise } = useStore()
  if (state.activeSession) return <SessionView />

  const weekday = weekdayOf(selectedDate)
  const slot = slotForWeekday(weekday)
  const day = slot.dayProgramId ? dayById(days, slot.dayProgramId) : null
  const dayLog = [...state.logs].reverse().find((l) => l.date === selectedDate && l.endedAt)
  const completed = new Set(state.logs.filter((l) => l.endedAt).map((l) => l.date))
  const isToday = selectedDate === today

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">{WEEKDAY_NAMES[weekday]} {selectedDate}</p>
        <h1>{isToday ? 'Today' : 'Calendar'}</h1>
        <p className="muted">{slot.window}</p>
        {slot.notes && <p className="note">{slot.notes}</p>}
      </header>

      <Calendar today={today} selected={selectedDate} days={days} completed={completed} onPick={setSelectedDate} />

      {!day && (
        <div className="card">
          <h2>Rest day</h2>
          <p className="muted">Nothing scheduled. Walk if you want. Training starts again Monday.</p>
        </div>
      )}

      {day && dayLog && (
        <div className="card">
          <p className="eyebrow">Logged</p>
          <h2>
            {day.title} · {day.subtitle} done
          </h2>
          <p className="muted">{volumeForLog(dayLog).toLocaleString()} lbs moved</p>
          <DayPlan day={day} onReview={openExercise} />
          <button type="button" onClick={() => startWorkout(day, today)}>
            Train this session now
          </button>
        </div>
      )}

      {day && !dayLog && (
        <div className="card">
          <p className="eyebrow">{day.subtitle}</p>
          <h2>
            {day.title}
            {!isToday ? ` · ${WEEKDAY_NAMES[weekday]}` : ''}
          </h2>
          <DayPlan day={day} onReview={openExercise} />
          <button type="button" className="primary wide" onClick={() => startWorkout(day, today)}>
            {isToday ? 'Start workout' : `Start ${day.title} now (logs today)`}
          </button>
        </div>
      )}
    </section>
  )
}

function DayPlan({ day, onReview }: { day: DayProgram; onReview: (id: string) => void }) {
  return (
    <ol className="plan-list">
      {day.blocks.map((block) => (
        <PlanRow key={block.id} block={block} onReview={onReview} />
      ))}
    </ol>
  )
}

function PlanRow({ block, onReview }: { block: ProgramBlock; onReview: (id: string) => void }) {
  if (block.kind === 'walk') {
    return (
      <li>
        <strong>{block.label}</strong>
        <span>
          {block.durationMaxSec
            ? `${block.durationSec / 60}–${block.durationMaxSec / 60} min`
            : `${block.durationSec / 60} min`}
        </span>
      </li>
    )
  }
  const exercise = getExercise(block.exerciseId)
  return (
    <li>
      <button type="button" className="linkish" onClick={() => onReview(exercise.id)}>
        {exercise.name}
      </button>
      <span>
        {block.sets}×{formatReps(block.repMin, block.repMax)} · {formatRest(block.restSec)}
        <button type="button" className="ghost how-link" onClick={() => onReview(exercise.id)}>
          How to
        </button>
      </span>
    </li>
  )
}
