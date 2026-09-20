import { overrideMatchesSchedule } from '../data/program.ts'
import type { AppState, BackupPayload, DietGoals, FoodEntry, Settings } from '../types.ts'

export const STORAGE_KEY = 'gym-log-v1'
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

export function parseBackup(raw: string): AppState {
  const data = JSON.parse(raw) as BackupPayload
  if (!data || data.version !== 1 || !Array.isArray(data.logs)) {
    throw new Error('Not a Gym Log backup')
  }
  const override = data.programOverride ?? null
  return {
    programOverride: override && overrideMatchesSchedule(override) ? override : null,
    logs: data.logs,
    activeSession: data.activeSession ?? null,
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

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    return parseBackup(raw)
  } catch {
    return emptyState()
  }
}

export function saveState(state: AppState) {
  const payload = toBackup(state)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
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
