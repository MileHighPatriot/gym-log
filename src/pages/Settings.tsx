import { useEffect, useState } from 'react'
import { WEEKDAY_SHORT } from '../data/program.ts'
import type { BackupSummary } from '../lib/backup.ts'
import { useBackupActions } from '../lib/backupFile.ts'
import { goalFromWeight, sortedWeights } from '../lib/coach.ts'
import { loadGeminiKey, saveGeminiKey } from '../lib/gemini.ts'
import { checkForUpdate, type UpdateCheck } from '../lib/sw.ts'
import { useStore } from '../state/Store.tsx'
import { ConfirmSheet } from '../ui/ConfirmSheet.tsx'
import { InstallBanner } from '../ui/Install.tsx'
import type { AppState, Goal } from '../types.ts'

type PendingImport = { state: AppState; summary: BackupSummary; fileName: string }

function stamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** Rough bytes this app holds in localStorage (UTF-16, so two per character). That store caps near 5 MB. */
function localBytes(): number {
  let total = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('gym-log')) total += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2
    }
  } catch {
    /* blocked */
  }
  return total
}

function mb(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function SettingsPage() {
  const { state, updateSettings, setDietGoals, previewImport, applyImport, snapshotAt, restoreSnapshot } = useStore()
  const { lastExport, canShare, download, share } = useBackupActions()
  const [key, setKey] = useState(() => loadGeminiKey())
  const [keySaved, setKeySaved] = useState(false)
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [importError, setImportError] = useState('')
  const [importDone, setImportDone] = useState('')
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [update, setUpdate] = useState<UpdateCheck | 'checking' | null>(null)

  const latestLbs = sortedWeights(state.bodyWeight).at(-1)?.lbs
  const offDays = state.settings.offDays

  useEffect(() => {
    let live = true
    void navigator.storage
      ?.persisted?.()
      .then((on) => {
        if (live) setPersisted(on)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])

  const pickGoal = (goal: Goal) => {
    updateSettings({ goal })
    if (latestLbs) setDietGoals(goalFromWeight(latestLbs, goal))
  }

  const toggleOff = (weekday: number) =>
    updateSettings({
      offDays: offDays.includes(weekday) ? offDays.filter((d) => d !== weekday) : [...offDays, weekday],
    })

  const readImport = async (file: File) => {
    setImportError('')
    setImportDone('')
    let text = ''
    try {
      text = await file.text()
    } catch {
      setImportError('Couldn’t read that file.')
      return
    }
    const result = previewImport(text)
    if (!result.ok) {
      setImportError(result.error)
      return
    }
    setPending({ state: result.state, summary: result.summary, fileName: file.name })
  }

  return (
    <section className="page settings">
      <header className="page-head">
        <p className="eyebrow">App</p>
        <h1>Settings</h1>
      </header>

      <div className="card">
        <p className="eyebrow">Training</p>
        <h2>Goal</h2>
        <p className="muted">
          {latestLbs ? `Sets your food targets from ${latestLbs} lbs.` : 'Log a body weight on Log to turn this into food targets.'}
        </p>
        <div className="row wrap goal-row">
          {(['hold', 'cut', 'gain'] as const).map((goal) => (
            <button
              key={goal}
              type="button"
              className={state.settings.goal === goal ? 'on' : undefined}
              aria-pressed={state.settings.goal === goal}
              onClick={() => pickGoal(goal)}
            >
              {goal}
            </button>
          ))}
        </div>
        <h2 className="settings-sub">Days you never train</h2>
        <div className="row wrap goal-row">
          {WEEKDAY_SHORT.map((label, weekday) => (
            <button
              key={label}
              type="button"
              className={offDays.includes(weekday) ? 'on' : undefined}
              aria-pressed={offDays.includes(weekday)}
              onClick={() => toggleOff(weekday)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Food</p>
        <h2>Photo key</h2>
        <p className="muted">Gemini key for Snap a plate and Read a label. Stays on this phone and never goes in a backup.</p>
        <div className="row">
          <input
            className="grow"
            type="password"
            autoComplete="off"
            placeholder="Gemini API key"
            value={key}
            onChange={(e) => {
              setKey(e.target.value)
              setKeySaved(false)
            }}
          />
          <button
            type="button"
            onClick={() => {
              saveGeminiKey(key)
              setKey(key.trim())
              setKeySaved(true)
            }}
          >
            Save
          </button>
        </div>
        {keySaved && <p className="muted">{key ? 'Saved.' : 'Key removed.'}</p>}
      </div>

      <div className="card">
        <p className="eyebrow">Data</p>
        <h2>Backup</h2>
        <p className="muted">
          Everything lives on this phone. Deleting the home-screen app deletes it too, so export first.
          {lastExport ? ` Last export ${stamp(lastExport)}.` : ' Never exported.'}
        </p>
        <div className="row wrap">
          {canShare && (
            <button type="button" className="primary" onClick={share}>
              Share backup
            </button>
          )}
          <button type="button" className={canShare ? undefined : 'primary'} onClick={download}>
            Export JSON
          </button>
          <label className="file">
            Import
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void readImport(file)
              }}
            />
          </label>
        </div>
        {importError && (
          <p className="form-error" role="alert">
            {importError} Nothing was changed.
          </p>
        )}
        {importDone && <p className="muted">{importDone}</p>}

        <h2 className="settings-sub">Safety copy</h2>
        <p className="muted">
          {snapshotAt
            ? `Taken automatically ${stamp(snapshotAt)}. A new one is made once a day and before any import or restore.`
            : 'Made automatically once a day and before any import.'}
        </p>
        {snapshotAt && (
          <button type="button" onClick={() => setConfirmRestore(true)}>
            Restore safety copy
          </button>
        )}

        <p className="muted storage-line">
          Log data {mb(localBytes())} of about 5 MB
          {persisted != null && (persisted ? ' · protected from cleanup' : ' · the phone may clear this if space runs low')}
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">App</p>
        <h2>Version</h2>
        <p className="muted">Build {__APP_VERSION__}</p>
        <div className="row wrap">
          <button
            type="button"
            disabled={update === 'checking'}
            onClick={() => {
              setUpdate('checking')
              void checkForUpdate().then(setUpdate)
            }}
          >
            {update === 'checking' ? 'Checking…' : 'Check for update'}
          </button>
        </div>
        {update === 'found' && <p className="muted">New version found. Tap Reload at the top when it appears.</p>}
        {update === 'none' && <p className="muted">You’re on the latest.</p>}
        {update === 'unsupported' && <p className="muted">Updates arrive when you reopen the installed app.</p>}
      </div>

      <InstallBanner />

      {pending && (
        <ConfirmSheet
          eyebrow="Import"
          title="Replace everything on this phone?"
          confirmLabel="Replace my data"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            applyImport(pending.state)
            setImportDone(`Imported ${pending.fileName}. Your old data is in the safety copy.`)
            setPending(null)
          }}
        >
          <ul className="plain import-summary">
            <li>
              <strong>{pending.summary.sessions}</strong>
              <span>
                sessions
                {pending.summary.firstDate ? ` · ${pending.summary.firstDate} to ${pending.summary.lastDate}` : ''}
              </span>
            </li>
            <li>
              <strong>{pending.summary.weighIns}</strong>
              <span>weigh-ins</span>
            </li>
            <li>
              <strong>{pending.summary.foods}</strong>
              <span>food entries</span>
            </li>
          </ul>
          <p className="muted">
            {pending.summary.exportedAt ? `Exported ${stamp(pending.summary.exportedAt)}. ` : ''}
            What’s here now is saved to the safety copy first, so you can undo this.
          </p>
        </ConfirmSheet>
      )}

      {confirmRestore && (
        <ConfirmSheet
          eyebrow="Restore"
          title="Go back to the safety copy?"
          confirmLabel="Restore"
          onCancel={() => setConfirmRestore(false)}
          onConfirm={() => {
            const ok = restoreSnapshot()
            setConfirmRestore(false)
            setImportDone(ok ? 'Restored. Tap Restore again to undo.' : 'The safety copy couldn’t be read.')
          }}
        >
          <p className="muted">
            Your data goes back to {snapshotAt ? stamp(snapshotAt) : 'the copy'}. What’s here now becomes the new safety
            copy.
          </p>
        </ConfirmSheet>
      )}
    </section>
  )
}
