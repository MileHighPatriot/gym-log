import { useState } from 'react'
import { athleteFallback } from '../data/exercises.ts'
import type { Exercise } from '../types.ts'

export function ExerciseMedia({
  exercise,
  compact = false,
}: {
  exercise: Exercise
  compact?: boolean
}) {
  const [which, setWhich] = useState<'setup' | 'finish' | 'video'>('setup')
  const [broken, setBroken] = useState<Record<string, boolean>>({})

  return (
    <div className={compact ? 'media compact' : 'media'}>
      <div className="media-frame">
        {which === 'video' && exercise.youtubeId && !broken.youtube ? (
          <iframe
            title={`${exercise.name} tutorial`}
            src={`https://www.youtube.com/embed/${exercise.youtubeId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : which === 'video' && !broken.video ? (
          <video
            key={exercise.video}
            src={exercise.video}
            controls
            playsInline
            poster={exercise.setupImage}
            onError={() => setBroken((b) => ({ ...b, video: true }))}
          />
        ) : (
          <img
            src={which === 'finish' ? exercise.finishImage : exercise.setupImage}
            alt={`${exercise.name} ${which === 'finish' ? 'finish position' : 'setup'}`}
            onError={(event) => {
              const el = event.currentTarget
              el.onerror = null
              el.src = athleteFallback
            }}
          />
        )}
      </div>
      {exercise.videoCredit && which === 'video' && (
        <p className="muted">
          {exercise.videoCredit}
          {exercise.youtubeId && (
            <>
              {' · '}
              <a href={`https://www.youtube.com/watch?v=${exercise.youtubeId}`} target="_blank" rel="noreferrer">
                Open on YouTube
              </a>
            </>
          )}
        </p>
      )}
      <div className="media-tabs">
        <button type="button" className={which === 'setup' ? 'on' : ''} onClick={() => setWhich('setup')}>
          Setup
        </button>
        <button type="button" className={which === 'finish' ? 'on' : ''} onClick={() => setWhich('finish')}>
          Finish
        </button>
        <button type="button" className={which === 'video' ? 'on' : ''} onClick={() => setWhich('video')}>
          {exercise.youtubeId ? 'Tutorial' : 'Video'}
        </button>
      </div>
    </div>
  )
}

export function ExerciseCues({ exercise }: { exercise: Exercise }) {
  return (
    <ol className="cues">
      {exercise.cues.map((cue) => (
        <li key={cue}>{cue}</li>
      ))}
    </ol>
  )
}
