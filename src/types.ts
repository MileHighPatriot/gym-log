export type ExerciseKind = 'lift' | 'walk' | 'mobility'
export type ExerciseRole = 'card' | 'swap' | 'later'
export type DayGroup = 'push' | 'pull' | 'legs' | 'other'

export type Exercise = {
  id: string
  name: string
  kind: ExerciseKind
  role: ExerciseRole
  dayGroup: DayGroup
  equipment: string
  muscles: string[]
  cues: string[]
  setupImage: string
  finishImage: string
  video: string
  vasaUrl?: string
  youtubeId?: string
  videoCredit?: string
  substituteIds: string[]
}

export type AvoidItem = {
  id: string
  name: string
  dayGroup: DayGroup
  why: string
}

export type WalkBlock = {
  id: string
  kind: 'walk'
  label: string
  durationSec: number
  durationMaxSec?: number
}

export type LiftBlock = {
  id: string
  kind: 'lift'
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  restSec: number
  notes?: string
  loadNote?: string
}

export type ProgramBlock = WalkBlock | LiftBlock

export type DayProgram = {
  id: string
  title: string
  subtitle: string
  blocks: ProgramBlock[]
}

export type ScheduleSlot = {
  weekday: number
  dayProgramId: string | null
  window: string
  notes?: string
}

export type LoggedSet = {
  weight: number | null
  reps: number | null
  done: boolean
}

export type LoggedBlock =
  | {
      id: string
      kind: 'walk'
      label: string
      durationSec: number
      durationMaxSec?: number
      elapsedSec: number
      done: boolean
    }
  | {
      id: string
      kind: 'lift'
      exerciseId: string
      substituteOf?: string
      sets: number
      repMin: number
      repMax: number
      restSec: number
      notes?: string
      loadNote?: string
      logged: LoggedSet[]
    }

export type SessionLog = {
  id: string
  date: string
  weekday: number
  dayProgramId: string
  startedAt: string
  endedAt?: string
  blocks: LoggedBlock[]
  notes?: string
}

export type BodyWeight = {
  date: string
  lbs: number
}

export type FoodItem = {
  id: string
  name: string
  servingLabel: string
  grams: number
  kcal: number
  protein: number
}

export type FoodSource = 'search' | 'custom' | 'photo'

export type FoodEntry = {
  id: string
  date: string
  name: string
  servings: number
  grams: number
  kcal: number
  protein: number
  source: FoodSource
}

export type DietGoals = {
  kcal: number
  protein: number
}

export type Suggestion = {
  id: string
  title: string
  why: string
  fitsDayProgramId: string
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  restSec: number
}

export type PinnedSuggestion = {
  suggestionId: string
  dayProgramId: string
}

export type BackupPayload = {
  version: 1
  exportedAt: string
  programOverride: DayProgram[] | null
  logs: SessionLog[]
  activeSession: SessionLog | null
  bodyWeight: BodyWeight[]
  dismissedSuggestions: string[]
  pinnedSuggestions: PinnedSuggestion[]
  foodEntries: FoodEntry[]
  dietGoals: DietGoals
}

export type AppState = {
  programOverride: DayProgram[] | null
  logs: SessionLog[]
  activeSession: SessionLog | null
  bodyWeight: BodyWeight[]
  dismissedSuggestions: string[]
  pinnedSuggestions: PinnedSuggestion[]
  foodEntries: FoodEntry[]
  dietGoals: DietGoals
}

export type Tab = 'today' | 'exercises' | 'progress' | 'try' | 'program'
