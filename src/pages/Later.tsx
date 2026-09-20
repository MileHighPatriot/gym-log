import { SUGGESTIONS } from '../data/suggestions.ts'
import { DAYS, dayKind, dayKindFromId, slotForWeekday } from '../data/program.ts'
import { getExercise } from '../data/exercises.ts'
import { kindVolumeThisWeek, laterRank } from '../lib/coach.ts'
import { formatReps, formatRest, weekdayOf } from '../lib/dates.ts'
import { useStore } from '../state/Store.tsx'
import { ExerciseCues, ExerciseMedia } from '../ui/ExerciseMedia.tsx'
import { DayMark } from '../ui/DayMark.tsx'
import type { DayProgram, Suggestion } from '../types.ts'

export function LaterIdeas() {
  const { state, days, today, pinSuggestion, unpinSuggestion, dismissSuggestion, openExercise } = useStore()
  const slot = slotForWeekday(weekdayOf(today))
  const todayDay = slot.dayProgramId ? days.find((d) => d.id === slot.dayProgramId) : null
  const kindNow = dayKind(todayDay)
  const vol = kindVolumeThisWeek(state.logs, today, dayKindFromId)
  const gap = (['push', 'pull', 'legs'] as const)
    .filter((k) => k !== kindNow)
    .sort((a, b) => vol[a] - vol[b] || a.localeCompare(b))[0]
  const visible = SUGGESTIONS.filter((s) => !state.dismissedSuggestions.includes(s.id))
    .slice()
    .sort(
      (a, b) =>
        laterRank(dayKindFromId(a.fitsDayProgramId), kindNow, vol) -
        laterRank(dayKindFromId(b.fitsDayProgramId), kindNow, vol),
    )

  return (
    <div className="later-list">
      <p className="muted">
        {kindNow !== 'rest' ? `Today-kind ${kindNow} first. Gap this week: ${gap}.` : `Rest day. Gap this week: ${gap}.`}
      </p>
      {visible.length === 0 && (
        <div className="card">
          <p className="muted">You dismissed the ideas. They’ll stay gone unless you reset the program backup.</p>
        </div>
      )}
      {visible.map((suggestion) => (
        <LaterCard
          key={suggestion.id}
          suggestion={suggestion}
          kindNow={kindNow}
          gap={gap}
          vol={vol}
          pinned={state.pinnedSuggestions.find((p) => p.suggestionId === suggestion.id)}
          days={days}
          onPin={pinSuggestion}
          onUnpin={unpinSuggestion}
          onDismiss={dismissSuggestion}
          onOpen={openExercise}
        />
      ))}
    </div>
  )
}

function LaterCard({
  suggestion,
  kindNow,
  gap,
  vol,
  pinned,
  days,
  onPin,
  onUnpin,
  onDismiss,
  onOpen,
}: {
  suggestion: Suggestion
  kindNow: 'push' | 'pull' | 'legs' | 'rest'
  gap: 'push' | 'pull' | 'legs'
  vol: { push: number; pull: number; legs: number }
  pinned?: { suggestionId: string; dayProgramId: string }
  days: DayProgram[]
  onPin: (id: string, dayProgramId: string) => void
  onUnpin: (id: string) => void
  onDismiss: (id: string) => void
  onOpen: (id: string) => void
}) {
  const exercise = getExercise(suggestion.exerciseId)
  const day =
    days.find((d) => d.id === suggestion.fitsDayProgramId) ??
    days.find((d) => d.id.startsWith(suggestion.fitsDayProgramId.split('-')[0]))
  if (!day) return null
  const kind = dayKindFromId(day.id)
  const whyWeek =
    kind === kindNow && kindNow !== 'rest'
      ? `Fits today’s ${kindNow}.`
      : kind === gap && vol.push + vol.pull + vol.legs > 0
        ? `Least ${kind} volume this week.`
        : null
  return (
    <article className={`card kind-${kind}`}>
      <p className="eyebrow">
        {whyWeek ? `${whyWeek} ` : ''}
        Fits {day.title}
        {day.subtitle ? ` · ${day.subtitle}` : ''}
      </p>
      <DayMark kind={kind} />
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
          <button type="button" onClick={() => onUnpin(suggestion.id)}>
            Unpin
          </button>
        ) : (
          DAYS.filter(
            (d) => d.id === suggestion.fitsDayProgramId || d.id.startsWith(suggestion.fitsDayProgramId.split('-')[0]),
          ).map((d) => (
            <button key={d.id} type="button" className="primary" onClick={() => onPin(suggestion.id, d.id)}>
              Pin to {d.title}
              {d.subtitle ? ` · ${d.subtitle}` : ''}
            </button>
          ))
        )}
        <button type="button" onClick={() => onOpen(exercise.id)}>
          Open lift
        </button>
        <button type="button" className="ghost" onClick={() => onDismiss(suggestion.id)}>
          Dismiss
        </button>
      </div>
      {pinned && <p className="note">Pinned. It will show up before the cooldown walk.</p>}
    </article>
  )
}
