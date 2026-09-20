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
    subtitle: 'Machines + cable',
    blocks: [
      walkIn('pa'),
      {
        id: 'pa-bench',
        kind: 'lift',
        exerciseId: 'plate-chest-press',
        sets: 3,
        repMin: 8,
        repMax: 10,
        restSec: 90,
        notes: 'Plate-loaded chest press. Seated chest press if this one is taken. No barbell.',
      },
      {
        id: 'pa-incline',
        kind: 'lift',
        exerciseId: 'incline-machine',
        sets: 3,
        repMin: 10,
        repMax: 10,
        restSec: 75,
        notes: 'Incline machine today. Plate-loaded incline is Thursday.',
      },
      {
        id: 'pa-shoulder',
        kind: 'lift',
        exerciseId: 'shoulder-press-machine',
        sets: 3,
        repMin: 8,
        repMax: 12,
        restSec: 75,
        notes: 'In front of the face. Never behind the neck. No barbell, no Smith.',
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
        notes: 'Seated chest press. Plate-loaded chest press was Monday.',
      },
      {
        id: 'pb-incline',
        kind: 'lift',
        exerciseId: 'plate-incline-press',
        sets: 3,
        repMin: 10,
        repMax: 10,
        restSec: 75,
        notes: 'Plate-loaded incline today. Machine incline was Monday. No barbell.',
      },
      {
        id: 'pb-shoulder',
        kind: 'lift',
        exerciseId: 'plate-shoulder-press',
        sets: 3,
        repMin: 8,
        repMax: 12,
        restSec: 75,
        notes: 'Plate-loaded shoulder press. Selectorized machine if taken. Not behind the neck.',
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
        exerciseId: 'preacher-curl',
        sets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 60,
        notes: 'Preacher machine. Curl machine is a swap, not a second curl. No EZ-bar.',
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
        notes: 'Curl machine today. Preacher was Tuesday. No EZ-bar.',
      },
      walkOut('lb'),
    ],
  },
  {
    id: 'legs-squat',
    title: 'Legs',
    subtitle: 'Belt squat · hinge · press',
    blocks: [
      walkIn('ls'),
      {
        id: 'ls-squat',
        kind: 'lift',
        exerciseId: 'belt-squat',
        sets: 4,
        repMin: 6,
        repMax: 8,
        restSec: 120,
        notes: 'Belt squat machine. If it is not there, extra leg-press sets. No barbell, no Smith.',
      },
      {
        id: 'ls-dl',
        kind: 'lift',
        exerciseId: 'hip-thrust',
        sets: 3,
        repMin: 8,
        repMax: 10,
        restSec: 90,
        loadNote: 'Lighter than Saturday.',
        notes: 'Hip-thrust machine is your hinge. No barbell deadlift.',
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
    subtitle: 'Belt squat · hinge · press',
    blocks: [
      walkIn('ld'),
      {
        id: 'ld-dl',
        kind: 'lift',
        exerciseId: 'hip-thrust',
        sets: 4,
        repMin: 8,
        repMax: 12,
        restSec: 120,
        notes: 'Hip-thrust machine is your hinge. No barbell deadlift. This is the heavy hinge day.',
      },
      {
        id: 'ld-squat',
        kind: 'lift',
        exerciseId: 'belt-squat',
        sets: 3,
        repMin: 6,
        repMax: 6,
        restSec: 90,
        loadNote: 'Lighter than Wednesday’s belt squat.',
        notes: 'Belt squat again. Extra leg press if the machine is gone. No barbell, no Smith.',
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
        exerciseId: 'hip-abduction',
        sets: 3,
        repMin: 12,
        repMax: 15,
        restSec: 45,
        notes: 'Hip abduction. Hamstring curl was Wednesday.',
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

export type DayKind = 'push' | 'pull' | 'legs' | 'rest'

export function dayKindFromId(id?: string | null): DayKind {
  if (!id) return 'rest'
  if (id.startsWith('push')) return 'push'
  if (id.startsWith('pull')) return 'pull'
  if (id.startsWith('legs')) return 'legs'
  return 'rest'
}

export function dayKind(day?: DayProgram | null): DayKind {
  return dayKindFromId(day?.id)
}

export function programLabel(day?: DayProgram | null, fallback = 'Session'): string {
  if (!day) return fallback
  return day.subtitle ? `${day.title} · ${day.subtitle}` : day.title
}

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
