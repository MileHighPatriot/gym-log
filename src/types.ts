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
  /** Split days: e.g. a.m. walk, p.m. lift. */
  slots?: { label: string; window: string }[]
}

export type Rpe = 'easy' | 'ok' | 'hard'

export type LoggedSet = {
  weight: number | null
  reps: number | null
  done: boolean
  rpe?: Rpe
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
  /** Week-card version this session was built from. */
  programVersion?: number
  deload?: boolean
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

export type FoodSource = 'search' | 'custom' | 'photo' | 'label' | 'repeat'

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type FoodEntry = {
  id: string
  date: string
  name: string
  servings: number
  grams: number
  kcal: number
  protein: number
  source: FoodSource
  meal?: Meal
}

export type Goal = 'hold' | 'cut' | 'gain'

export type Settings = {
  onboarded: boolean
  /** Weekdays (0–6) you never train, even if the card says so. */
  offDays: number[]
  /** Monday ISO of the week that is a deload, or null. */
  deloadWeek: string | null
  /** Bumps every time the Week card is edited. */
  programVersion: number
  favoriteFoods: string[]
  goal: Goal | null
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
  settings?: Settings
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
  settings: Settings
}

export type Tab = 'today' | 'eat' | 'exercises' | 'progress' | 'program'
