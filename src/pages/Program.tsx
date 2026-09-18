import { SCHEDULE, WEEKDAY_NAMES } from '../data/program.ts'
import { getExercise } from '../data/exercises.ts'
import { formatReps, formatRest } from '../lib/dates.ts'
import { useStore } from '../state/Store.tsx'
import type { DayProgram, LiftBlock } from '../types.ts'

export function ProgramPage() {
  const { days, updateDay, resetProgram, state } = useStore()

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Mon–Sat</p>
        <h1>Week</h1>
        <p className="muted">Your program. Change sets, reps, or rest here.</p>
      </header>

      {SCHEDULE.map((slot) => {
        const day = slot.dayProgramId ? days.find((d) => d.id === slot.dayProgramId) : null
        return (
          <article key={slot.weekday} className="card">
            <p className="eyebrow">{WEEKDAY_NAMES[slot.weekday]} · {slot.window}</p>
            <h2>{day ? `${day.title}${day.subtitle ? ` · ${day.subtitle}` : ''}` : 'Rest'}</h2>
            {slot.notes && <p className="note">{slot.notes}</p>}
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
