import { useState } from 'react'
import {
  WEEKDAY_NAMES,
  dayKind,
  missedDay,
  nextTrainingDay,
  programLabel,
  scheduledDay,
  slotForWeekday,
} from '../data/program.ts'
import { getExercise } from '../data/exercises.ts'
import { formatDuration, formatReps, formatRest, weekdayOf } from '../lib/dates.ts'
import { volumeForLog } from '../lib/prs.ts'
import { sessionProgress } from '../lib/session.ts'
import { remaining, totalsForDate } from '../lib/diet.ts'
import { useStore } from '../state/Store.tsx'
import { Calendar } from '../ui/Calendar.tsx'
import { FinishRecap, SessionReview } from './SessionReview.tsx'
import { SessionView } from './Session.tsx'
import { DayMark } from '../ui/DayMark.tsx'
import { InstallBanner } from '../ui/Install.tsx'
import { OnboardingCard } from '../ui/Onboarding.tsx'
import { WeekRecapCard } from '../ui/WeekRecapCard.tsx'
import { WeekStrip } from '../ui/WeekStrip.tsx'
import type { DayProgram, ProgramBlock } from '../types.ts'

export function TodayPage() {
  const {
    state,
    days,
    today,
    selectedDate,
    setSelectedDate,
    startWorkout,
    startWalk,
    resumeWorkout,
    abandonWorkout,
    openExercise,
    openSession,
    openEat,
    reviewSessionId,
    sessionView,
    justFinished,
    dismissFinished,
    deloadOn,
  } = useStore()
  const [month, setMonth] = useState(false)

  if (state.activeSession && sessionView) return <SessionView />

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
        currentVersion={state.settings.programVersion}
        onBack={() => openSession(null)}
        onOpenExercise={openExercise}
      />
    )
  }

  const offDays = state.settings.offDays
  const weekday = weekdayOf(selectedDate)
  const slot = slotForWeekday(weekday)
  const day = scheduledDay(selectedDate, days, offDays)
  const dayLog = [...state.logs]
    .reverse()
    .find((l) => l.date === selectedDate && l.endedAt && l.blocks.some((b) => b.kind === 'lift'))
  const completed = new Set(
    state.logs.filter((l) => l.endedAt && l.blocks.some((b) => b.kind === 'lift')).map((l) => l.date),
  )
  const isToday = selectedDate === today
  const isSunday = weekday === 0
  const kind = dayKind(day)
  const liftCount = day?.blocks.filter((block) => block.kind === 'lift').length ?? 0
  const active = state.activeSession
  const activeDay = active ? days.find((d) => d.id === active.dayProgramId) : null
  const activeProgress = active ? sessionProgress(active) : null
  const fuel = totalsForDate(state.foodEntries, today)
  const fuelLeft = remaining(state.dietGoals, fuel)
  const nextUp = !day ? nextTrainingDay(selectedDate, days, offDays) : null
  const missed = isToday && !active ? missedDay(today, days, completed, offDays) : null
  const isOff = offDays.includes(weekday)

  const fuelChip = (() => {
    if (!state.dietGoals.kcal) return 'Log food'
    if (day && state.dietGoals.protein && fuelLeft.protein > 40) return `${fuelLeft.protein} g protein left`
    return `${fuelLeft.kcal} kcal left`
  })()

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">
          {WEEKDAY_NAMES[weekday]} {selectedDate}
          {deloadOn && isToday ? ' · deload week' : ''}
        </p>
        <h1>{isToday ? 'Today' : 'Calendar'}</h1>
        <p className="muted">{isOff ? 'Day off' : slot.window}</p>
        {slot.slots && !isOff && (
          <div className="slot-row">
            {slot.slots.map((s) => (
              <span key={s.label} className="slot-chip">
                <strong>{s.label}</strong> {s.window}
              </span>
            ))}
          </div>
        )}
        {slot.notes && !isOff && <p className="note">{slot.notes}</p>}
      </header>

      <OnboardingCard />

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

      {!day && (
        <div className="card kind-rest rest-hero poster-hero">
          <p className="eyebrow">Recovery</p>
          <DayMark kind="rest" />
          <h2>{isOff ? 'Day off' : 'Rest day'}</h2>
          <p className="muted">
            {nextUp
              ? `Next up ${nextUp.day.title}${nextUp.day.subtitle ? ` · ${nextUp.day.subtitle}` : ''} · ${WEEKDAY_NAMES[weekdayOf(nextUp.date)]}`
              : 'Nothing scheduled. Walk if you want.'}
          </p>
          <div className="mission-meta">
            <button type="button" className="mission-chip" onClick={() => openEat(true)}>
              {fuelChip}
            </button>
            {isToday && !active && (
              <button type="button" className="mission-chip" onClick={startWalk}>
                Walk now
              </button>
            )}
          </div>
        </div>
      )}

      {day && dayLog && (
        <div className={`card hero-card poster-hero kind-${kind}`}>
          <p className="eyebrow">Logged</p>
          <DayMark kind={kind} done />
          <h2>{day.title}</h2>
          <p className="muted">{day.subtitle} done</p>
          <div className="hero-meta">
            <span>{volumeForLog(dayLog).toLocaleString()} lbs</span>
            {dayLog.endedAt && <span>{formatDuration(dayLog.startedAt, dayLog.endedAt)}</span>}
            <span>{liftCount} lifts</span>
          </div>
          <div className="mission-meta">
            <button type="button" className="mission-chip" onClick={() => openEat(true)}>
              {fuelChip}
            </button>
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
        <div className={`card hero-card poster-hero kind-${kind}`}>
          <p className="eyebrow">
            {day.subtitle}
            {deloadOn ? ' · deload' : ''}
          </p>
          <DayMark kind={kind} />
          <h2>
            {day.title}
            {!isToday ? ` · ${WEEKDAY_NAMES[weekday]}` : ''}
          </h2>
          <div className="hero-meta">
            <span>{liftCount} lifts</span>
            <span>{slot.window}</span>
            {deloadOn && <span className="deload-tag">−10% · −1 set</span>}
          </div>
          <div className="mission-meta">
            <button type="button" className="mission-chip" onClick={() => openEat(true)}>
              {fuelChip}
            </button>
            {isToday && !active && (
              <button type="button" className="mission-chip" onClick={startWalk}>
                Walk only
              </button>
            )}
          </div>
          <DayPlan day={day} onReview={openExercise} />
          <button type="button" className="primary wide launch" onClick={() => startWorkout(day, today)}>
            {isToday ? 'Start workout' : `Start ${day.title} now (logs today)`}
          </button>
        </div>
      )}

      {missed && (!day || missed.day.id !== day.id) && (
        <div className={`card missed-card kind-${dayKind(missed.day)}`}>
          <p className="eyebrow">Missed {WEEKDAY_NAMES[weekdayOf(missed.date)]}</p>
          <h2>{programLabel(missed.day)}</h2>
          <p className="muted">Slot it in today. Logs as today, counts as a session.</p>
          <button type="button" className="primary wide" onClick={() => startWorkout(missed.day, today)}>
            Do {missed.day.title} now
          </button>
        </div>
      )}

      {isToday && isSunday && <WeekRecapCard logs={state.logs} bodyWeight={state.bodyWeight} today={today} title="Week recap" />}

      <button type="button" className="ghost" onClick={() => setMonth((on) => !on)}>
        {month ? 'Hide month' : 'Month'}
      </button>
      <WeekStrip
        today={today}
        selected={selectedDate}
        days={days}
        completed={completed}
        offDays={offDays}
        onPick={setSelectedDate}
      />
      {month && (
        <Calendar
          today={today}
          selected={selectedDate}
          days={days}
          completed={completed}
          offDays={offDays}
          onPick={setSelectedDate}
        />
      )}

      <InstallBanner />
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
