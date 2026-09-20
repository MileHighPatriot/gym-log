import { useEffect, useState, type CSSProperties } from 'react'
import { SESSION_WINDOW_MIN, dayKindFromId } from '../data/program.ts'
import { getExercise } from '../data/exercises.ts'
import {
  elapsedMinutes,
  formatLoad,
  loadTypeFor,
  sameLoad,
  setNudge,
  suggestNext,
  warmupRamp,
  windowNudge,
} from '../lib/coach.ts'
import { formatReps, formatRest } from '../lib/dates.ts'
import { BUZZ, buzz } from '../lib/haptics.ts'
import { beatForSet, recordFor } from '../lib/prs.ts'
import { lastSetForExercise, lastSetsForExercise, sessionProgress } from '../lib/session.ts'
import { useStore } from '../state/Store.tsx'
import { ExerciseCues, ExerciseMedia } from '../ui/ExerciseMedia.tsx'
import { SetRow } from '../ui/SetRow.tsx'
import { RestOverlay, WalkTimer } from '../ui/Timer.tsx'
import type { LoggedBlock, LoggedSet, SessionLog } from '../types.ts'
import type { SetBeat } from '../lib/prs.ts'

function blockName(block: LoggedBlock): string {
  return block.kind === 'walk' ? block.label : getExercise(block.exerciseId).name
}

type Rest = { seconds: number; nextUp?: string; setIndex: number; advance: boolean }

/** Ticks once a minute so the HUD clock stays honest without re-rendering every second. */
function useMinuteTick() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])
}

