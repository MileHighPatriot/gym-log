import { describe, expect, it } from 'vitest'
import { DAYS } from '../data/program.ts'
import { lastByExercise, sessionProgress, startSession, swapLift } from './session.ts'
import type { SessionLog } from '../types.ts'

describe('session', () => {
  it('clones a push day with last weights prefilled', () => {
    const push = DAYS.find((d) => d.id === 'push-a')!
    const session = startSession({
      day: push,
      date: '2026-09-21',
      weekday: 1,
      lastByExercise: { 'bench-press': { weight: 135, reps: 8 } },
    })
    expect(session.dayProgramId).toBe('push-a')
    expect(session.blocks[0]).toMatchObject({ kind: 'walk', durationSec: 300, done: false })
    const bench = session.blocks.find((b) => b.kind === 'lift' && b.exerciseId === 'bench-press')
    expect(bench?.kind).toBe('lift')
    if (bench?.kind !== 'lift') throw new Error('expected lift')
    expect(bench.logged).toHaveLength(4)
    expect(bench.logged[0]).toEqual({ weight: 140, reps: 6, done: false })
    expect(session.blocks.at(-1)).toMatchObject({ kind: 'walk', durationSec: 900 })
  })

  it('deloads: −10% seed, one fewer set, no progression', () => {
    const push = DAYS.find((d) => d.id === 'push-a')!
    const session = startSession({
      day: push,
      date: '2026-09-21',
      weekday: 1,
      lastByExercise: { 'bench-press': { weight: 185, reps: 10 } },
      lastSetsByExercise: { 'bench-press': [{ weight: 185, reps: 10, done: true }] },
      deload: true,
      programVersion: 3,
    })
    const bench = session.blocks.find((b) => b.kind === 'lift' && b.exerciseId === 'bench-press')
    if (bench?.kind !== 'lift') throw new Error('expected lift')
    expect(bench.logged).toHaveLength(3)
    expect(bench.logged[0]).toEqual({ weight: 165, reps: 6, done: false })
    expect(session.deload).toBe(true)
    expect(session.programVersion).toBe(3)
  })

  it('inserts pinned extras before the cooldown walk', () => {
    const push = DAYS.find((d) => d.id === 'push-a')!
    const session = startSession({
      day: push,
      date: '2026-09-21',
      weekday: 1,
      lastByExercise: {},
      extraBlocks: [
        {
          id: 'extra-face',
          kind: 'lift',
          exerciseId: 'face-pull',
          sets: 3,
          repMin: 12,
          repMax: 15,
          restSec: 45,
        },
      ],
    })
    const ids = session.blocks.map((b) => (b.kind === 'lift' ? b.exerciseId : b.label))
    expect(ids.at(-2)).toBe('face-pull')
    expect(session.blocks.at(-1)?.kind).toBe('walk')
  })

  it('tracks progress, completion, last set, and swaps', () => {
    const push = DAYS.find((d) => d.id === 'push-a')!
    let session = startSession({
      day: push,
      date: '2026-09-21',
      weekday: 1,
      lastByExercise: {},
    })
    expect(sessionProgress(session)).toEqual({ done: 0, total: 4 + 3 + 3 + 3 + 2 })

    session = swapLift(session, 'pa-bench', 'seated-chest-press')
    const bench = session.blocks.find((b) => b.id === 'pa-bench')
    expect(bench).toMatchObject({
      kind: 'lift',
      exerciseId: 'seated-chest-press',
      substituteOf: 'bench-press',
    })

    const finished: SessionLog = {
      ...session,
      endedAt: '2026-09-21T13:00:00.000Z',
      blocks: session.blocks.map((block) => {
        if (block.kind === 'walk') return { ...block, done: true }
        return {
          ...block,
          logged: block.logged.map((set) => ({ ...set, weight: 100, reps: 10, done: true })),
        }
      }),
    }
    const progress = sessionProgress(finished)
    expect(progress.done).toBe(progress.total)
    expect(lastByExercise([finished])['bench-press']).toEqual({ weight: 100, reps: 10 })
  })
})
