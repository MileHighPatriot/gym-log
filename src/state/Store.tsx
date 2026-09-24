import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DAYS, WALK_DAY } from '../data/program.ts'
import { SUGGESTIONS } from '../data/suggestions.ts'
import {
  loadSnapshot,
  loadState,
  previewBackup,
  saveState,
  snapshotDue,
  toBackup,
  writeSnapshot,
  type BackupPreview,
} from '../lib/backup.ts'
import { addDays, localISODate, mondayOfWeek, weekdayOf } from '../lib/dates.ts'
import { repeatDay } from '../lib/diet.ts'
import { lastByExercise, lastSetsByExercise, startSession as buildSession, swapLift } from '../lib/session.ts'
import { tabFromLocation } from '../lib/hash.ts'
import type {
  AppState,
  DayProgram,
  DietGoals,
  FoodEntry,
  LiftBlock,
  SessionLog,
  Settings,
  Tab,
} from '../types.ts'

type StoreApi = {
  state: AppState
  tab: Tab
  setTab: (tab: Tab) => void
  exerciseId: string | null
  openExercise: (id: string | null) => void
  sessionView: boolean
  reviewSessionId: string | null
  openSession: (id: string | null) => void
  justFinished: SessionLog | null
  dismissFinished: () => void
  openEat: (open: boolean) => void
  logFood: (entry: Omit<FoodEntry, 'id'> & { id?: string }) => void
  removeFood: (id: string) => void
  repeatYesterday: () => number
  toggleFavoriteFood: (name: string) => void
  setDietGoals: (goals: DietGoals) => void
  updateSettings: (patch: Partial<Settings>) => void
  /** True when this week is the deload week. */
  deloadOn: boolean
  setDeload: (on: boolean) => void
  days: DayProgram[]
  today: string
  selectedDate: string
  setSelectedDate: (date: string) => void
  startWorkout: (day: DayProgram, date?: string) => void
  startWalk: () => void
  resumeWorkout: () => void
  leaveWorkout: () => void
  updateActive: (session: SessionLog) => void
  finishWorkout: () => void
  abandonWorkout: () => void
  swapActiveLift: (blockId: string, exerciseId: string) => void
  logBodyWeight: (lbs: number) => void
  removeBodyWeight: (date: string) => void
  dismissSuggestion: (id: string) => void
  pinSuggestion: (id: string, dayProgramId: string) => void
  unpinSuggestion: (id: string) => void
  updateDay: (day: DayProgram) => void
  resetProgram: () => void
  exportBackup: () => string
  /** Reads a backup file without touching your data. */
  previewImport: (raw: string) => BackupPreview
  /** Snapshots the current data, then replaces it. */
  applyImport: (next: AppState) => void
  /** When the last safety snapshot was taken, or null. */
  snapshotAt: string | null
  /** Swaps in the snapshot; the data it replaces becomes the new snapshot, so this can be undone. */
  restoreSnapshot: () => boolean
  /** True when the last save was refused (phone storage full). */
  storageError: boolean
}

