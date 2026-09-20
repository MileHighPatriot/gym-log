import { applySame, bumpReps, bumpWeight, formatLoad, formatPlates, setNudge } from '../lib/coach.ts'
import { formatReps } from '../lib/dates.ts'
import type { LoggedSet, Rpe } from '../types.ts'

const RPE: { id: Rpe; label: string }[] = [
  { id: 'easy', label: 'easy' },
  { id: 'ok', label: 'ok' },
  { id: 'hard', label: 'hard' },
]

export function SetRow({
  index,
  set,
  last,
  repMin,
  repMax,
  plateLoaded = false,
  onChange,
}: {
  index: number
  set: LoggedSet
  last?: { weight: number | null; reps: number | null }
  repMin: number
  repMax: number
  plateLoaded?: boolean
  onChange: (next: LoggedSet) => void
}) {
  const nudge = setNudge(last, repMax)
  const hasLast = last?.weight != null
  const toggle = () => onChange({ ...set, done: !set.done })
  const plates = plateLoaded && set.weight != null && set.weight > 0 ? formatPlates(set.weight) : ''
  return (
    <div className={`set-row${set.done ? ' done' : ''}`}>
      <button
        type="button"
        className="set-idx"
        onClick={toggle}
        aria-label={`Set ${index + 1}, tap to ${set.done ? 'unmark' : 'mark done'}`}
        aria-pressed={set.done}
      >
        {index + 1}
      </button>
      <div className="set-body">
        <p className="set-nudge">
          {hasLast ? (
            <>
              last {formatLoad(last)}
              {nudge ? <em> · {nudge}</em> : null}
            </>
          ) : (
            <>target {formatReps(repMin, repMax)} reps</>
          )}
        </p>
        <div className="set-inputs">
          <div className="set-field">
            <span>lbs</span>
            <div className="stepper">
              <button type="button" className="ghost" onClick={() => onChange(bumpWeight(set, -5))}>
                −5
              </button>
              <input
                inputMode="decimal"
                type="number"
                step="5"
                min="0"
                aria-label="lbs"
                value={set.weight ?? ''}
                placeholder={hasLast ? String(last?.weight) : '—'}
                onChange={(e) =>
                  onChange({ ...set, weight: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
              <button type="button" className="ghost" onClick={() => onChange(bumpWeight(set, 5))}>
                +5
              </button>
            </div>
            {plates && <small className="set-plates">{plates}</small>}
          </div>
          <div className="set-field">
            <span>reps</span>
            <div className="stepper">
              <button type="button" className="ghost" onClick={() => onChange(bumpReps(set, -1))}>
                −1
              </button>
              <input
                inputMode="numeric"
                type="number"
                step="1"
                min="0"
                aria-label="reps"
                value={set.reps ?? ''}
                placeholder={last?.reps != null ? String(last.reps) : formatReps(repMin, repMax)}
                onChange={(e) =>
                  onChange({ ...set, reps: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
              <button type="button" className="ghost" onClick={() => onChange(bumpReps(set, 1))}>
                +1
              </button>
            </div>
          </div>
        </div>
        <div className="set-actions">
          {hasLast && !set.done && (
            <button
              type="button"
              className="primary"
              onClick={() => {
                const same = applySame(last)
                if (same) onChange({ ...same, rpe: set.rpe })
              }}
            >
              Same
            </button>
          )}
          <button type="button" className={set.done ? 'check on' : 'check'} onClick={toggle}>
            {set.done ? '✓' : 'Set'}
          </button>
        </div>
        {set.done && (
          <div className="rpe-row" role="group" aria-label="How did that feel">
            {RPE.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`rpe${set.rpe === r.id ? ' on' : ''}`}
                aria-pressed={set.rpe === r.id}
                onClick={() => onChange({ ...set, rpe: set.rpe === r.id ? undefined : r.id })}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
