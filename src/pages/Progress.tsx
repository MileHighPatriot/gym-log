import { useMemo, useState } from 'react'
import { EXERCISE_BY_ID } from '../data/exercises.ts'
import { WEEKDAY_SHORT } from '../data/program.ts'
import { weekDates, weekdayOf } from '../lib/dates.ts'
import { historyForExercise, recordsFromLogs, volumeForLog } from '../lib/prs.ts'
import { useStore } from '../state/Store.tsx'
import { WeekStrip } from '../ui/WeekStrip.tsx'

export function ProgressPage() {
  const { state, days, today, logBodyWeight, removeBodyWeight, exportBackup, importBackup } = useStore()
  const [lbs, setLbs] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const completed = new Set(state.logs.filter((l) => l.endedAt).map((l) => l.date))
  const records = recordsFromLogs(state.logs)
  const thisWeek = weekDates(today)
  const weekVolume = state.logs
    .filter((l) => l.endedAt && thisWeek.includes(l.date))
    .reduce((sum, l) => sum + volumeForLog(l), 0)

  const history = useMemo(
    () => (picked ? historyForExercise(state.logs, picked) : []),
    [picked, state.logs],
  )

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">History</p>
        <h1>Log</h1>
        <p className="muted">{weekVolume.toLocaleString()} lbs this week</p>
      </header>

      <WeekStrip today={today} days={days} completed={completed} />

      <div className="card">
        <h2>Body weight</h2>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            const n = Number(lbs)
            if (!n) return
            logBodyWeight(n)
            setLbs('')
          }}
        >
          <input
            inputMode="decimal"
            type="number"
            step="0.1"
            min="0"
            placeholder="lbs"
            value={lbs}
            onChange={(e) => setLbs(e.target.value)}
          />
          <button type="submit" className="primary">
            Save
          </button>
        </form>
        <ul className="plain">
          {[...state.bodyWeight]
            .reverse()
            .slice(0, 6)
            .map((row) => (
              <li key={row.date}>
                {row.date} · {row.lbs} lbs
                <button type="button" className="ghost" onClick={() => removeBodyWeight(row.date)}>
                  ×
                </button>
              </li>
            ))}
        </ul>
      </div>

      <div className="card">
        <h2>Personal records</h2>
        {records.length === 0 && <p className="muted">PRs show up after you finish a session.</p>}
        <ul className="plain">
          {records.map((r) => (
            <li key={r.exerciseId}>
              <button type="button" className="linkish" onClick={() => setPicked(r.exerciseId)}>
                {EXERCISE_BY_ID[r.exerciseId]?.name ?? r.exerciseId}
              </button>
              <span>
                {r.weight} × {r.reps} · {r.date}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {picked && (
        <div className="card">
          <h2>{EXERCISE_BY_ID[picked]?.name} history</h2>
          <Spark values={history.map((h) => h.bestWeight)} />
          <ul className="plain">
            {history
              .slice()
              .reverse()
              .map((h) => (
                <li key={h.date}>
                  {h.date} · {h.bestWeight} × {h.bestReps} · {h.volume.toLocaleString()} lbs
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>Sessions</h2>
        {state.logs.filter((l) => l.endedAt).length === 0 && (
          <p className="muted">Finish a workout and it lands here.</p>
        )}
        <ul className="plain">
          {[...state.logs]
            .filter((l) => l.endedAt)
            .reverse()
            .slice(0, 12)
            .map((l) => (
              <li key={l.id}>
                {WEEKDAY_SHORT[weekdayOf(l.date)]} {l.date} · {l.dayProgramId} · {volumeForLog(l).toLocaleString()} lbs
              </li>
            ))}
        </ul>
      </div>

      <div className="card">
        <h2>Backup</h2>
        <p className="muted">Your log lives on this phone. Export it so a wipe doesn’t eat it.</p>
        <div className="row wrap">
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([exportBackup()], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `gym-log-${today}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Export JSON
          </button>
          <label className="file">
            Import
            <input
              type="file"
              accept="application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const text = await file.text()
                importBackup(text)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>
    </section>
  )
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1, max - min)
  const w = 280
  const h = 64
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 8) - 4
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline fill="none" stroke="currentColor" strokeWidth="3" points={pts} />
    </svg>
  )
}
