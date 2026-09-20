import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { formatClock } from '../lib/dates.ts'
import { BUZZ, askNotify, beep, buzz, notify, notifyPermission } from '../lib/haptics.ts'

/** Counts down from `seconds` once, starting on mount. Remount to restart. */
function useCountdown(seconds: number, onDone?: () => void) {
  const [left, setLeft] = useState(seconds)
  const done = useRef(onDone)

  useEffect(() => {
    done.current = onDone
  }, [onDone])

  useEffect(() => {
    const started = Date.now()
    const id = window.setInterval(() => {
      const next = Math.max(0, seconds - Math.floor((Date.now() - started) / 1000))
      setLeft(next)
      if (next <= 0) {
        window.clearInterval(id)
        done.current?.()
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [seconds])

  return left
}

export function RestOverlay({
  seconds,
  nextUp,
  onSkip,
  onUndo,
}: {
  seconds: number
  nextUp?: string
  onSkip: () => void
  /** Unchecks the set that started this rest. */
  onUndo?: () => void
}) {
  const [perm, setPerm] = useState(notifyPermission)
  const left = useCountdown(seconds, () => {
    buzz(BUZZ.restDone)
    beep()
    notify('Rest done', nextUp ? `Next up ${nextUp}` : undefined)
  })
  const over = left === 0
  const pct = seconds > 0 ? (left / seconds) * 100 : 0

  return (
    <div className={`rest-overlay${over ? ' over' : ''}`}>
      <p className="eyebrow">{over ? 'Go' : 'Rest'}</p>
      <div className="rest-ring" style={{ '--p': pct } as CSSProperties}>
        <div className="rest-ring-inner">
          <strong>{formatClock(left)}</strong>
        </div>
      </div>
      {nextUp && <p className="rest-next">Next up {nextUp}</p>}
      <button type="button" className="primary" onClick={onSkip}>
        {over ? 'Next set' : 'Skip rest'}
      </button>
      <div className="row rest-tools">
        {onUndo && (
          <button type="button" className="ghost" onClick={onUndo}>
            Undo set
          </button>
        )}
        {perm === 'default' && (
          <button
            type="button"
            className="ghost"
            onClick={() => {
              void askNotify().then(setPerm)
            }}
          >
            Buzz when screen is off
          </button>
        )}
      </div>
    </div>
  )
}

export function WalkTimer({
  durationSec,
  durationMaxSec,
  elapsedSec,
  done,
  onElapsed,
  onDone,
}: {
  durationSec: number
  durationMaxSec?: number
  elapsedSec: number
  done: boolean
  onElapsed: (sec: number) => void
  onDone: () => void
}) {
  const [running, setRunning] = useState(false)
  const elapsedRef = useRef(elapsedSec)
  const onElapsedRef = useRef(onElapsed)
  const onDoneRef = useRef(onDone)
  const target = durationMaxSec ?? durationSec

  useEffect(() => {
    elapsedRef.current = elapsedSec
    onElapsedRef.current = onElapsed
    onDoneRef.current = onDone
  }, [elapsedSec, onElapsed, onDone])

  useEffect(() => {
    if (!running) return
    const startedAt = Date.now()
    const base = elapsedRef.current
    const id = window.setInterval(() => {
      const next = base + Math.floor((Date.now() - startedAt) / 1000)
      onElapsedRef.current(next)
      if (next >= target) {
        window.clearInterval(id)
        setRunning(false)
        onDoneRef.current()
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [running, target])

  const shown = Math.min(elapsedSec, target)

  return (
    <div className="walk-timer">
      <strong>{formatClock(shown)}</strong>
      <span>
        {durationMaxSec ? `${formatClock(durationSec)}–${formatClock(durationMaxSec)}` : formatClock(durationSec)}
      </span>
      <div className="row">
        {!done && (
          <button type="button" className="primary" onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : elapsedSec > 0 ? 'Resume' : 'Start walk'}
          </button>
        )}
        {!done && (
          <button type="button" onClick={onDone}>
            Mark done
          </button>
        )}
        {done && <p className="muted">Walk done</p>}
      </div>
    </div>
  )
}
