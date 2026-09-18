import { SUGGESTIONS } from '../data/suggestions.ts'
import { DAYS } from '../data/program.ts'
import { getExercise } from '../data/exercises.ts'
import { formatReps, formatRest } from '../lib/dates.ts'
import { useStore } from '../state/Store.tsx'
import { ExerciseCues, ExerciseMedia } from '../ui/ExerciseMedia.tsx'

export function TryNextPage() {
  const { state, days, pinSuggestion, unpinSuggestion, dismissSuggestion, openExercise } = useStore()
  const visible = SUGGESTIONS.filter((s) => !state.dismissedSuggestions.includes(s.id))

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Ideas, not a second program</p>
        <h1>Try next</h1>
      </header>
      {visible.length === 0 && (
        <div className="card">
          <p className="muted">You dismissed the ideas. They’ll stay gone unless you reset the program backup.</p>
        </div>
      )}
      {visible.map((suggestion) => {
        const exercise = getExercise(suggestion.exerciseId)
        const day =
          days.find((d) => d.id === suggestion.fitsDayProgramId) ??
          days.find((d) => d.id.startsWith(suggestion.fitsDayProgramId.split('-')[0]))
        if (!day) return null
        const pinned = state.pinnedSuggestions.find((p) => p.suggestionId === suggestion.id)
        return (
          <article key={suggestion.id} className="card">
            <p className="eyebrow">Fits {day.title}{day.subtitle ? ` · ${day.subtitle}` : ''}</p>
            <h2>{suggestion.title}</h2>
            <p>{suggestion.why}</p>
            <p className="muted">
              {suggestion.sets} × {formatReps(suggestion.repMin, suggestion.repMax)}
              {suggestion.restSec ? ` · rest ${formatRest(suggestion.restSec)}` : ''}
            </p>
            <ExerciseMedia exercise={exercise} compact />
            <ExerciseCues exercise={exercise} />
            <div className="row wrap">
              {pinned ? (
                <button type="button" onClick={() => unpinSuggestion(suggestion.id)}>
                  Unpin
                </button>
              ) : (
                DAYS.filter((d) => d.id === suggestion.fitsDayProgramId || d.id.startsWith(suggestion.fitsDayProgramId.split('-')[0])).map(
                  (d) => (
                    <button key={d.id} type="button" className="primary" onClick={() => pinSuggestion(suggestion.id, d.id)}>
                      Pin to {d.title}
                      {d.subtitle ? ` · ${d.subtitle}` : ''}
                    </button>
                  ),
                )
              )}
              <button type="button" onClick={() => openExercise(exercise.id)}>
                Open lift
              </button>
              <button type="button" className="ghost" onClick={() => dismissSuggestion(suggestion.id)}>
                Dismiss
              </button>
            </div>
            {pinned && <p className="note">Pinned. It will show up before the cooldown walk.</p>}
          </article>
        )
      })}
    </section>
  )
}
