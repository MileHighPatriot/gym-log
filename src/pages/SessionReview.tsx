import { EXERCISE_BY_ID, getExercise } from '../data/exercises.ts'
import { WEEKDAY_NAMES, dayKindFromId, programLabel } from '../data/program.ts'
import { formatClock, formatDuration } from '../lib/dates.ts'
import { volumeForLog } from '../lib/prs.ts'
import { DayMark } from '../ui/DayMark.tsx'
import type { DayProgram, SessionLog } from '../types.ts'

export function SessionReview({
  session,
  day,
  currentVersion,
  onBack,
  onOpenExercise,
}: {
  session: SessionLog
  day?: DayProgram | null
  currentVersion?: number
  onBack: () => void
  onOpenExercise: (id: string) => void
}) {
  const kind = dayKindFromId(session.dayProgramId)
  const duration = session.endedAt ? formatDuration(session.startedAt, session.endedAt) : ''
  const olderCard =
    session.programVersion != null && currentVersion != null && session.programVersion !== currentVersion

  return (
    <section className="page">
      <button type="button" className="ghost" onClick={onBack}>
        ← Back
      </button>
      <header className="page-head">
        <p className="eyebrow">
          {WEEKDAY_NAMES[session.weekday]} {session.date}
        </p>
        <h1>{programLabel(day, session.dayProgramId)}</h1>
      </header>

      <div className={`card hero-card poster-hero kind-${kind}`}>
        <p className="eyebrow">Session</p>
        <DayMark kind={kind} done />
        <div className="hero-meta">
          <span>{volumeForLog(session).toLocaleString()} lbs</span>
          {duration && <span>{duration}</span>}
          <span>{session.blocks.filter((b) => b.kind === 'lift').length} lifts</span>
          {session.deload && <span>deload</span>}
        </div>
        {olderCard && (
          <p className="muted">
            Logged on card v{session.programVersion}. Your Week is now v{currentVersion}; sets and reps below are
            what you did that day.
          </p>
        )}
      </div>

      {session.blocks.map((block) => {
        if (block.kind === 'walk') {
          return (
            <article key={block.id} className="card">
              <p className="eyebrow">Walk</p>
              <h2>{block.label}</h2>
              <p className="muted">
                {block.done
                  ? `${formatClock(block.elapsedSec)} of ${formatClock(block.durationMaxSec ?? block.durationSec)}`
                  : 'Not marked done'}
              </p>
            </article>
          )
        }
        const exercise = EXERCISE_BY_ID[block.exerciseId] ?? getExercise(block.exerciseId)
        const original = block.substituteOf ? EXERCISE_BY_ID[block.substituteOf] : null
        return (
          <article key={block.id} className={`card kind-${kind}`}>
            <p className="eyebrow">{exercise.equipment}</p>
            <h2>
              <button type="button" className="linkish" onClick={() => onOpenExercise(exercise.id)}>
                {exercise.name}
              </button>
            </h2>
            {original && <p className="muted">Swapped in for {original.name}</p>}
            <ul className="plain review-sets">
              {block.logged.map((set, i) => (
                <li key={i}>
                  <span>Set {i + 1}</span>
                  <span>
                    {set.done && set.weight != null && set.reps != null
                      ? `${set.weight} × ${set.reps}${set.rpe ? ` · ${set.rpe}` : ''}`
                      : 'Skipped'}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        )
      })}
    </section>
  )
}

export function FinishRecap({
  session,
  day,
  onDone,
  onReview,
}: {
  session: SessionLog
  day?: DayProgram | null
  onDone: () => void
  onReview: () => void
}) {
  const kind = dayKindFromId(session.dayProgramId)
  const duration = session.endedAt ? formatDuration(session.startedAt, session.endedAt) : ''

  return (
    <section className="page recap">
      <header className="page-head">
        <p className="eyebrow">Nice work</p>
        <h1>Session done</h1>
        <p className="muted">{programLabel(day, session.dayProgramId)}</p>
      </header>
      <div className={`card hero-card poster-hero kind-${kind}`}>
        <DayMark kind={kind} done />
        <p className="hero-stat">{volumeForLog(session).toLocaleString()}</p>
        <p className="muted">lbs moved{duration ? ` · ${duration}` : ''}</p>
      </div>
      <button type="button" className="primary wide launch" onClick={onReview}>
        Review session
      </button>
      <button type="button" className="wide" onClick={onDone}>
        Done
      </button>
    </section>
  )
}
