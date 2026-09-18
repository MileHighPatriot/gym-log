import type { Exercise } from '../types.ts'

const base = import.meta.env.BASE_URL

export const athleteFallback = `${base}exercises/_athlete.jpg`

function media(id: string) {
  return {
    setupImage: `${base}exercises/${id}/setup.jpg`,
    finishImage: `${base}exercises/${id}/finish.jpg`,
    video: `${base}exercises/${id}/how.mp4`,
  }
}

export const EXERCISES: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Bench press',
    kind: 'lift',
    equipment: 'Barbell + flat bench',
    muscles: ['Chest', 'Shoulders', 'Triceps'],
    cues: [
      'Eyes under the bar. Feet planted. Shoulder blades pinched into the bench.',
      'Unrack, lower with control to mid-chest, elbows about 45° from the torso.',
      'Press up without bouncing. Keep wrists stacked over the bar.',
    ],
    substituteIds: [],
    ...media('bench-press'),
  },
  {
    id: 'incline-bench',
    name: 'Incline bench',
    kind: 'lift',
    equipment: 'Barbell or dumbbells, incline bench',
    muscles: ['Upper chest', 'Shoulders', 'Triceps'],
    cues: [
      'Set the bench around 30–45°. Same brace as flat bench.',
      'Lower to the upper chest, not the neck.',
      'Press up and slightly back. Do not shrug the bar into your face.',
    ],
    substituteIds: ['incline-machine'],
    ...media('incline-bench'),
  },
  {
    id: 'incline-machine',
    name: 'Incline press machine',
    kind: 'lift',
    equipment: 'Incline press machine',
    muscles: ['Upper chest', 'Shoulders', 'Triceps'],
    cues: [
      'Seat so the handles hit upper chest at the bottom.',
      'Back flat on the pad. Press without locking out harshly.',
      'Use this when the incline bench is taken.',
    ],
    substituteIds: ['incline-bench'],
    ...media('incline-machine'),
  },
  {
    id: 'shoulder-press-machine',
    name: 'Shoulder press machine',
    kind: 'lift',
    equipment: 'Shoulder press machine',
    muscles: ['Shoulders', 'Triceps'],
    cues: [
      'Seat so handles start around ear / shoulder height.',
      'Press up without shrugging. Keep ribs down.',
      'Lower with control; do not crash the stack.',
    ],
    substituteIds: [],
    ...media('shoulder-press-machine'),
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep pushdown',
    kind: 'lift',
    equipment: 'Cable, bar or rope',
    muscles: ['Triceps'],
    cues: [
      'Elbows pinned to your sides. Stand tall.',
      'Push the handle down until arms are straight, squeeze the triceps.',
      'Let the handle rise only as far as you can without the elbows drifting forward.',
    ],
    substituteIds: [],
    ...media('tricep-pushdown'),
  },
  {
    id: 'lat-pulldown',
    name: 'Lat pulldown (cable)',
    kind: 'lift',
    equipment: 'Cable pulldown, wide bar',
    muscles: ['Lats', 'Upper back', 'Biceps'],
    cues: [
      'Legs under the pad.',
      'Bar to the top of the chest — not behind the neck.',
      'Pull elbows down and in. Pause on the chest, then let the bar rise with control.',
    ],
    substituteIds: ['plate-pulldown'],
    ...media('lat-pulldown'),
  },
  {
    id: 'seated-row',
    name: 'Seated row',
    kind: 'lift',
    equipment: 'Chest-pad or plate-loaded row (one only)',
    muscles: ['Mid-back', 'Lats', 'Biceps'],
    cues: [
      'Chest-pad or plate-loaded. One machine only — do not double up rows.',
      'Pull to the ribs. Shoulders down, chest to the pad if it has one.',
      'Let the arms stretch forward without rounding the lower back.',
    ],
    substituteIds: [],
    ...media('seated-row'),
  },
  {
    id: 'plate-pulldown',
    name: 'Plate-loaded pulldown',
    kind: 'lift',
    equipment: 'Plate-loaded pulldown',
    muscles: ['Lats', 'Upper back', 'Biceps'],
    cues: [
      'The pulldown you put plates on.',
      'Pull handles to the top of the chest.',
      'If it is taken: extra set of cable pulldown, hands closer.',
    ],
    substituteIds: ['close-grip-pulldown'],
    ...media('plate-pulldown'),
  },
  {
    id: 'close-grip-pulldown',
    name: 'Close-grip cable pulldown',
    kind: 'lift',
    equipment: 'Cable pulldown, closer grip',
    muscles: ['Lats', 'Biceps'],
    cues: [
      'Hands closer than the wide bar.',
      'Same rule: pull to the top of the chest, legs under the pad.',
      'Backup when the plate-loaded pulldown is taken.',
    ],
    substituteIds: ['plate-pulldown'],
    ...media('close-grip-pulldown'),
  },
  {
    id: 'ez-curl',
    name: 'EZ-bar curl',
    kind: 'lift',
    equipment: 'EZ-bar',
    muscles: ['Biceps'],
    cues: [
      'Stand tall, elbows by the ribs.',
      'Curl without swinging. Squeeze at the top.',
      'Lower all the way — do not bounce off the thighs.',
    ],
    substituteIds: ['curl-machine'],
    ...media('ez-curl'),
  },
  {
    id: 'curl-machine',
    name: 'Curl machine',
    kind: 'lift',
    equipment: 'Preacher or cable curl machine',
    muscles: ['Biceps'],
    cues: [
      'Upper arms on the pad. No shoulder shrug.',
      'Curl through a full range. Control the negative.',
      'Use when the EZ-bar is a hassle or the machine is free.',
    ],
    substituteIds: ['ez-curl'],
    ...media('curl-machine'),
  },
  {
    id: 'squat',
    name: 'Squat',
    kind: 'lift',
    equipment: 'Barbell + squat rack',
    muscles: ['Quads', 'Glutes', 'Core'],
    cues: [
      'Bar on the upper back, not the neck. Brace the belt line before you unrack.',
      'Sit down and a little back. Knees track over toes. Chest up.',
      'Drive up through mid-foot. Do not bounce out of the hole.',
    ],
    substituteIds: [],
    ...media('squat'),
  },
  {
    id: 'pin-deadlift',
    name: 'Deadlift from pins',
    kind: 'lift',
    equipment: 'Barbell in a rack, pins around mid-shin to knee',
    muscles: ['Back', 'Glutes', 'Hamstrings'],
    cues: [
      'Bar on pins — this is not a floor pull. Set pin height and remember it.',
      'Hinge, grab, lock the back, then push the floor away.',
      'Stand tall. Lower to the pins with control. Wednesday is lighter than Saturday.',
    ],
    substituteIds: [],
    ...media('pin-deadlift'),
  },
  {
    id: 'leg-press',
    name: 'Leg press',
    kind: 'lift',
    equipment: 'Leg press machine',
    muscles: ['Quads', 'Glutes'],
    cues: [
      'Feet mid-platform, about shoulder width.',
      'Lower until thighs are close to the torso without the hips rolling up.',
      'Press through the whole foot. Do not slam the sled into the stops.',
    ],
    substituteIds: [],
    ...media('leg-press'),
  },
  {
    id: 'hamstring-curl',
    name: 'Hamstring curl',
    kind: 'lift',
    equipment: 'Lying or seated hamstring curl',
    muscles: ['Hamstrings'],
    cues: [
      'Hips stay glued to the pad. Do not yank with the lower back.',
      'Curl all the way, squeeze, lower slowly.',
      'If the lying machine is taken, seated curl is fine.',
    ],
    substituteIds: [],
    ...media('hamstring-curl'),
  },
  {
    id: 'calf-machine',
    name: 'Calf machine',
    kind: 'lift',
    equipment: 'Standing or seated calf machine',
    muscles: ['Calves'],
    cues: [
      'Ball of the foot on the step, heel hangs off.',
      'Full stretch at the bottom, full squeeze at the top. Pause both ends.',
      'Do not bounce. Knees soft, not locked.',
    ],
    substituteIds: [],
    ...media('calf-machine'),
  },
  {
    id: 'paused-bench',
    name: 'Paused bench',
    kind: 'lift',
    equipment: 'Barbell + flat bench',
    muscles: ['Chest', 'Shoulders', 'Triceps'],
    cues: [
      'Same setup as bench. Pause the bar on the chest for a full second.',
      'No bounce. Press after the pause.',
      'Use a little less weight than regular bench.',
    ],
    substituteIds: ['bench-press'],
    ...media('paused-bench'),
  },
  {
    id: 'face-pull',
    name: 'Face pull',
    kind: 'lift',
    equipment: 'Cable, rope, set at face height',
    muscles: ['Rear delts', 'Upper back'],
    cues: [
      'Rope to face height. Step back so the stack is live.',
      'Pull to the face, hands outside the ears, elbows high.',
      'Think “rear delts,” not a row. Light enough to feel the squeeze.',
    ],
    substituteIds: [],
    ...media('face-pull'),
  },
  {
    id: 'rdl',
    name: 'Romanian deadlift',
    kind: 'lift',
    equipment: 'Barbell',
    muscles: ['Hamstrings', 'Glutes', 'Back'],
    cues: [
      'Soft knees. Push the hips back, bar close to the legs.',
      'Stop when the hamstrings load — do not round the back to go lower.',
      'Stand by driving the hips forward. Lighter than pin deadlift.',
    ],
    substituteIds: ['hamstring-curl'],
    ...media('rdl'),
  },
  {
    id: 'mobility',
    name: '5-minute mobility',
    kind: 'mobility',
    equipment: 'Floor or a mat',
    muscles: ['Hips', 'Shoulders', 'T-spine'],
    cues: [
      'After the cooldown walk: hips, T-spine, and the shoulder you pressed with.',
      'Slow. Breathing. Nothing that hurts a joint.',
      'Five minutes is enough. This is not another workout.',
    ],
    substituteIds: [],
    ...media('mobility'),
  },
]

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((exercise) => [exercise.id, exercise]),
)

export function getExercise(id: string): Exercise {
  const found = EXERCISE_BY_ID[id]
  if (!found) throw new Error(`Unknown exercise: ${id}`)
  return found
}
