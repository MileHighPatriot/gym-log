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
    why: 'You are on machines now. No barbell bench, no bouncing a bar.',
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
    why: 'No barbells. Use the chest-pad row or one plate-loaded row.',
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
    why: 'Off the card. Use belt squat, hip thrust, or leg press.',
  },
  {
    id: 'deep-free-squat',
    name: 'Deep free barbell squat',
    dayGroup: 'legs',
    why: 'No barbell squat. Belt squat or extra leg press.',
  },
  {
    id: 'floor-deadlift',
    name: 'Deadlift off the floor',
    dayGroup: 'legs',
    why: 'No barbell. Hip-thrust machine is the hinge. Not off the floor.',
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
  {
    id: 'barbell-work',
    name: 'Barbell, EZ-bar, or Smith bar',
    dayGroup: 'other',
    why: 'Machines and cables only. No barbell on any lift.',
  },
]
