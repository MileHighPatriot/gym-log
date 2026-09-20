import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { formatClock } from '../lib/dates.ts'

export function useCountdown(running: boolean, seconds: number, onDone?: () => void) {
  const [left, setLeft] = useState(seconds)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    setLeft(seconds)
  }, [seconds, running])

  useEffect(() => {
    if (!running) return
    const started = Date.now()
    const startLeft = seconds
    const id = window.setInterval(() => {
      const next = Math.max(0, startLeft - Math.floor((Date.now() - started) / 1000))
      setLeft(next)
      if (next <= 0) {
        window.clearInterval(id)
        done.current?.()
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [running, seconds])

  return left
}

export function RestOverlay({
  seconds,
  onSkip,
}: {
  seconds: number
  onSkip: () => void
}) {
  const left = useCountdown(true, seconds)
  useEffect(() => {
    if (left !== 0) return
    if (navigator.vibrate) navigator.vibrate([80, 40, 80])
    onSkip()
  }, [left, onSkip])

  const pct = seconds > 0 ? (left / seconds) * 100 : 0

  return (
    <div className="rest-overlay">
      <p className="eyebrow">Rest</p>
      <div className="rest-ring" style={{ '--p': pct } as CSSProperties}>
        <div className="rest-ring-inner">
          <strong>{formatClock(left)}</strong>
        </div>
      </div>
      <button type="button" className="primary" onClick={onSkip}>
        Skip rest
      </button>
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
  const base = useRef(elapsedSec)
  const startedAt = useRef<number | null>(null)
  const onElapsedRef = useRef(onElapsed)
  const onDoneRef = useRef(onDone)
  onElapsedRef.current = onElapsed
  onDoneRef.current = onDone
  const target = durationMaxSec ?? durationSec

  useEffect(() => {
    if (!running) return
    startedAt.current = Date.now()
    base.current = elapsedSec
    const id = window.setInterval(() => {
      const next = base.current + Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000)
      onElapsedRef.current(next)
      if (next >= target) {
        window.clearInterval(id)
        setRunning(false)
        onDoneRef.current()
      }
    }, 200)
    return () => window.clearInterval(id)
    // elapsedSec is captured when running flips on
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
