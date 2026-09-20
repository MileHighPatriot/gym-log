import type { DayProgram, ScheduleSlot } from '../types.ts'

function walkIn(id: string) {
  return { id: `${id}-walk-in`, kind: 'walk' as const, label: 'Walk', durationSec: 5 * 60 }
}

function walkOut(id: string) {
  return {
    id: `${id}-walk-out`,
    kind: 'walk' as const,
    label: 'Walk',
    durationSec: 15 * 60,
    durationMaxSec: 20 * 60,
  }
}

export const DAYS: DayProgram[] = [
  {
    id: 'push-a',
    title: 'Push',
    subtitle: 'Barbell + machines',
    blocks: [
      walkIn('pa'),
      {
        id: 'pa-bench',
        kind: 'lift',
        exerciseId: 'bench-press',
        sets: 3,
        repMin: 8,
        repMax: 10,
        restSec: 90,
        notes: 'No bounce. Smith or seated press if the bench is taken.',
      },
      {
        id: 'pa-incline',
        kind: 'lift',
        exerciseId: 'incline-machine',
        sets: 3,
        repMin: 10,
        repMax: 10,
        restSec: 75,
        notes: 'Incline machine today. Barbell incline is Thursday.',
      },
      {
        id: 'pa-shoulder',
        kind: 'lift',
        exerciseId: 'shoulder-press-machine',
        sets: 3,
        repMin: 8,
        repMax: 12,
        restSec: 75,
        notes: 'In front of the face. Never behind the neck.',
      },
      {
        id: 'pa-tri',
        kind: 'lift',
        exerciseId: 'tricep-pushdown',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 60,
      },
      walkOut('pa'),
    ],
  },
  {
    id: 'push-b',
    title: 'Push',
    subtitle: 'Press mix',
    blocks: [
      walkIn('pb'),
      {
        id: 'pb-chest',
        kind: 'lift',
        exerciseId: 'seated-chest-press',
        sets: 3,
        repMin: 8,
        repMax: 10,
        restSec: 90,
        notes: 'Seated chest press. Plate-loaded chest press if this one is taken.',
      },
      {
        id: 'pb-incline',
        kind: 'lift',
        exerciseId: 'incline-bench',
        sets: 3,
        repMin: 10,
        repMax: 10,
        restSec: 75,
        notes: 'Incline barbell today. Machine incline was Monday.',
      },
      {
        id: 'pb-shoulder',
        kind: 'lift',
        exerciseId: 'plate-shoulder-press',
        sets: 3,
        repMin: 8,
        repMax: 12,
        restSec: 75,
        notes: 'Plate-loaded shoulder press. Smith if taken. Not behind the neck.',
      },
      {
        id: 'pb-tri',
        kind: 'lift',
        exerciseId: 'overhead-tricep',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 60,
        notes: 'Overhead cable extension. Pushdown was Monday.',
      },
      walkOut('pb'),
    ],
  },
  {
    id: 'pull-a',
    title: 'Pull',
    subtitle: 'Wide pulldown + chest-pad row',
    blocks: [
      walkIn('la'),
      {
        id: 'la-lat',
        kind: 'lift',
        exerciseId: 'lat-pulldown',
        sets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 90,
        notes: 'Wide cable pulldown. Bar to the top of the chest. Not behind the neck.',
      },
      {
        id: 'la-row',
        kind: 'lift',
        exerciseId: 'seated-row',
        sets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 90,
        notes: 'Chest-pad row. One row only — do not also do plate-loaded row tonight.',
      },
      {
        id: 'la-plate',
        kind: 'lift',
        exerciseId: 'plate-pulldown',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 75,
        notes: 'Plate-loaded pulldown. If taken: close-grip cable, not a second row.',
      },
      {
        id: 'la-curl',
        kind: 'lift',
        exerciseId: 'ez-curl',
        sets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 60,
        notes: 'EZ-bar. Preacher is a swap, not a second curl block.',
      },
      walkOut('la'),
    ],
  },
  {
    id: 'pull-b',
    title: 'Pull',
    subtitle: 'Neutral pulldown + plate row',
    blocks: [
      walkIn('lb'),
      {
        id: 'lb-lat',
        kind: 'lift',
        exerciseId: 'neutral-grip-pulldown',
        sets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 90,
        notes: 'Neutral-grip pulldown today. Wide bar was Tuesday.',
      },
      {
        id: 'lb-row',
        kind: 'lift',
        exerciseId: 'plate-row',
        sets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 90,
        notes: 'Plate-loaded row. One row only — chest-pad row was Tuesday.',
      },
      {
        id: 'lb-rev',
        kind: 'lift',
        exerciseId: 'reverse-grip-pulldown',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 75,
        notes: 'Underhand pulldown. If taken: close-grip, not a second row.',
      },
      {
        id: 'lb-curl',
        kind: 'lift',
        exerciseId: 'curl-machine',
        sets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 60,
        notes: 'Curl machine today. EZ-bar was Tuesday.',
      },
      walkOut('lb'),
    ],
  },
  {
    id: 'legs-squat',
    title: 'Legs',
    subtitle: 'Squat · deadlift · press',
    blocks: [
      walkIn('ls'),
      {
        id: 'ls-squat',
        kind: 'lift',
        exerciseId: 'squat',
        sets: 4,
        repMin: 6,
        repMax: 8,
        restSec: 120,
        notes: 'Box squat. Smith if the box/rack is taken. Not a deep free squat.',
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
        notes: 'Bar at mid-shin. Not off the floor.',
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
      walkOut('ls'),
    ],
  },
  {
    id: 'legs-deadlift',
    title: 'Legs',
    subtitle: 'Squat · deadlift · press',
    blocks: [
      walkIn('ld'),
      {
        id: 'ld-dl',
        kind: 'lift',
        exerciseId: 'pin-deadlift',
        sets: 4,
        repMin: 5,
        repMax: 8,
        restSec: 120,
        notes: 'Bar at mid-shin. Not off the floor. This is the heavy hinge day.',
      },
      {
        id: 'ld-squat',
        kind: 'lift',
        exerciseId: 'squat',
        sets: 3,
        repMin: 6,
        repMax: 6,
        restSec: 90,
        loadNote: 'One plate under Wednesday’s box squat.',
        notes: 'Box squat again. Smith if the box/rack is taken. Not a deep free squat.',
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
        id: 'ld-glute',
        kind: 'lift',
        exerciseId: 'hip-thrust',
        sets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 90,
        notes: 'Glute drive. Hamstring curl was Wednesday.',
      },
      {
        id: 'ld-calf',
        kind: 'lift',
        exerciseId: 'seated-calf',
        sets: 3,
        repMin: 12,
        repMax: 12,
        restSec: 45,
        notes: 'Seated calf today. Standing was Wednesday.',
      },
      walkOut('ld'),
    ],
  },
]

export const SCHEDULE: ScheduleSlot[] = [
  { weekday: 0, dayProgramId: null, window: 'Rest day', notes: 'Nothing scheduled. Walk if you want.' },
  { weekday: 1, dayProgramId: 'push-a', window: '6:30–8:00' },
  { weekday: 2, dayProgramId: 'pull-a', window: '6:30–8:00' },
  { weekday: 3, dayProgramId: 'legs-squat', window: '6:30–8:00' },
  { weekday: 4, dayProgramId: 'push-b', window: '6:30–8:00' },
  {
    weekday: 5,
    dayProgramId: 'pull-b',
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

export function overrideMatchesSchedule(days: DayProgram[]): boolean {
  const ids = new Set(days.map((day) => day.id))
  return SCHEDULE.every((slot) => !slot.dayProgramId || ids.has(slot.dayProgramId))
}
