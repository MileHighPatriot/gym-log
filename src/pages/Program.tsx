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
                    key={block.id}
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

function LiftEditor({ block, onChange }: { block: LiftBlock; onChange: (b: LiftBlock) => void }) {
  return (
    <div className="lift-edit">
      <strong>{getExercise(block.exerciseId).name}</strong>
      <div className="row">
        <label>
          sets
          <input
            type="number"
            min="1"
            value={block.sets}
            onChange={(e) => onChange({ ...block, sets: Number(e.target.value) || 1 })}
          />
        </label>
        <label>
          from
          <input
            type="number"
            min="1"
            value={block.repMin}
            onChange={(e) => onChange({ ...block, repMin: Number(e.target.value) || 1 })}
          />
        </label>
        <label>
          to
          <input
            type="number"
            min="1"
            value={block.repMax}
            onChange={(e) => onChange({ ...block, repMax: Number(e.target.value) || 1 })}
          />
        </label>
        <label>
          rest
          <input
            type="number"
            min="0"
            step="15"
            value={block.restSec}
            onChange={(e) => onChange({ ...block, restSec: Number(e.target.value) || 0 })}
          />
        </label>
      </div>
      <p className="muted">
        {block.sets}×{formatReps(block.repMin, block.repMax)} · {formatRest(block.restSec)}
        {block.notes ? ` · ${block.notes}` : ''}
        {block.loadNote ? ` · ${block.loadNote}` : ''}
      </p>
    </div>
  )
}
