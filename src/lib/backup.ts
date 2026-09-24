import { overrideMatchesSchedule } from '../data/program.ts'
import { localISODate } from './dates.ts'
import type { AppState, BackupPayload, DietGoals, FoodEntry, SessionLog, Settings } from '../types.ts'

export const STORAGE_KEY = 'gym-log-v1'
/** Yesterday-or-earlier copy of everything, taken once a day and before any import, restore, or delete. */
export const SNAPSHOT_KEY = 'gym-log-v1-snapshot'
/** Saved data we could not read is parked here instead of being overwritten. */
export const BROKEN_PREFIX = 'gym-log-v1-broken-'
/** Kept outside the backup on purpose: it is about the backup. */
export const LAST_EXPORT_KEY = 'gym-log-last-export'

export const emptyGoals = (): DietGoals => ({ kcal: 0, protein: 0 })

export const emptySettings = (): Settings => ({
  onboarded: false,
  offDays: [],
  deloadWeek: null,
  programVersion: 1,
  favoriteFoods: [],
  goal: null,
})

export const emptyState = (): AppState => ({
  programOverride: null,
  logs: [],
  activeSession: null,
  bodyWeight: [],
  dismissedSuggestions: [],
  pinnedSuggestions: [],
  foodEntries: [],
  dietGoals: emptyGoals(),
  settings: emptySettings(),
})

function parseSettings(raw: Partial<Settings> | undefined): Settings {
  const base = emptySettings()
  if (!raw) return base
  return {
    onboarded: Boolean(raw.onboarded),
    offDays: Array.isArray(raw.offDays) ? raw.offDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [],
    deloadWeek: typeof raw.deloadWeek === 'string' ? raw.deloadWeek : null,
    programVersion: Number(raw.programVersion) || 1,
    favoriteFoods: Array.isArray(raw.favoriteFoods) ? raw.favoriteFoods.map(String) : [],
    goal: raw.goal === 'hold' || raw.goal === 'cut' || raw.goal === 'gain' ? raw.goal : null,
  }
}

/** Drops sessions too broken to show (no id, date, or blocks). */
export function sanitizeLogs(logs: unknown): SessionLog[] {
  if (!Array.isArray(logs)) return []
  return logs.filter(isSessionLog)
}

function isSessionLog(row: unknown): row is SessionLog {
  if (!row || typeof row !== 'object') return false
  const log = row as Partial<SessionLog>
  return typeof log.id === 'string' && typeof log.date === 'string' && Array.isArray(log.blocks)
}

/** Brings any older backup shape up to the current one. Throws on files that are not backups. */
export function migrateBackup(data: unknown): BackupPayload {
  if (!data || typeof data !== 'object') throw new Error('Not a Gym Log backup')
  const payload = data as BackupPayload
  if (typeof payload.version === 'number' && payload.version > 1) {
    throw new Error('This backup is from a newer Gym Log. Update the app first.')
  }
  if (payload.version !== 1 || !Array.isArray(payload.logs)) throw new Error('Not a Gym Log backup')
  return payload
}

function stateFromPayload(data: BackupPayload): AppState {
  const override = data.programOverride ?? null
  return {
    programOverride: override && overrideMatchesSchedule(override) ? override : null,
    logs: sanitizeLogs(data.logs),
    activeSession: isSessionLog(data.activeSession) ? data.activeSession : null,
    bodyWeight: Array.isArray(data.bodyWeight) ? data.bodyWeight : [],
    dismissedSuggestions: Array.isArray(data.dismissedSuggestions) ? data.dismissedSuggestions : [],
    pinnedSuggestions: Array.isArray(data.pinnedSuggestions) ? data.pinnedSuggestions : [],
    foodEntries: Array.isArray(data.foodEntries) ? (data.foodEntries as FoodEntry[]) : [],
    dietGoals: {
      kcal: Number(data.dietGoals?.kcal) || 0,
      protein: Number(data.dietGoals?.protein) || 0,
    },
    settings: parseSettings(data.settings),
  }
}

