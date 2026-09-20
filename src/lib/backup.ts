import { overrideMatchesSchedule } from '../data/program.ts'
import type { AppState, BackupPayload, DietGoals, FoodEntry } from '../types.ts'

export const STORAGE_KEY = 'gym-log-v1'

export const emptyGoals = (): DietGoals => ({ kcal: 0, protein: 0 })

export const emptyState = (): AppState => ({
  programOverride: null,
  logs: [],
  activeSession: null,
  bodyWeight: [],
  dismissedSuggestions: [],
  pinnedSuggestions: [],
  foodEntries: [],
  dietGoals: emptyGoals(),
})

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
