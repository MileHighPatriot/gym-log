import type { DayProgram, ScheduleSlot } from '../types.ts'

export const DAYS: DayProgram[] = [
  {
    id: 'push',
    title: 'Push',
    subtitle: 'Chest, shoulders, triceps',
    blocks: [
      { id: 'push-walk-in', kind: 'walk', label: 'Walk', durationSec: 5 * 60 },
      {
        id: 'push-bench',
        kind: 'lift',
        exerciseId: 'bench-press',
        sets: 3,
        repMin: 8,
        repMax: 10,
        restSec: 90,
      },
      {
        id: 'push-incline',
        kind: 'lift',
        exerciseId: 'incline-bench',
        sets: 3,
        repMin: 10,
        repMax: 10,
        restSec: 75,
        notes: 'Incline bench or machine.',
      },
      {
        id: 'push-shoulder',
        kind: 'lift',
        exerciseId: 'shoulder-press-machine',
        sets: 3,
        repMin: 8,
        repMax: 12,
        restSec: 75,
      },
      {
        id: 'push-tri',
        kind: 'lift',
        exerciseId: 'tricep-pushdown',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 60,
      },
      {
        id: 'push-walk-out',
        kind: 'walk',
        label: 'Walk',
        durationSec: 15 * 60,
        durationMaxSec: 20 * 60,
      },
    ],
  },
  {
    id: 'pull',
    title: 'Pull',
    subtitle: 'Back and biceps',
    blocks: [
      { id: 'pull-walk-in', kind: 'walk', label: 'Walk', durationSec: 5 * 60 },
      {
        id: 'pull-lat',
        kind: 'lift',
        exerciseId: 'lat-pulldown',
        sets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 90,
        notes: 'Legs under the pad. Bar to the top of the chest.',
      },
      {
        id: 'pull-row',
        kind: 'lift',
        exerciseId: 'seated-row',
        sets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 90,
        notes: 'Chest-pad or plate-loaded. One only. Pull to the ribs.',
      },
      {
        id: 'pull-plate',
        kind: 'lift',
        exerciseId: 'plate-pulldown',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 75,
        notes:
          'The pulldown you put plates on. Pull handles to the top of the chest. If taken: extra set of cable pulldown, hands closer.',
      },
      {
        id: 'pull-curl',
        kind: 'lift',
        exerciseId: 'ez-curl',
        sets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 60,
        notes: 'EZ-bar or curl machine.',
      },
      {
        id: 'pull-walk-out',
        kind: 'walk',
        label: 'Walk',
        durationSec: 15 * 60,
        durationMaxSec: 20 * 60,
      },
    ],
  },
  {
    id: 'legs-squat',
    title: 'Legs',
    subtitle: 'Squat-heavy',
    blocks: [
      { id: 'ls-walk-in', kind: 'walk', label: 'Walk', durationSec: 5 * 60 },
      {
        id: 'ls-squat',
        kind: 'lift',
        exerciseId: 'squat',
        sets: 4,
        repMin: 6,
        repMax: 8,
        restSec: 120,
      },
      {
        id: 'ls-dl',
        kind: 'lift',
        exerciseId: 'pin-deadlift',
        sets: 3,
        repMin: 5,
        repMax: 6,
        restSec: 90,
        loadNote: 'Lighter than Saturday.',
      },
      {
        id: 'ls-press',
        kind: 'lift',
        exerciseId: 'leg-press',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 90,
      },
      {
        id: 'ls-ham',
        kind: 'lift',
        exerciseId: 'hamstring-curl',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 60,
      },
      {
        id: 'ls-calf',
        kind: 'lift',
        exerciseId: 'calf-machine',
        sets: 3,
        repMin: 12,
        repMax: 12,
        restSec: 45,
      },
      {
        id: 'ls-walk-out',
        kind: 'walk',
        label: 'Walk',
        durationSec: 15 * 60,
        durationMaxSec: 20 * 60,
      },
    ],
  },
  {
    id: 'legs-deadlift',
    title: 'Legs',
    subtitle: 'Deadlift-heavy',
    blocks: [
      { id: 'ld-walk-in', kind: 'walk', label: 'Walk', durationSec: 5 * 60 },
      {
        id: 'ld-dl',
        kind: 'lift',
        exerciseId: 'pin-deadlift',
        sets: 4,
        repMin: 5,
        repMax: 8,
        restSec: 120,
      },
      {
        id: 'ld-squat',
        kind: 'lift',
        exerciseId: 'squat',
        sets: 3,
        repMin: 6,
        repMax: 6,
        restSec: 90,
        loadNote: 'One plate under Wednesday.',
      },
      {
        id: 'ld-press',
        kind: 'lift',
        exerciseId: 'leg-press',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 90,
      },
      {
        id: 'ld-ham',
        kind: 'lift',
        exerciseId: 'hamstring-curl',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 60,
      },
      {
        id: 'ld-calf',
        kind: 'lift',
        exerciseId: 'calf-machine',
        sets: 3,
        repMin: 12,
        repMax: 12,
        restSec: 45,
      },
      {
        id: 'ld-walk-out',
        kind: 'walk',
        label: 'Walk',
        durationSec: 15 * 60,
        durationMaxSec: 20 * 60,
      },
    ],
  },
]

export const SCHEDULE: ScheduleSlot[] = [
  { weekday: 0, dayProgramId: null, window: 'Rest day', notes: 'Nothing scheduled. Walk if you want.' },
  { weekday: 1, dayProgramId: 'push', window: '6:30–8:00' },
  { weekday: 2, dayProgramId: 'pull', window: '6:30–8:00' },
  { weekday: 3, dayProgramId: 'legs-squat', window: '6:30–8:00' },
  { weekday: 4, dayProgramId: 'push', window: '6:30–8:00' },
  {
    weekday: 5,
    dayProgramId: 'pull',
    window: 'KidCare morning or evening',
    notes: 'Morning 8:30–10 if you need KidCare. Evening only with a sitter.',
  },
  {
    weekday: 6,
    dayProgramId: 'legs-deadlift',
    window: 'KidCare 8–12 · done by 10:00',
    notes: 'Done by 10:00.',
  },
]

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function dayById(days: DayProgram[], id: string): DayProgram {
  const found = days.find((day) => day.id === id)
  if (!found) throw new Error(`Unknown day: ${id}`)
  return found
}

export function slotForWeekday(weekday: number): ScheduleSlot {
  const found = SCHEDULE.find((slot) => slot.weekday === weekday)
  if (!found) throw new Error(`Unknown weekday: ${weekday}`)
  return found
}