export function parseBackup(raw: string): AppState {
  return stateFromPayload(migrateBackup(JSON.parse(raw)))
}

export function toBackup(state: AppState): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    programOverride: state.programOverride,
    logs: state.logs,
    activeSession: state.activeSession,
    bodyWeight: state.bodyWeight,
    dismissedSuggestions: state.dismissedSuggestions,
    pinnedSuggestions: state.pinnedSuggestions,
    foodEntries: state.foodEntries,
    dietGoals: state.dietGoals,
    settings: state.settings,
  }
}

export type BackupSummary = {
  sessions: number
  firstDate: string | null
  lastDate: string | null
  weighIns: number
  foods: number
  exportedAt: string | null
}

export type BackupPreview = { ok: true; state: AppState; summary: BackupSummary } | { ok: false; error: string }

/** Reads a backup file without applying it, so the user can see what it holds first. */
export function previewBackup(raw: string): BackupPreview {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'That file isn’t valid JSON.' }
  }
  let payload: BackupPayload
  try {
    payload = migrateBackup(data)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Not a Gym Log backup' }
  }
  const state = stateFromPayload(payload)
  const dates = state.logs.filter((l) => l.endedAt).map((l) => l.date).sort()
  return {
    ok: true,
    state,
    summary: {
      sessions: dates.length,
      firstDate: dates[0] ?? null,
      lastDate: dates.at(-1) ?? null,
      weighIns: state.bodyWeight.length,
      foods: state.foodEntries.length,
      exportedAt: typeof payload.exportedAt === 'string' && payload.exportedAt ? payload.exportedAt : null,
    },
  }
}

type KeyStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Unreadable saved data is copied aside before we fall back to empty, so the next save cannot erase it. */
export function loadState(storage: KeyStore = localStorage, now = Date.now()): AppState {
  let raw: string | null = null
  try {
    raw = storage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    return parseBackup(raw)
  } catch {
    if (raw) {
      try {
        storage.setItem(`${BROKEN_PREFIX}${now}`, raw)
      } catch {
        /* nowhere left to put it */
      }
    }
    return emptyState()
  }
}

/** False when the phone refused the write (storage full or blocked). */
export function saveState(state: AppState, storage: KeyStore = localStorage): boolean {
  const raw = JSON.stringify(toBackup(state))
  try {
    storage.setItem(STORAGE_KEY, raw)
    return true
  } catch {
    // The snapshot is the only thing we can give up to make room.
    try {
      storage.removeItem(SNAPSHOT_KEY)
      storage.setItem(STORAGE_KEY, raw)
      return true
    } catch {
      return false
    }
  }
}

export type Snapshot = { at: string; state: AppState }

export function loadSnapshot(storage: KeyStore = localStorage): Snapshot | null {
  try {
    const raw = storage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { at?: string; payload?: unknown }
    if (typeof data.at !== 'string') return null
    return { at: data.at, state: stateFromPayload(migrateBackup(data.payload)) }
  } catch {
    return null
  }
}

export function writeSnapshot(state: AppState, storage: KeyStore = localStorage, at = new Date().toISOString()): boolean {
  try {
    storage.setItem(SNAPSHOT_KEY, JSON.stringify({ at, payload: toBackup(state) }))
    return true
  } catch {
    return false
  }
}

/** One automatic snapshot per calendar day. */
export function snapshotDue(snapshotAt: string | null, today: string): boolean {
  if (!snapshotAt) return true
  return localISODate(new Date(snapshotAt)) !== today
}

export function loadLastExport(): string | null {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY)
  } catch {
    return null
  }
}

export function markExported(when = new Date().toISOString()) {
  try {
    localStorage.setItem(LAST_EXPORT_KEY, when)
  } catch {
    /* private mode */
  }
}

/** True when there is enough data to lose and no export in the last 14 days. */
export function backupOverdue(logCount: number, lastExport: string | null, now = new Date()): boolean {
  if (logCount < 3) return false
  if (!lastExport) return true
  const ms = now.getTime() - new Date(lastExport).getTime()
  return ms > 14 * 24 * 60 * 60 * 1000
}
