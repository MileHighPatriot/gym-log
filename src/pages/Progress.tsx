import { useMemo, useState } from 'react'
import { EXERCISE_BY_ID } from '../data/exercises.ts'
import { WEEKDAY_SHORT, dayKindFromId, programLabel } from '../data/program.ts'
import { backupOverdue } from '../lib/backup.ts'
import { useBackupActions } from '../lib/backupFile.ts'
import {
  bestLiftsThisWeek,
  epley,
  kindVolumeThisWeek,
  rollingAverage,
  sortedWeights,
  trainStreak,
  weekCompare,
  weightSlopePerWeek,
} from '../lib/coach.ts'
import { formatDuration, weekdayOf } from '../lib/dates.ts'
import { historyForExercise, recordsFromLogs, volumeForLog } from '../lib/prs.ts'
import { useStore } from '../state/Store.tsx'
import { SettingsButton } from '../ui/SettingsButton.tsx'
import { WeekRecapCard } from '../ui/WeekRecapCard.tsx'
import { WeekStrip } from '../ui/WeekStrip.tsx'
import { SessionReview } from './SessionReview.tsx'

type KindFilter = 'all' | 'push' | 'pull' | 'legs' | 'walk'

export function ProgressPage() {
  const {
    state,
    days,
    today,
    logBodyWeight,
    removeBodyWeight,
    reviewSessionId,
    openSession,
    openExercise,
    setSelectedDate,
    setTab,
  } = useStore()
  const [lbs, setLbs] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const { lastExport, canShare, download, share } = useBackupActions()
  const finished = state.logs.filter((l) => l.endedAt)
  const completed = new Set(finished.filter((l) => l.blocks.some((b) => b.kind === 'lift')).map((l) => l.date))
  const records = recordsFromLogs(state.logs)
  const streak = trainStreak(state.logs, today)
  const compare = weekCompare(state.logs, today)
  const best = bestLiftsThisWeek(state.logs, today)
  const balance = kindVolumeThisWeek(state.logs, today, dayKindFromId)
  const balanceMax = Math.max(1, balance.push, balance.pull, balance.legs)
  const weights = sortedWeights(state.bodyWeight)
  const avg7 = rollingAverage(state.bodyWeight, today)
  const slope = weightSlopePerWeek(weights.slice(-8))
  const overdue = backupOverdue(finished.length, lastExport)

  const history = useMemo(
    () => (picked ? historyForExercise(state.logs, picked) : []),
    [picked, state.logs],
  )
  const e1rm = history.map((h) => epley(h.bestWeight, h.bestReps))

  const review = reviewSessionId ? state.logs.find((l) => l.id === reviewSessionId) : null
  if (review) {
    return (
      <SessionReview
        session={review}
        day={days.find((d) => d.id === review.dayProgramId)}
        currentVersion={state.settings.programVersion}
        onBack={() => openSession(null)}
        onOpenExercise={openExercise}
      />
    )
  }

  const visibleSessions = [...finished]
    .reverse()
    .filter((l) => {
      if (kindFilter === 'all') return true
      const kind = dayKindFromId(l.dayProgramId)
      if (kindFilter === 'walk') return !l.blocks.some((b) => b.kind === 'lift')
      return kind === kindFilter
    })
    .slice(0, 12)

  return (
    <section className="page">
      <header className="page-head">
        <SettingsButton />
        <p className="eyebrow">History</p>
        <h1>Log</h1>
        <p className="hero-stat">{compare.thisWeek.toLocaleString()}</p>
        <p className="muted">lbs this week</p>
      </header>

      {overdue && (
        <div className="card nag-card">
          <p className="eyebrow">Backup</p>
          <h2>{lastExport ? 'Over two weeks since your last export' : 'Never backed up'}</h2>
          <p className="muted">Your log lives on this phone only. One tap saves it to Files, Drive, or iCloud.</p>
          <div className="row">
            <button type="button" className="primary" onClick={canShare ? share : download}>
              {canShare ? 'Share backup' : 'Export JSON'}
            </button>
          </div>
        </div>
      )}

      <WeekStrip
        today={today}
        selected={today}
        days={days}
        completed={completed}
        offDays={state.settings.offDays}
        onPick={(date) => {
          setSelectedDate(date)
          openSession(null)
          setTab('today')
        }}
      />

      <div className="stats">
        <div>
          <span>Streak</span>
          <strong className="log-stat">{streak}</strong>
          <p className="muted">{streak === 1 ? 'trained day' : 'trained days'}</p>
        </div>
        <div>
          <span>Vs last week</span>
          <strong className="log-stat">
            {compare.delta > 0 ? '+' : ''}
            {compare.delta.toLocaleString()}
          </strong>
          <p className="muted">
            {compare.lastWeek ? `${compare.lastWeek.toLocaleString()} last week` : 'No last week yet'}
          </p>
        </div>
      </div>

      <WeekRecapCard logs={state.logs} bodyWeight={state.bodyWeight} today={today} />

      <div className="card">
        <h2>Balance this week</h2>
        <p className="muted">Volume by day kind. The short bar is where Later ideas point.</p>
        <div className="balance">
          {(['push', 'pull', 'legs'] as const).map((k) => (
            <div key={k} className={`balance-row kind-${k}`}>
              <span>{k}</span>
              <div className="progress-track" aria-hidden>
                <div className="progress-fill" style={{ width: `${Math.round((balance[k] / balanceMax) * 100)}%` }} />
              </div>
              <strong>{balance[k].toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Best lifts this week</h2>
        {best.length === 0 && <p className="muted">Finish a session this week and the heaviest sets land here.</p>}
        <ul className="plain">
          {best.map((row) => (
            <li key={row.exerciseId}>
              <button type="button" className="linkish" onClick={() => setPicked(row.exerciseId)}>
                {EXERCISE_BY_ID[row.exerciseId]?.name ?? row.exerciseId}
              </button>
              <span>
                {row.weight} × {row.reps} · e1RM {epley(row.weight, row.reps)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Body weight</h2>
        {avg7 != null && (
          <p className="muted">
            7-day average <strong>{avg7}</strong> lbs
            {slope != null && slope !== 0 ? ` · ${slope > 0 ? '+' : ''}${slope} lb/wk` : ''}
          </p>
        )}
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
        <Spark values={weights.map((row) => row.lbs)} />
        <ul className="plain">
          {[...weights]
            .reverse()
            .slice(0, 6)
            .map((row) => {
              const avg = rollingAverage(state.bodyWeight, row.date)
              return (
                <li key={row.date}>
                  <span>
                    {row.date} · {row.lbs} lbs
                    {avg != null && avg !== row.lbs ? <em className="muted"> · avg {avg}</em> : null}
                  </span>
                  <button type="button" className="ghost" onClick={() => removeBodyWeight(row.date)}>
                    ×
                  </button>
                </li>
              )
            })}
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
          <div className="row between">
            <h2>{EXERCISE_BY_ID[picked]?.name} trend</h2>
            <button type="button" className="ghost small" onClick={() => setPicked(null)}>
              ×
            </button>
          </div>
          {e1rm.length > 0 && (
            <p className="muted">
              e1RM now <strong>{e1rm.at(-1)}</strong>
              {e1rm.length > 1 ? ` · was ${e1rm[0]}` : ''}
            </p>
          )}
          <Spark values={e1rm} />
          <ul className="plain">
            {history
              .slice()
              .reverse()
              .map((h) => (
                <li key={h.date}>
                  <span>
                    {h.date} · {h.bestWeight} × {h.bestReps}
                  </span>
                  <span>
                    e1RM {epley(h.bestWeight, h.bestReps)} · {h.volume.toLocaleString()} lbs
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="row between">
          <h2>Sessions</h2>
        </div>
        <div className="chip-row">
          {(
            [
              ['all', 'All'],
              ['push', 'Push'],
              ['pull', 'Pull'],
              ['legs', 'Legs'],
              ['walk', 'Walks'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={kindFilter === id ? 'primary' : undefined}
              onClick={() => setKindFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {finished.length === 0 && <p className="muted">Finish a workout and it lands here.</p>}
        {finished.length > 0 && visibleSessions.length === 0 && <p className="muted">Nothing of that kind yet.</p>}
        <ul className="plain">
          {visibleSessions.map((l) => {
            const day = days.find((d) => d.id === l.dayProgramId)
            const duration = l.endedAt ? formatDuration(l.startedAt, l.endedAt) : ''
            return (
              <li key={l.id}>
                <button type="button" className="session-row-btn" onClick={() => openSession(l.id)}>
                  <strong>
                    {programLabel(day, l.dayProgramId)}
                    {l.deload ? ' · deload' : ''}
                  </strong>
                  <span>
                    {WEEKDAY_SHORT[weekdayOf(l.date)]} {l.date}
                    {duration ? ` · ${duration}` : ''}
                    {` · ${volumeForLog(l).toLocaleString()} lbs`}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="card">
        <h2>Backup</h2>
        <p className="muted">
          Your log lives on this phone. Export it so a wipe doesn’t eat it.
          {lastExport ? ` Last export ${lastExport.slice(0, 10)}.` : ''}
        </p>
        <div className="row wrap">
          <button type="button" className="primary" onClick={canShare ? share : download}>
            {canShare ? 'Share backup' : 'Export JSON'}
          </button>
          <button type="button" onClick={() => setTab('settings')}>
            Import &amp; restore
          </button>
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
      <polygon className="spark-fill" points={`0,${h} ${pts} ${w},${h}`} />
      <polyline className="spark-line" fill="none" stroke="currentColor" strokeWidth="3" points={pts} />
    </svg>
  )
}
