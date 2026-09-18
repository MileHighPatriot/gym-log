import type { LoggedSet } from '../types.ts'

export function SetRow({
  index,
  set,
  last,
  onChange,
}: {
  index: number
  set: LoggedSet
  last?: { weight: number | null; reps: number | null }
  onChange: (next: LoggedSet) => void
}) {
  return (
    <div className={`set-row${set.done ? ' done' : ''}`}>
      <span className="set-idx">{index + 1}</span>
      <label>
        <span>lbs</span>
        <input
          inputMode="decimal"
          type="number"
          step="5"
          min="0"
          value={set.weight ?? ''}
          placeholder={last?.weight != null ? String(last.weight) : '—'}
          onChange={(e) =>
            onChange({ ...set, weight: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
      </label>
      <label>
        <span>reps</span>
        <input
          inputMode="numeric"
          type="number"
          step="1"
          min="0"
          value={set.reps ?? ''}
          placeholder={last?.reps != null ? String(last.reps) : '—'}
          onChange={(e) =>
            onChange({ ...set, reps: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
      </label>
      <button
        type="button"
        className={set.done ? 'check on' : 'check'}
        onClick={() => onChange({ ...set, done: !set.done })}
      >
        {set.done ? '✓' : 'Set'}
      </button>
    </div>
  )
}
