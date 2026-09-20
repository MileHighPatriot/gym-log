import { weekRecap } from '../lib/coach.ts'
import type { BodyWeight, SessionLog } from '../types.ts'

export function WeekRecapCard({
  logs,
  bodyWeight,
  today,
  title = 'This week',
}: {
  logs: SessionLog[]
  bodyWeight: BodyWeight[]
  today: string
  title?: string
}) {
  const recap = weekRecap(logs, bodyWeight, today)
  return (
    <div className="card recap-card">
      <p className="eyebrow">Recap</p>
      <h2>{title}</h2>
      <div className="hero-meta">
        <span>{recap.sessions} sessions</span>
        <span>{recap.volume.toLocaleString()} lbs</span>
        <span>{recap.prs} PR{recap.prs === 1 ? '' : 's'}</span>
        {recap.weightDelta != null && (
          <span>
            {recap.weightDelta > 0 ? '+' : ''}
            {recap.weightDelta} lb
          </span>
        )}
      </div>
      <p className="recap-sentence">{recap.sentence}</p>
    </div>
  )
}
