import { WEEKDAY_NAMES, dayById, dayKind, programLabel, slotForWeekday } from '../data/program.ts'
import { getExercise } from '../data/exercises.ts'
import { formatDuration, formatReps, formatRest, weekdayOf } from '../lib/dates.ts'
import { volumeForLog } from '../lib/prs.ts'
import { sessionProgress } from '../lib/session.ts'
import { useStore } from '../state/Store.tsx'
import { Calendar } from '../ui/Calendar.tsx'
import { EatPage } from './Eat.tsx'
import { FinishRecap, SessionReview } from './SessionReview.tsx'
import { SessionView } from './Session.tsx'
import { FuelBars } from '../ui/FuelBars.tsx'
import { totalsForDate } from '../lib/diet.ts'
import type { DayProgram, ProgramBlock } from '../types.ts'

export function TodayPage() {
  const {
    state,
    days,
    today,
    selectedDate,
    setSelectedDate,
    startWorkout,
    resumeWorkout,
    abandonWorkout,
    openExercise,
    openSession,
    reviewSessionId,
    sessionView,
    justFinished,
    dismissFinished,
    eatOpen,
    openEat,
  } = useStore()

  if (state.activeSession && sessionView) return <SessionView />
  if (eatOpen) return <EatPage />

  if (justFinished) {
    const finishedDay = days.find((d) => d.id === justFinished.dayProgramId)
    return (
      <FinishRecap
        session={justFinished}
        day={finishedDay}
        onDone={dismissFinished}
        onReview={() => {
          openSession(justFinished.id)
          dismissFinished()
        }}
      />
    )
  }

  const review = reviewSessionId ? state.logs.find((l) => l.id === reviewSessionId) : null
  if (review) {
    return (
      <SessionReview
        session={review}
        day={days.find((d) => d.id === review.dayProgramId)}
        onBack={() => openSession(null)}
        onOpenExercise={openExercise}
      />
    )
  }

  const weekday = weekdayOf(selectedDate)
  const slot = slotForWeekday(weekday)
  const day = slot.dayProgramId ? dayById(days, slot.dayProgramId) : null
  const dayLog = [...state.logs].reverse().find((l) => l.date === selectedDate && l.endedAt)
  const completed = new Set(state.logs.filter((l) => l.endedAt).map((l) => l.date))
  const isToday = selectedDate === today
  const kind = dayKind(day)
  const liftCount = day?.blocks.filter((block) => block.kind === 'lift').length ?? 0
  const active = state.activeSession
  const activeDay = active ? days.find((d) => d.id === active.dayProgramId) : null
  const activeProgress = active ? sessionProgress(active) : null

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">
          {WEEKDAY_NAMES[weekday]} {selectedDate}
        </p>
        <h1>{isToday ? 'Today' : 'Calendar'}</h1>
        <p className="muted">{slot.window}</p>
        {slot.notes && <p className="note">{slot.notes}</p>}
      </header>

      <div className="card fuel-card">
        <p className="eyebrow">Fuel</p>
        <h2>Eat</h2>
        {state.dietGoals.kcal > 0 ? (
          <FuelBars goals={state.dietGoals} totals={totalsForDate(state.foodEntries, today)} />
        ) : (
          <p className="muted">Set a daily calorie target. Type a food or snap a plate.</p>
        )}
        <div className="row">
          <button type="button" className="primary" onClick={() => openEat(true)}>
            Log food
          </button>
          <button type="button" onClick={() => openEat(true)}>
            Snap
          </button>
        </div>
      </div>

      {active && activeProgress && (
        <div className={`card resume-banner kind-${dayKind(activeDay)}`}>
          <p className="eyebrow">In progress</p>
          <h2>{programLabel(activeDay, active.dayProgramId)}</h2>
          <p className="muted">
            {activeProgress.done}/{activeProgress.total} done
          </p>
          <button type="button" className="primary wide launch" onClick={resumeWorkout}>
            Resume workout
          </button>
          <button type="button" className="wide" onClick={abandonWorkout}>
            Discard
          </button>
        </div>
      )}

      <Calendar today={today} selected={selectedDate} days={days} completed={completed} onPick={setSelectedDate} />

      {!day && (
        <div className="card kind-rest rest-hero">
          <p className="eyebrow">Recovery</p>
          <h2>Rest day</h2>
          <p className="muted">Nothing scheduled. Walk if you want. Training starts again Monday.</p>
        </div>
      )}

      {day && dayLog && (
        <div className={`card hero-card kind-${kind}`}>
          <p className="eyebrow">Logged</p>
          <h2>{day.title}</h2>
          <p className="muted">{day.subtitle} done</p>
          <div className="hero-meta">
            <span>{volumeForLog(dayLog).toLocaleString()} lbs</span>
            {dayLog.endedAt && <span>{formatDuration(dayLog.startedAt, dayLog.endedAt)}</span>}
            <span>{liftCount} lifts</span>
          </div>
          <DayPlan day={day} onReview={openExercise} />
          <button type="button" className="primary wide" onClick={() => openSession(dayLog.id)}>
            Review session
          </button>
          <button type="button" className="wide" onClick={() => startWorkout(day, today)}>
            Train this session now
          </button>
        </div>
      )}

      {day && !dayLog && (
        <div className={`card hero-card kind-${kind}`}>
          <p className="eyebrow">{day.subtitle}</p>
          <h2>
            {day.title}
            {!isToday ? ` · ${WEEKDAY_NAMES[weekday]}` : ''}
          </h2>
          <div className="hero-meta">
            <span>{liftCount} lifts</span>
            <span>{slot.window}</span>
          </div>
          <DayPlan day={day} onReview={openExercise} />
          <button type="button" className="primary wide launch" onClick={() => startWorkout(day, today)}>
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