const StoreContext = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [tab, setTab] = useState<Tab>(() => tabFromLocation() ?? 'today')
  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const [sessionView, setSessionView] = useState(false)
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null)
  const [justFinished, setJustFinished] = useState<SessionLog | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => localISODate())
  const [storageError, setStorageError] = useState(false)
  const [snapshotAt, setSnapshotAt] = useState<string | null>(() => loadSnapshot()?.at ?? null)
  const snapshotAtRef = useRef(snapshotAt)

  useEffect(() => {
    // First save of the day keeps a copy of what was there before it.
    if (snapshotDue(snapshotAtRef.current, localISODate())) {
      const at = new Date().toISOString()
      if (writeSnapshot(state, localStorage, at)) {
        snapshotAtRef.current = at
        // Mirrors what localStorage now holds; it only changes once a day.
        // oxlint-disable-next-line react/set-state-in-effect
        setSnapshotAt(at)
      }
    }
    setStorageError(!saveState(state))
  }, [state])

  useEffect(() => {
    void navigator.storage?.persist?.().catch(() => false)
  }, [])

  const snapshotNow = (current: AppState) => {
    const at = new Date().toISOString()
    if (writeSnapshot(current, localStorage, at)) {
      snapshotAtRef.current = at
      setSnapshotAt(at)
    }
  }

  const days = useMemo(() => [...(state.programOverride ?? DAYS), WALK_DAY], [state.programOverride])
  const today = localISODate()
  const deloadOn = state.settings.deloadWeek === mondayOfWeek(today)

  const api = useMemo<StoreApi>(() => {
    const extrasFor = (dayId: string): LiftBlock[] =>
      state.pinnedSuggestions
        .filter((pin) => pin.dayProgramId === dayId)
        .map((pin) => {
          const suggestion = SUGGESTIONS.find((s) => s.id === pin.suggestionId)
          if (!suggestion) return null
          const block: LiftBlock = {
            id: `pin-${suggestion.id}`,
            kind: 'lift',
            exerciseId: suggestion.exerciseId,
            sets: suggestion.sets,
            repMin: suggestion.repMin,
            repMax: suggestion.repMax,
            restSec: suggestion.restSec,
            notes: 'Pinned from Later.',
          }
          return block
        })
        .filter((block): block is LiftBlock => block != null)

    const begin = (day: DayProgram, date: string) => {
      const session = buildSession({
        day,
        date,
        weekday: weekdayOf(date),
        lastByExercise: lastByExercise(state.logs),
        lastSetsByExercise: lastSetsByExercise(state.logs),
        extraBlocks: day.id === WALK_DAY.id ? [] : extrasFor(day.id),
        deload: deloadOn,
        programVersion: state.settings.programVersion,
      })
      setState((s) => ({ ...s, activeSession: session }))
      setJustFinished(null)
      setReviewSessionId(null)
      setSessionView(true)
      setTab('today')
    }

    return {
      state,
      tab,
      setTab,
      exerciseId,
      openExercise(id) {
        setExerciseId(id)
        if (id) setTab('exercises')
      },
      sessionView,
      reviewSessionId,
      openSession(id) {
        setReviewSessionId(id)
      },
      justFinished,
      dismissFinished() {
        setJustFinished(null)
      },
      openEat(open) {
        setTab(open ? 'eat' : 'today')
      },
      logFood(entry) {
        const next: FoodEntry = { ...entry, id: entry.id ?? `${entry.date}-${Date.now()}` }
        setState((s) => ({ ...s, foodEntries: [...s.foodEntries, next] }))
      },
      removeFood(id) {
        setState((s) => ({ ...s, foodEntries: s.foodEntries.filter((row) => row.id !== id) }))
      },
      repeatYesterday() {
        const copies = repeatDay(state.foodEntries, addDays(today, -1), today)
        if (copies.length) setState((s) => ({ ...s, foodEntries: [...s.foodEntries, ...copies] }))
        return copies.length
      },
      toggleFavoriteFood(name) {
        setState((s) => {
          const has = s.settings.favoriteFoods.includes(name)
          return {
            ...s,
            settings: {
              ...s.settings,
              favoriteFoods: has
                ? s.settings.favoriteFoods.filter((n) => n !== name)
                : [...s.settings.favoriteFoods, name],
            },
          }
        })
      },
      setDietGoals(goals) {
        setState((s) => ({
          ...s,
          dietGoals: { kcal: Math.max(0, Math.round(goals.kcal)), protein: Math.max(0, Math.round(goals.protein)) },
        }))
      },
      updateSettings(patch) {
        setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
      },
      deloadOn,
      setDeload(on) {
        setState((s) => ({
          ...s,
          settings: { ...s.settings, deloadWeek: on ? mondayOfWeek(today) : null },
        }))
      },
      days,
      today,
      selectedDate,
      setSelectedDate,
      startWorkout(day, date = today) {
        begin(day, date)
      },
      startWalk() {
        begin(WALK_DAY, today)
      },
      resumeWorkout() {
        setReviewSessionId(null)
        setSessionView(true)
        setTab('today')
      },
      leaveWorkout() {
        setSessionView(false)
      },
      updateActive(session) {
        setState((s) => ({ ...s, activeSession: session }))
      },
      finishWorkout() {
        const active = state.activeSession
        if (!active) return
        const finished: SessionLog = {
          ...active,
          endedAt: new Date().toISOString(),
        }
        setJustFinished(finished)
        setSessionView(false)
        setState((s) => ({
          ...s,
          activeSession: null,
          logs: [...s.logs.filter((l) => l.id !== finished.id), finished],
        }))
      },
      abandonWorkout() {
        setSessionView(false)
        setState((s) => ({ ...s, activeSession: null }))
      },
      swapActiveLift(blockId, newId) {
        setState((s) => {
          if (!s.activeSession) return s
          return { ...s, activeSession: swapLift(s.activeSession, blockId, newId) }
        })
      },
      logBodyWeight(lbs) {
        const date = localISODate()
        setState((s) => ({
          ...s,
          bodyWeight: [...s.bodyWeight.filter((row) => row.date !== date), { date, lbs }],
        }))
      },
      removeBodyWeight(date) {
        setState((s) => ({ ...s, bodyWeight: s.bodyWeight.filter((row) => row.date !== date) }))
      },
      dismissSuggestion(id) {
        setState((s) => ({
          ...s,
          dismissedSuggestions: [...new Set([...s.dismissedSuggestions, id])],
          pinnedSuggestions: s.pinnedSuggestions.filter((p) => p.suggestionId !== id),
        }))
      },
      pinSuggestion(id, dayProgramId) {
        setState((s) => ({
          ...s,
          pinnedSuggestions: [
            ...s.pinnedSuggestions.filter((p) => p.suggestionId !== id),
            { suggestionId: id, dayProgramId },
          ],
        }))
      },
      unpinSuggestion(id) {
        setState((s) => ({
          ...s,
          pinnedSuggestions: s.pinnedSuggestions.filter((p) => p.suggestionId !== id),
        }))
      },
      updateDay(day) {
        setState((s) => {
          const base = s.programOverride ?? DAYS
          return {
            ...s,
            programOverride: base.map((d) => (d.id === day.id ? day : d)),
            settings: { ...s.settings, programVersion: s.settings.programVersion + 1 },
          }
        })
      },
      resetProgram() {
        setState((s) => ({
          ...s,
          programOverride: null,
          settings: { ...s.settings, programVersion: s.settings.programVersion + 1 },
        }))
      },
      exportBackup() {
        return JSON.stringify(toBackup(state), null, 2)
      },
      previewImport(raw) {
        return previewBackup(raw)
      },
      applyImport(next) {
        snapshotNow(state)
        setSessionView(false)
        setReviewSessionId(null)
        setJustFinished(null)
        setState(next)
      },
      snapshotAt,
      restoreSnapshot() {
        const snap = loadSnapshot()
        if (!snap) return false
        snapshotNow(state)
        setSessionView(false)
        setReviewSessionId(null)
        setJustFinished(null)
        setState(snap.state)
        return true
      },
      storageError,
    }
  }, [
    state,
    tab,
    exerciseId,
    sessionView,
    reviewSessionId,
    justFinished,
    days,
    today,
    selectedDate,
    deloadOn,
    snapshotAt,
    storageError,
  ])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
