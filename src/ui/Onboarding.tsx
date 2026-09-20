import { useState } from 'react'
import { WEEKDAY_SHORT } from '../data/program.ts'
import { goalFromWeight } from '../lib/coach.ts'
import { useStore } from '../state/Store.tsx'
import type { Goal } from '../types.ts'

/** First-run card on Today: weight, goal, days off. Skippable, never blocks. */
export function OnboardingCard() {
  const { state, updateSettings, logBodyWeight, setDietGoals } = useStore()
  const [lbs, setLbs] = useState('')
  const [goal, setGoal] = useState<Goal>('hold')
  const [off, setOff] = useState<number[]>(state.settings.offDays)

  // Existing users already told us who they are; only greet a genuinely empty app.
  if (state.settings.onboarded || state.logs.length > 0 || state.bodyWeight.length > 0) return null

  const save = () => {
    const n = Number(lbs)
    if (n > 0) {
      logBodyWeight(n)
      setDietGoals(goalFromWeight(n, goal))
    }
    updateSettings({ onboarded: true, goal, offDays: off })
  }

  return (
    <div className="card onboarding">
      <p className="eyebrow">Set up</p>
      <h2>Thirty seconds</h2>
      <p className="muted">Weight sets your fuel targets. Days off turn those cards into rest days.</p>
      <div className="row wrap">
        <label className="grow">
          lbs
          <input
            inputMode="decimal"
            type="number"
            min="0"
            step="0.1"
            placeholder="200"
            value={lbs}
            onChange={(e) => setLbs(e.target.value)}
          />
        </label>
      </div>
      <div className="row wrap goal-row">
        {(['hold', 'cut', 'gain'] as const).map((g) => (
          <button key={g} type="button" className={goal === g ? 'on' : undefined} onClick={() => setGoal(g)}>
            {g}
          </button>
        ))}
      </div>
      <p className="muted">Days you never train</p>
      <div className="row wrap goal-row">
        {WEEKDAY_SHORT.map((label, weekday) => (
          <button
            key={label}
            type="button"
            className={off.includes(weekday) ? 'on' : undefined}
            onClick={() => setOff((cur) => (cur.includes(weekday) ? cur.filter((d) => d !== weekday) : [...cur, weekday]))}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="row">
        <button type="button" className="primary" onClick={save}>
          Save setup
        </button>
        <button type="button" className="ghost" onClick={() => updateSettings({ onboarded: true })}>
          Not now
        </button>
      </div>
    </div>
  )
}
