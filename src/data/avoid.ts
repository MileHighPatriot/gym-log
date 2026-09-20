import type { AvoidItem } from '../types.ts'

export const AVOID: AvoidItem[] = [
  {
    id: 'dumbbells',
    name: 'Dumbbells',
    dayGroup: 'other',
    why: 'You said no. Every lift is a barbell, a machine, or a cable. If a station is taken, the swap is never a dumbbell.',
  },
  {
    id: 'behind-neck-press',
    name: 'Behind-the-neck press',
    dayGroup: 'push',
    why: 'Hard on the shoulders. Press in front, to ear height, never behind the head.',
  },
  {
    id: 'bounce-bench',
    name: 'Bouncing the bar off the chest',
    dayGroup: 'push',
    why: 'Touch and press. A bounce is a missed rep with extra risk.',
  },
  {
    id: 'shrugs',
    name: 'Shrugs',
    dayGroup: 'pull',
    why: 'You said no. Not on the card, not a swap.',
  },
  {
    id: 'assisted-pullup',
    name: 'Assisted pull-up',
    dayGroup: 'pull',
    why: 'You said no. Pulldowns cover this pattern.',
  },
  {
    id: 'bb-row-floor',
    name: 'Bent-over barbell row from the floor',
    dayGroup: 'pull',
    why: 'The deadlift already loads the lower back on Saturday. Rows are chest-pad or plate-loaded.',
  },
  {
    id: 'unassisted-pullup',
    name: 'Unassisted pull-ups',
    dayGroup: 'pull',
    why: 'Not at this weight. Stay on pulldowns.',
  },
  {
    id: 'two-rows',
    name: 'Two seated rows in one session',
    dayGroup: 'pull',
    why: 'One row only. Chest-pad or plate-loaded or cable — pick one, not two.',
  },
  {
    id: 'walking-lunges',
    name: 'Walking lunges',
    dayGroup: 'legs',
    why: 'Off the card. Squat, deadlift, hip thrust, or leg press.',
  },
  {
    id: 'smith-machine',
    name: 'Smith machine squat or bench',
    dayGroup: 'legs',
    why: 'Fixed path. Use the real bar; belt squat or a machine press is the swap when racks are full.',
  },
  {
    id: 'jumps',
    name: 'Jumps',
    dayGroup: 'legs',
    why: 'No plyos. Walk for cardio.',
  },
  {
    id: 'running',
    name: 'Running',
    dayGroup: 'legs',
    why: 'Warm-up and cooldown are walks, not runs.',
  },
  {
    id: 'stair-mill',
    name: 'Stair mill',
    dayGroup: 'legs',
    why: 'Skip it. Walk on the floor or a treadmill.',
  },
]