export function SessionView() {
  const { state, updateActive, finishWorkout, leaveWorkout, swapActiveLift } = useStore()
  const session = state.activeSession
  const [index, setIndex] = useState(0)
  const [rest, setRest] = useState<Rest | null>(null)
  const [howTo, setHowTo] = useState(false)
  const [moment, setMoment] = useState<SetBeat | null>(null)
  useMinuteTick()

  useEffect(() => {
    if (!moment) return
    const id = window.setTimeout(() => setMoment(null), 2600)
    return () => window.clearTimeout(id)
  }, [moment])

  if (!session) return null

  const block = session.blocks[Math.min(index, session.blocks.length - 1)]
  const progress = sessionProgress(session)
  const exercise = block.kind === 'lift' ? getExercise(block.exerciseId) : null
  const kind = dayKindFromId(session.dayProgramId)
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0
  const last = block.kind === 'lift' ? lastSetForExercise(state.logs, block.exerciseId) : null
  const suggested =
    block.kind === 'lift'
      ? suggestNext(last, block.repMin, block.repMax, lastSetsForExercise(state.logs, block.exerciseId))
      : null
  const nudge = block.kind === 'lift' ? setNudge(last, block.repMax) : null
  const hudLast =
    block.kind !== 'lift'
      ? null
      : last?.weight == null
        ? `target ${formatReps(block.repMin, block.repMax)} reps`
        : suggested && !sameLoad(suggested, last)
          ? `last ${formatLoad(last)} · next ${formatLoad(suggested)}`
          : `last ${formatLoad(last)}${nudge ? ` · ${nudge}` : ''}`
  const openSet = block.kind === 'lift' ? block.logged.findIndex((set) => !set.done) : -1
  const setLabel =
    block.kind === 'lift'
      ? `${openSet === -1 ? block.logged.length : openSet + 1}/${block.logged.length}`
      : 'walk'
  const elapsed = elapsedMinutes(session.startedAt)
  const isLiftDay = session.blocks.some((b) => b.kind === 'lift')
  const nudgeCopy = isLiftDay ? windowNudge(elapsed, SESSION_WINDOW_MIN) : null
  const firstLift = session.blocks.findIndex((b) => b.kind === 'lift')
  const loadType = exercise ? loadTypeFor(exercise.equipment) : null
  const warmup =
    block.kind === 'lift' && index === firstLift
      ? warmupRamp(block.logged[0]?.weight ?? suggested?.weight, loadType)
      : []

  const patch = (next: SessionLog) => updateActive(next)

  const updateBlock = (id: string, fn: (b: LoggedBlock) => LoggedBlock) => {
    patch({
      ...session,
      blocks: session.blocks.map((b) => (b.id === id ? fn(b) : b)),
    })
  }

  const setDone = (setIndex: number, done: boolean) => {
    updateBlock(block.id, (b) => {
      if (b.kind !== 'lift') return b
      return { ...b, logged: b.logged.map((s, i) => (i === setIndex ? { ...s, done } : s)) }
    })
  }

  const nextBlockName = () => {
    const next = session.blocks[index + 1]
    return next ? blockName(next) : undefined
  }

  const onSet = (setIndex: number, next: LoggedSet) => {
    if (block.kind !== 'lift') return
    const prev = block.logged[setIndex]
    const pr = recordFor(state.logs, block.exerciseId)
    updateBlock(block.id, (b) => {
      if (b.kind !== 'lift') return b
      const logged = b.logged.map((s, i) => (i === setIndex ? next : s))
      return { ...b, logged }
    })
    if (!prev.done && next.done) {
      const beat = beatForSet({ next, last, pr })
      if (beat) {
        setMoment(beat)
        buzz(beat.kind === 'pr' ? BUZZ.pr : BUZZ.check)
      } else {
        buzz(BUZZ.check)
      }
      const more = setIndex < block.logged.length - 1
      const nextUp = more ? exercise?.name : nextBlockName()
      const hasNext = index < session.blocks.length - 1
      if (more || hasNext) {
        setRest({ seconds: block.restSec, nextUp, setIndex, advance: !more && hasNext })
      }
    }
  }

  const go = (next: number) => {
    setHowTo(false)
    setIndex(next)
  }

  const closeRest = () => {
    if (rest?.advance && index < session.blocks.length - 1) go(index + 1)
    setRest(null)
  }

  const undoRest = () => {
    if (rest) setDone(rest.setIndex, false)
    setRest(null)
  }

  const substitutes = exercise ? exercise.substituteIds.map((id) => getExercise(id)) : []

  return (
    <section className="session">
      <header className="session-hud">
        <button type="button" className="ghost" onClick={leaveWorkout}>
          Leave
        </button>
        <div className="session-hud-copy">
          <p className="eyebrow">
            {progress.done}/{progress.total} · set {setLabel} · {elapsed} min
            {session.deload ? ' · deload' : ''}
          </p>
          <h1>{blockName(block)}</h1>
          {hudLast && <p className="session-hud-last">{hudLast}</p>}
          {nudgeCopy && <p className="session-hud-nudge">{nudgeCopy}</p>}
        </div>
        <div className="session-hud-side">
          <div className="session-hud-ring" style={{ '--p': pct } as CSSProperties} aria-hidden>
            <span>{pct}%</span>
          </div>
          <button type="button" className="ghost" onClick={finishWorkout}>
            Finish
          </button>
        </div>
      </header>

      {block.kind === 'walk' ? (
        <div className={`card kind-${kind}`}>
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
            onDone={() => {
              buzz(BUZZ.check)
              updateBlock(block.id, (b) => (b.kind === 'walk' ? { ...b, done: true } : b))
            }}
          />
        </div>
      ) : (
        exercise && (
          <div className={`card kind-${kind}`}>
            <p className="muted set-plan">
              {block.sets} × {formatReps(block.repMin, block.repMax)} · rest {formatRest(block.restSec)}
              {exercise.equipment !== exercise.name ? ` · ${exercise.equipment}` : ''}
            </p>
            {block.notes && <p className="note">{block.notes}</p>}
            {block.loadNote && <p className="note">{block.loadNote}</p>}
            {warmup.length > 0 && (
              <p className="warmup">
                <span>Warm-up</span>
                {warmup.map((w, i) => (
                  <em key={i}>
                    {w.weight} × {w.reps}
                  </em>
                ))}
                <small>not counted</small>
              </p>
            )}
            {block.logged.map((set, i) => (
              <SetRow
                key={i}
                index={i}
                set={set}
                last={last ?? undefined}
                repMin={block.repMin}
                repMax={block.repMax}
                loadType={loadType}
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
        )
      )}

      {howTo && exercise && (
        <div className="sheet-backdrop" onClick={() => setHowTo(false)}>
          <div
            className="sheet how-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`How to ${exercise.name}`}
          >
            <ExerciseMedia exercise={exercise} compact />
            <ExerciseCues exercise={exercise} />
            <p className="muted">Visual aid only. Trust the cues if the clip looks off.</p>
            <button type="button" className="primary wide" onClick={() => setHowTo(false)}>
              Back to sets
            </button>
          </div>
        </div>
      )}

      <div className="row session-nav">
        <button type="button" disabled={index === 0} onClick={() => go(index - 1)}>
          Prev
        </button>
        <button
          type="button"
          className="primary"
          disabled={index >= session.blocks.length - 1}
          onClick={() => go(index + 1)}
        >
          Next
        </button>
      </div>

      {moment && (
        <div className={`moment-toast kind-${moment.kind}`} role="status">
          {moment.text}
        </div>
      )}

      {rest != null && (
        <RestOverlay seconds={rest.seconds} nextUp={rest.nextUp} onSkip={closeRest} onUndo={undoRest} />
      )}
    </section>
  )
}
