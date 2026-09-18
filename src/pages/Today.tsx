import { WEEKDAY_NAMES, dayById, slotForWeekday } from '../data/program.ts'
import { getExercise } from '../data/exercises.ts'
import { formatReps, formatRest, localISODate, weekdayOf } from '../lib/dates.ts'
import { volumeForLog } from '../lib/prs.ts'
import { useStore } from '../state/Store.tsx'
import { WeekStrip } from '../ui/WeekStrip.tsx'
import { SessionView } from './Session.tsx'

export function TodayPage() {
  const { state, days, today, startWorkout } = useStore()
  if (state.activeSession) return <SessionView />

  const weekday = weekdayOf(today)
  const slot = slotForWeekday(weekday)
  const day = slot.dayProgramId ? dayById(days, slot.dayProgramId) : null
  const todaysLog = [...state.logs].reverse().find((l) => l.date === today && l.endedAt)
  const completed = new Set(state.logs.filter((l) => l.endedAt).map((l) => l.date))

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">{WEEKDAY_NAMES[weekday]}</p>
        <h1>Today</h1>
        <p className="muted">{slot.window}</p>
        {slot.notes && <p className="note">{slot.notes}</p>}
      </header>

      <WeekStrip today={today} days={days} completed={completed} />

      {!day && (
        <div className="card">
          <h2>Rest day</h2>
          <p className="muted">Nothing scheduled. Walk if you want. Training starts again Monday.</p>
        </div>
      )}

      {day && todaysLog && (
        <div className="card">
          <p className="eyebrow">Logged</p>
          <h2>{day.title} done</h2>
          <p className="muted">{volumeForLog(todaysLog).toLocaleString()} lbs moved</p>
          <button type="button" onClick={() => startWorkout(day)}>
            Train again
          </button>
        </div>
      )}

      {day && !todaysLog && (
        <div className="card">
          <p className="eyebrow">{day.subtitle}</p>
          <h2>{day.title}</h2>
          <ol className="plan-list">
            {day.blocks.map((block) => (
              <li key={block.id}>
                {block.kind === 'walk' ? (
                  <>
                    <strong>{block.label}</strong>
                    <span>
                      {block.durationMaxSec
                        ? `${block.durationSec / 60}–${block.durationMaxSec / 60} min`
                        : `${block.durationSec / 60} min`}
                    </span>
                  </>
                ) : (
                  <>
                    <strong>{getExercise(block.exerciseId).name}</strong>
                    <span>
                      {block.sets}×{formatReps(block.repMin, block.repMax)} · {formatRest(block.restSec)}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ol>
          <button type="button" className="primary wide" onClick={() => startWorkout(day)}>
            Start workout
          </button>
        </div>
      )}

      <OtherDays today={today} />
    </section>
  )
}

function OtherDays({ today }: { today: string }) {
  const { days, startWorkout } = useStore()
  const weekday = weekdayOf(today)
  return (
    <div className="card">
      <h2>Train a different day</h2>
      <p className="muted">If you missed a session, start it anyway. It logs under {localISODate()}.</p>
      <div className="row wrap">
        {days.map((day) => {
          const isToday = day.id === slotForWeekday(weekday).dayProgramId
          if (isToday) return null
          return (
            <button key={day.id} type="button" onClick={() => startWorkout(day)}>
              {day.title}
              {day.subtitle ? ` · ${day.subtitle}` : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
