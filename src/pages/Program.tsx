import { useEffect, useState } from 'react'
import { AVOID } from '../data/avoid.ts'
import { SCHEDULE, WEEKDAY_NAMES, dayKind } from '../data/program.ts'
import { getExercise } from '../data/exercises.ts'
import { formatReps, formatRest } from '../lib/dates.ts'
import { useStore } from '../state/Store.tsx'
import { DayMark } from '../ui/DayMark.tsx'
import { laterCount } from '../data/suggestions.ts'
import { LaterIdeas } from './Later.tsx'
import type { DayProgram, LiftBlock } from '../types.ts'

function wantsLater() {
  return typeof location !== 'undefined' && (location.hash.includes('later') || location.hash.includes('try'))
}

export function ProgramPage() {
  const { days, updateDay, resetProgram, state, deloadOn, setDeload, updateSettings } = useStore()
  const [laterOpen, setLaterOpen] = useState(wantsLater)
  const pinned = state.pinnedSuggestions.length
  const ideas = laterCount(state.dismissedSuggestions)
  const offDays = state.settings.offDays

  useEffect(() => {
    if (!wantsLater()) return
    document.getElementById('later')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const toggleOff = (weekday: number) =>
    updateSettings({
      offDays: offDays.includes(weekday) ? offDays.filter((d) => d !== weekday) : [...offDays, weekday],
    })

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Mon–Sat · card v{state.settings.programVersion}</p>
        <h1>Week</h1>
        <p className="muted">Your program. Change sets, reps, or rest here.</p>
      </header>

      <article className={`card deload-card${deloadOn ? ' on' : ''}`}>
        <div className="row between">
          <div>
            <p className="eyebrow">Deload</p>
            <h2>{deloadOn ? 'This week is a deload' : 'Deload this week'}</h2>
            <p className="muted">−10% on every seed, one fewer set, no +5 nudges. Back to normal next Monday.</p>
          </div>
          <button
            type="button"
            className={deloadOn ? 'primary' : undefined}
            aria-pressed={deloadOn}
            onClick={() => setDeload(!deloadOn)}
          >
            {deloadOn ? 'On' : 'Off'}
          </button>
        </div>
      </article>

      {SCHEDULE.map((slot) => {
        const isOff = offDays.includes(slot.weekday)
        const day = slot.dayProgramId && !isOff ? days.find((d) => d.id === slot.dayProgramId) : null
        const kind = dayKind(day)
        return (
          <article key={slot.weekday} className={`card kind-${kind}`}>
            <div className="row between">
              <p className="eyebrow">
                {WEEKDAY_NAMES[slot.weekday]} · {isOff ? 'day off' : slot.window}
              </p>
              {slot.dayProgramId && (
                <button type="button" className="ghost small" onClick={() => toggleOff(slot.weekday)}>
                  {isOff ? 'Train this day' : 'Day off'}
                </button>
              )}
            </div>
            <DayMark kind={kind} />
            <h2>{day ? `${day.title}${day.subtitle ? ` · ${day.subtitle}` : ''}` : isOff ? 'Day off' : 'Rest'}</h2>
            {slot.slots && !isOff && (
              <div className="slot-row">
                {slot.slots.map((s) => (
                  <span key={s.label} className="slot-chip">
                    <strong>{s.label}</strong> {s.window}
                  </span>
                ))}
              </div>
            )}
            {slot.notes && !isOff && <p className="note">{slot.notes}</p>}
            {day &&
              day.blocks.map((block) => {
                if (block.kind === 'walk') {
                  return (
                    <p key={block.id} className="plan-line">
                      <strong>{block.label}</strong>
                      <span>
                        {block.durationMaxSec
                          ? `${block.durationSec / 60}–${block.durationMaxSec / 60} min`
                          : `${block.durationSec / 60} min`}
                      </span>
                    </p>
                  )
                }
                return (
                  <LiftEditor
                    key={`${block.id}-${block.sets}-${block.repMin}-${block.repMax}-${block.restSec}`}
                    block={block}
                    onChange={(next) =>
                      updateDay({
                        ...day,
                        blocks: day.blocks.map((b) => (b.id === next.id ? next : b)),
                      } satisfies DayProgram)
                    }
                  />
                )
              })}
          </article>
        )
      })}

      <article className="card">
        <h2>Avoid</h2>
        <ul className="plain">
          {AVOID.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.why}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="card" id="later">
        <button
          type="button"
          className="later-toggle"
          aria-expanded={laterOpen}
          onClick={() => setLaterOpen((on) => !on)}
        >
          <span>
            <p className="eyebrow">Later / pin</p>
            <h2>
              Later ({ideas}){pinned ? ` · ${pinned} pinned` : ''}
            </h2>
          </span>
          <strong aria-hidden>{laterOpen ? '−' : '+'}</strong>
        </button>
        {laterOpen && <LaterIdeas />}
      </article>

      {state.programOverride && (
        <button type="button" onClick={resetProgram}>
          Reset to original week
        </button>
      )}
    </section>
  )
}

type LiftDraft = { sets: string; repMin: string; repMax: string; restSec: string }

const draftFrom = (b: LiftBlock): LiftDraft => ({
  sets: String(b.sets),
  repMin: String(b.repMin),
  repMax: String(b.repMax),
  restSec: String(b.restSec),
})

/** Why a draft can't be saved, or null when it can. */
function liftDraftError(d: LiftDraft): string | null {
  const [sets, repMin, repMax, rest] = [d.sets, d.repMin, d.repMax, d.restSec].map(Number)
  if (!Number.isInteger(sets) || sets < 1 || sets > 10) return 'Sets must be 1 to 10.'
  if (!Number.isInteger(repMin) || repMin < 1 || !Number.isInteger(repMax) || repMax < 1) return 'Reps must be whole numbers.'
  if (repMin > repMax) return '“From” reps can’t be more than “to”.'
  if (!Number.isFinite(rest) || rest < 0 || rest > 600) return 'Rest must be 0 to 600 seconds.'
  return null
}

/** Edits a local draft; nothing is saved (and the card version doesn't move) until Save. */
function LiftEditor({ block, onChange }: { block: LiftBlock; onChange: (b: LiftBlock) => void }) {
  const [draft, setDraft] = useState<LiftDraft>(() => draftFrom(block))
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftFrom(block))
  const error = dirty ? liftDraftError(draft) : null
  const field = (name: keyof LiftDraft, label: string, extra?: { step?: string; min?: string }) => (
    <label>
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={extra?.min ?? '1'}
        step={extra?.step}
        value={draft[name]}
        aria-invalid={error ? true : undefined}
        onChange={(e) => setDraft((d) => ({ ...d, [name]: e.target.value }))}
      />
    </label>
  )
  return (
    <div className="lift-edit">
      <strong>{getExercise(block.exerciseId).name}</strong>
      <div className="row">
        {field('sets', 'sets')}
        {field('repMin', 'from')}
        {field('repMax', 'to')}
        {field('restSec', 'rest', { step: '15', min: '0' })}
      </div>
      {dirty ? (
        <>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="row">
            <button type="button" className="ghost small" onClick={() => setDraft(draftFrom(block))}>
              Cancel
            </button>
            <button
              type="button"
              className="primary small"
              disabled={error != null}
              onClick={() =>
                onChange({
                  ...block,
                  sets: Number(draft.sets),
                  repMin: Number(draft.repMin),
                  repMax: Number(draft.repMax),
                  restSec: Number(draft.restSec),
                })
              }
            >
              Save
            </button>
          </div>
        </>
      ) : (
        <p className="muted">
          {block.sets}×{formatReps(block.repMin, block.repMax)} · {formatRest(block.restSec)}
          {block.notes ? ` · ${block.notes}` : ''}
          {block.loadNote ? ` · ${block.loadNote}` : ''}
        </p>
      )}
    </div>
  )
}
