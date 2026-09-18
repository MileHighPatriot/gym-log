import { useState } from 'react'
import { getExercise } from '../data/exercises.ts'
import { formatReps, formatRest } from '../lib/dates.ts'
import { lastSetForExercise, sessionProgress } from '../lib/session.ts'
import { useStore } from '../state/Store.tsx'
import { ExerciseCues, ExerciseMedia } from '../ui/ExerciseMedia.tsx'
import { SetRow } from '../ui/SetRow.tsx'
import { RestOverlay, WalkTimer } from '../ui/Timer.tsx'
import type { LoggedBlock, LoggedSet, SessionLog } from '../types.ts'

export function SessionView() {
  const { state, updateActive, finishWorkout, abandonWorkout, swapActiveLift, openExercise } = useStore()
  const session = state.activeSession
  const [index, setIndex] = useState(0)
  const [rest, setRest] = useState<number | null>(null)
  const [howTo, setHowTo] = useState(false)

  if (!session) return null

  const block = session.blocks[Math.min(index, session.blocks.length - 1)]
  const progress = sessionProgress(session)
  const exercise = block.kind === 'lift' ? getExercise(block.exerciseId) : null

  const patch = (next: SessionLog) => updateActive(next)

  const updateBlock = (id: string, fn: (b: LoggedBlock) => LoggedBlock) => {
    patch({
      ...session,
      blocks: session.blocks.map((b) => (b.id === id ? fn(b) : b)),
    })
  }

  const onSet = (setIndex: number, next: LoggedSet) => {
    if (block.kind !== 'lift') return
    const prev = block.logged[setIndex]
    updateBlock(block.id, (b) => {
      if (b.kind !== 'lift') return b
      const logged = b.logged.map((s, i) => (i === setIndex ? next : s))
      return { ...b, logged }
    })
    if (!prev.done && next.done) {
      const more = setIndex < block.logged.length - 1
      if (more) setRest(block.restSec)
    }
  }

  const substitutes = exercise ? exercise.substituteIds.map((id) => getExercise(id)) : []

  return (
    <section className="session">
      <header className="session-head">
        <button type="button" className="ghost" onClick={abandonWorkout}>
          Exit
        </button>
        <div>
          <p className="eyebrow">
            {progress.done}/{progress.total} done
          </p>
          <h1>
            {index + 1}/{session.blocks.length}
          </h1>
        </div>
        <button type="button" className="ghost" onClick={finishWorkout}>
          Finish
        </button>
      </header>

      {block.kind === 'walk' ? (
        <div className="card">
          <h2>{block.label}</h2>
          <p className="muted">
            {block.durationMaxSec ? 'Warm-up or cooldown walk. Timed, not sets.' : 'Timed walk.'}
          </p>
          <WalkTimer
            durationSec={block.durationSec}
            durationMaxSec={block.durationMaxSec}
            elapsedSec={block.elapsedSec}
            done={block.done}
            onElapsed={(sec) => updateBlock(block.id, (b) => (b.kind === 'walk' ? { ...b, elapsedSec: sec } : b))}
            onDone={() => updateBlock(block.id, (b) => (b.kind === 'walk' ? { ...b, done: true } : b))}
          />
        </div>
      ) : (
        exercise && (
          <>
            <div className="card">
              <p className="eyebrow">{exercise.equipment}</p>
              <h2>{exercise.name}</h2>
              <p className="muted">
                {block.sets} × {formatReps(block.repMin, block.repMax)} · rest {formatRest(block.restSec)}
              </p>
              {block.notes && <p className="note">{block.notes}</p>}
              {block.loadNote && <p className="note">{block.loadNote}</p>}
              {block.logged.map((set, i) => (
                <SetRow
                  key={i}
                  index={i}
                  set={set}
                  last={lastSetForExercise(state.logs, block.exerciseId) ?? undefined}
                  onChange={(next) => onSet(i, next)}
                />
              ))}
              <div className="row wrap">
                <button type="button" onClick={() => setHowTo(true)}>
                  How to
                </button>
                {substitutes.map((sub) => (
                  <button key={sub.id} type="button" onClick={() => swapActiveLift(block.id, sub.id)}>
                    Swap: {sub.name}
                  </button>
                ))}
              </div>
            </div>
            {howTo && (
              <div className="sheet">
                <ExerciseMedia exercise={exercise} compact />
                <ExerciseCues exercise={exercise} />
                <p className="muted">Visual aid only. Trust the cues if the clip looks off.</p>
                <button type="button" className="primary" onClick={() => setHowTo(false)}>
                  Back to sets
                </button>
                <button type="button" className="ghost" onClick={() => openExercise(exercise.id)}>
                  Open lift page
                </button>
              </div>
            )}
          </>
        )
      )}

      <div className="row session-nav">
        <button type="button" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Prev
        </button>
        <button
          type="button"
          className="primary"
          disabled={index >= session.blocks.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          Next
        </button>
      </div>

      {rest != null && <RestOverlay seconds={rest} onSkip={() => setRest(null)} />}
    </section>
  )
}
