import { useMemo, useState } from 'react'
import { AVOID } from '../data/avoid.ts'
import { EXERCISES, athleteFallback, getExercise } from '../data/exercises.ts'
import { recordFor } from '../lib/prs.ts'
import { lastSetForExercise } from '../lib/session.ts'
import { useStore } from '../state/Store.tsx'
import type { DayGroup, ExerciseRole } from '../types.ts'
import { ExerciseCues, ExerciseMedia } from '../ui/ExerciseMedia.tsx'

type Filter = 'all' | ExerciseRole | DayGroup | 'avoid'

export function ExercisesPage() {
  const { exerciseId, openExercise, state } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return EXERCISES.filter((ex) => {
      if (ex.kind === 'walk') return false
      if (filter === 'avoid') return false
      if (filter === 'card' || filter === 'swap' || filter === 'later') {
        if (ex.role !== filter) return false
      } else if (filter === 'push' || filter === 'pull' || filter === 'legs') {
        if (ex.dayGroup !== filter) return false
      }
      if (!needle) return true
      return (
        ex.name.toLowerCase().includes(needle) ||
        ex.equipment.toLowerCase().includes(needle) ||
        ex.muscles.some((m) => m.toLowerCase().includes(needle))
      )
    })
  }, [q, filter])

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
        <p className="muted">
          {exercise.role === 'card' ? 'On your card' : exercise.role === 'swap' ? 'Swap if a station is taken' : 'Later — not on the main card'}
          {exercise.videoCredit ? ` · ${exercise.videoCredit} video` : ''}
        </p>
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
      <div className="row wrap">
        {(
          [
            ['all', 'All'],
            ['card', 'On the card'],
            ['swap', 'Swaps'],
            ['later', 'Later'],
            ['push', 'Push'],
            ['pull', 'Pull'],
            ['legs', 'Legs'],
            ['avoid', 'Avoid'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={filter === id ? 'primary' : ''} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      {filter === 'avoid' && (
        <ul className="plain">
          {AVOID.filter((item) => {
            const needle = q.trim().toLowerCase()
            if (!needle) return true
            return item.name.toLowerCase().includes(needle) || item.why.toLowerCase().includes(needle)
          }).map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <span>
                {item.dayGroup} · {item.why}
              </span>
            </li>
          ))}
        </ul>
      )}
      {filter !== 'avoid' && <ul className="lift-list">
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
      </ul>}
    </section>
  )
}
