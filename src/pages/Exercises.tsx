import { useMemo, useState } from 'react'
import { EXERCISES, athleteFallback, getExercise } from '../data/exercises.ts'
import { recordFor } from '../lib/prs.ts'
import { lastSetForExercise } from '../lib/session.ts'
import { useStore } from '../state/Store.tsx'
import { ExerciseCues, ExerciseMedia } from '../ui/ExerciseMedia.tsx'

export function ExercisesPage() {
  const { exerciseId, openExercise, state } = useStore()
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return EXERCISES.filter((ex) => {
      if (ex.kind === 'walk') return false
      if (!needle) return true
      return (
        ex.name.toLowerCase().includes(needle) ||
        ex.equipment.toLowerCase().includes(needle) ||
        ex.muscles.some((m) => m.toLowerCase().includes(needle))
      )
    })
  }, [q])

  if (exerciseId) {
    const exercise = getExercise(exerciseId)
    const last = lastSetForExercise(state.logs, exercise.id)
    const pr = recordFor(state.logs, exercise.id)
    return (
      <section className="page">
        <button type="button" className="ghost" onClick={() => openExercise(null)}>
          ← Lifts
        </button>
        <header className="page-head">
          <p className="eyebrow">{exercise.equipment}</p>
          <h1>{exercise.name}</h1>
          <p className="muted">{exercise.muscles.join(' · ')}</p>
        </header>
        <ExerciseMedia exercise={exercise} />
        <div className="card">
          <h2>How to</h2>
          <ExerciseCues exercise={exercise} />
          <p className="muted">Visual aid only. The cues are the source of truth.</p>
        </div>
        <div className="stats">
          <div>
            <span>Last</span>
            <strong>{last?.weight != null ? `${last.weight} × ${last.reps}` : '—'}</strong>
          </div>
          <div>
            <span>PR</span>
            <strong>{pr ? `${pr.weight} × ${pr.reps}` : '—'}</strong>
          </div>
        </div>
        {exercise.substituteIds.length > 0 && (
          <div className="card">
            <h2>If it’s taken</h2>
            <div className="row wrap">
              {exercise.substituteIds.map((id) => (
                <button key={id} type="button" onClick={() => openExercise(id)}>
                  {getExercise(id).name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Library</p>
        <h1>Lifts</h1>
      </header>
      <input
        className="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search lifts"
        type="search"
      />
      <ul className="lift-list">
        {filtered.map((ex) => {
          const last = lastSetForExercise(state.logs, ex.id)
          return (
            <li key={ex.id}>
              <button type="button" className="lift-row" onClick={() => openExercise(ex.id)}>
                <img
                  src={ex.setupImage}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = athleteFallback
                  }}
                />
                <span>
                  <strong>{ex.name}</strong>
                  <em>
                    {ex.muscles[0]}
                    {last?.weight != null ? ` · last ${last.weight}×${last.reps}` : ''}
                  </em>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
