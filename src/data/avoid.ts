import type { AvoidItem } from '../types.ts'

export const AVOID: AvoidItem[] = [
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
    why: 'Pause or touch-and-go with control. If it is bouncing, use paused bench from Try next.',
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
    why: 'Skip it. Use the chest-pad row or one plate-loaded row — not a floor row.',
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
    why: 'Off the card. Use box squat, smith squat, or leg press.',
  },
  {
    id: 'deep-free-squat',
    name: 'Deep free barbell squat',
    dayGroup: 'legs',
    why: 'Box squat or smith squat instead. Sit to the box; do not chase depth without it.',
  },
  {
    id: 'floor-deadlift',
    name: 'Deadlift off the floor',
    dayGroup: 'legs',
    why: 'Rack pull / block pull only. Bar starts at mid-shin.',
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
