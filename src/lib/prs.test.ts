import { describe, expect, it } from 'vitest'
import { historyForExercise, recordsFromLogs, volumeForLog } from './prs.ts'
import type { SessionLog } from '../types.ts'

function log(partial: Partial<SessionLog> & Pick<SessionLog, 'date' | 'blocks'>): SessionLog {
  return {
    id: partial.id ?? partial.date,
    weekday: 1,
    dayProgramId: 'push',
    startedAt: `${partial.date}T12:00:00.000Z`,
    endedAt: `${partial.date}T13:00:00.000Z`,
    ...partial,
  }
}

describe('PRs', () => {
  it('takes the heaviest set that hit the rep minimum', () => {
    const logs = [
      log({
        date: '2026-09-21',
        blocks: [
          {
            id: 'b',
            kind: 'lift',
            exerciseId: 'bench-press',
            sets: 3,
            repMin: 8,
            repMax: 10,
            restSec: 90,
            logged: [
              { weight: 135, reps: 10, done: true },
              { weight: 155, reps: 6, done: true },
              { weight: 145, reps: 8, done: true },
            ],
          },
        ],
      }),
    ]
    expect(recordsFromLogs(logs)).toEqual([
      { exerciseId: 'bench-press', weight: 145, reps: 8, date: '2026-09-21' },
    ])
  })

  it('ignores unfinished sessions and incomplete sets', () => {
    const logs = [
      log({
        date: '2026-09-21',
        endedAt: undefined,
        blocks: [
          {
            id: 'b',
            kind: 'lift',
            exerciseId: 'bench-press',
            sets: 1,
            repMin: 8,
            repMax: 10,
            restSec: 90,
            logged: [{ weight: 225, reps: 8, done: true }],
          },
        ],
      }),
    ]
    expect(recordsFromLogs(logs)).toEqual([])
  })

  it('sums volume and history', () => {
    const session = log({
      date: '2026-09-21',
      blocks: [
        {
          id: 'b',
          kind: 'lift',
          exerciseId: 'bench-press',
          sets: 2,
          repMin: 8,
          repMax: 10,
          restSec: 90,
          logged: [
            { weight: 135, reps: 8, done: true },
            { weight: 135, reps: 8, done: true },
          ],
        },
      ],
    })
    expect(volumeForLog(session)).toBe(2160)
    expect(historyForExercise([session], 'bench-press')[0]).toMatchObject({
      date: '2026-09-21',
      bestWeight: 135,
      volume: 2160,
    })
  })
})
