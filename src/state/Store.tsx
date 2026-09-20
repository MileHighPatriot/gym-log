import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DAYS } from '../data/program.ts'
import { SUGGESTIONS } from '../data/suggestions.ts'
import { loadState, saveState, parseBackup, toBackup } from '../lib/backup.ts'
import { localISODate, weekdayOf } from '../lib/dates.ts'
import { lastByExercise, startSession as buildSession, swapLift } from '../lib/session.ts'
import { tabFromLocation } from '../lib/hash.ts'
import type { AppState, DayProgram, DietGoals, FoodEntry, LiftBlock, SessionLog, Tab } from '../types.ts'

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
  eatOpen: boolean
  openEat: (open: boolean) => void
  logFood: (entry: Omit<FoodEntry, 'id'> & { id?: string }) => void
  removeFood: (id: string) => void
  setDietGoals: (goals: DietGoals) => void
  days: DayProgram[]
  today: string
  selectedDate: string
  setSelectedDate: (date: string) => void
  startWorkout: (day: DayProgram, date?: string) => void
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
  importBackup: (raw: string) => void
}

const StoreContext = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [tab, setTab] = useState<Tab>(() => tabFromLocation() ?? 'today')
  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const [sessionView, setSessionView] = useState(false)
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null)
  const [justFinished, setJustFinished] = useState<SessionLog | null>(null)
  const [eatOpen, setEatOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => localISODate())

  useEffect(() => {
    saveState(state)
  }, [state])

  const days = state.programOverride ?? DAYS
  const today = localISODate()

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
            notes: 'Pinned from Try next.',
          }
          return block
        })
        .filter((block): block is LiftBlock => block != null)

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
      eatOpen,
      openEat(open) {
        setEatOpen(open)
      },
      logFood(entry) {
        const next: FoodEntry = { ...entry, id: entry.id ?? `${entry.date}-${Date.now()}` }
        setState((s) => ({ ...s, foodEntries: [...s.foodEntries, next] }))
      },
      removeFood(id) {
        setState((s) => ({ ...s, foodEntries: s.foodEntries.filter((row) => row.id !== id) }))
      },
      setDietGoals(goals) {
        setState((s) => ({
          ...s,
          dietGoals: { kcal: Math.max(0, Math.round(goals.kcal)), protein: Math.max(0, Math.round(goals.protein)) },
        }))
      },
      days,
      today,
      selectedDate,
      setSelectedDate,
      startWorkout(day, date = today) {
        const session = buildSession({
          day,
          date,
          weekday: weekdayOf(date),
          lastByExercise: lastByExercise(state.logs),
          extraBlocks: extrasFor(day.id),
        })
        setState((s) => ({ ...s, activeSession: session }))
        setJustFinished(null)
        setReviewSessionId(null)
        setSessionView(true)
        setTab('today')
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
          return { ...s, programOverride: base.map((d) => (d.id === day.id ? day : d)) }
        })
      },
      resetProgram() {
        setState((s) => ({ ...s, programOverride: null }))
      },
      exportBackup() {
        return JSON.stringify(toBackup(state), null, 2)
      },
      importBackup(raw) {
        setState(parseBackup(raw))
      },
    }
  }, [state, tab, exerciseId, sessionView, reviewSessionId, justFinished, eatOpen, days, today, selectedDate])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
