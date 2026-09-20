import type { DietGoals } from '../types.ts'
import { remaining } from '../lib/diet.ts'

export function FuelBars({
  goals,
  totals,
}: {
  goals: DietGoals
  totals: { kcal: number; protein: number }
}) {
  const left = remaining(goals, totals)
  const kcalPct = goals.kcal ? Math.min(100, Math.round((totals.kcal / goals.kcal) * 100)) : 0
  const proteinPct = goals.protein ? Math.min(100, Math.round((totals.protein / goals.protein) * 100)) : 0
  return (
    <div className="fuel-bars">
      <div>
        <p className="eyebrow">Calories</p>
        <strong>
          {left.kcal.toLocaleString()} left
        </strong>
        <p className="muted">
          {Math.round(totals.kcal)} / {goals.kcal || '—'}
        </p>
        <div className="progress-track" aria-hidden>
          <div className="progress-fill" style={{ width: `${kcalPct}%` }} />
        </div>
      </div>
      <div>
        <p className="eyebrow">Protein</p>
        <strong>
          {left.protein} g left
        </strong>
        <p className="muted">
          {Math.round(totals.protein)} / {goals.protein || '—'} g
        </p>
        <div className="progress-track" aria-hidden>
          <div className="progress-fill protein" style={{ width: `${proteinPct}%` }} />
        </div>
      </div>
    </div>
  )
}
