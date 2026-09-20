import { describe, expect, it } from 'vitest'
import {
  applySame,
  bestLiftsThisWeek,
  bumpReps,
  bumpWeight,
  deloadLoad,
  elapsedMinutes,
  epley,
  formatLoad,
  formatPlates,
  goalFromWeight,
  holdFromData,
  laterRank,
  loadTypeFor,
  platesPerSide,
  rollingAverage,
  setNudge,
  suggestNext,
  trainStreak,
  warmupRamp,
  weekCompare,
  weekRecap,
  weightSlopePerWeek,
  windowNudge,
} from './coach.ts'
import type { SessionLog } from '../types.ts'

function log(date: string, extras?: Partial<SessionLog>): SessionLog {
  return {
    id: date,
    date,
    weekday: 1,
    dayProgramId: 'push-a',
    startedAt: `${date}T12:00:00.000Z`,
    endedAt: `${date}T13:00:00.000Z`,
    blocks: [
      {
        id: 'b',
        kind: 'lift',
        exerciseId: 'chest-press',
        sets: 1,
        repMin: 8,
        repMax: 10,
        restSec: 90,
        logged: [{ weight: 185, reps: 10, done: true }],
      },
    ],
    ...extras,
  }
}

describe('coach', () => {
  it('nudges beat vs match from last reps', () => {
    expect(setNudge({ weight: 185, reps: 8 }, 10)).toBe('beat it')
    expect(setNudge({ weight: 185, reps: 10 }, 10)).toBe('match it')
    expect(setNudge(null, 10)).toBeNull()
  })

  it('suggests +5 only when every last set hit the top of the range', () => {
    expect(suggestNext({ weight: 185, reps: 10 }, 8, 10)).toEqual({ weight: 190, reps: 8 })
    expect(suggestNext({ weight: 185, reps: 8 }, 8, 10)).toEqual({ weight: 185, reps: 8 })
    expect(suggestNext(null, 8, 10)).toBeNull()
    const allTop = [{ reps: 10 }, { reps: 10 }, { reps: 10 }]
    const oneShort = [{ reps: 10 }, { reps: 9 }, { reps: 10 }]
    expect(suggestNext({ weight: 185, reps: 10 }, 8, 10, allTop)).toEqual({ weight: 190, reps: 8 })
    expect(suggestNext({ weight: 185, reps: 10 }, 8, 10, oneShort)).toEqual({ weight: 185, reps: 10 })
  })

  it('formats load and applies Same', () => {
    expect(formatLoad({ weight: 185, reps: 8 })).toBe('185 × 8')
    expect(applySame({ weight: 185, reps: 8 })).toEqual({ weight: 185, reps: 8, done: true })
    expect(bumpWeight({ weight: 185, reps: 8, done: false }, 5).weight).toBe(190)
    expect(bumpReps({ weight: 185, reps: 8, done: false }, 1).reps).toBe(9)
  })

  it('counts a trained-day streak', () => {
    expect(trainStreak([log('2026-09-18'), log('2026-09-19'), log('2026-09-20')], '2026-09-20')).toBe(3)
    expect(trainStreak([log('2026-09-18'), log('2026-09-20')], '2026-09-20')).toBe(1)
  })

  it('compares this week to last week and picks best lifts', () => {
    const thisWeek = log('2026-09-21')
    const lastWeek = log('2026-09-14', {
      blocks: [
        {
          id: 'b',
          kind: 'lift',
          exerciseId: 'chest-press',
          sets: 1,
          repMin: 8,
          repMax: 10,
          restSec: 90,
          logged: [{ weight: 100, reps: 10, done: true }],
        },
      ],
    })
    const cmp = weekCompare([lastWeek, thisWeek], '2026-09-21')
    expect(cmp.thisWeek).toBe(1850)
    expect(cmp.lastWeek).toBe(1000)
    expect(cmp.delta).toBe(850)
    expect(bestLiftsThisWeek([thisWeek], '2026-09-21')[0]).toMatchObject({
      exerciseId: 'chest-press',
      weight: 185,
    })
  })

  it('sets Hold / Cut / Gain from body weight', () => {
    expect(goalFromWeight(200, 'hold')).toEqual({ kcal: 2800, protein: 160 })
    expect(goalFromWeight(200, 'cut').kcal).toBe(2400)
    expect(goalFromWeight(200, 'gain').kcal).toBe(3100)
  })

  it('holds the weight when any last set was rated hard', () => {
    const allTopButHard = [{ reps: 10 }, { reps: 10, rpe: 'hard' as const }, { reps: 10 }]
    expect(suggestNext({ weight: 185, reps: 10 }, 8, 10, allTopButHard)).toEqual({ weight: 185, reps: 10 })
  })

  it('splits plates per side for a machine and for a 45 lb bar', () => {
    expect(platesPerSide(185)).toEqual([45, 45, 2.5])
    expect(platesPerSide(90)).toEqual([45])
    expect(platesPerSide(70)).toEqual([35])
    expect(formatPlates(185)).toBe('45 + 45 + 2.5 / side')
    expect(formatPlates(0)).toBe('')
    expect(platesPerSide(185, 45)).toEqual([45, 25])
    expect(formatPlates(225, 45)).toBe('45 + 45 / side')
    expect(formatPlates(45, 45)).toBe('empty bar')
    expect(formatPlates(40, 45)).toBe('under the bar')
    expect(loadTypeFor('Barbell + flat bench')).toBe('barbell')
    expect(loadTypeFor('Plate-loaded row')).toBe('plate')
    expect(loadTypeFor('Cable, bar or rope')).toBeNull()
  })

  it('estimates e1RM, warm-up, and deload loads', () => {
    expect(epley(185, 8)).toBe(234)
    expect(epley(200, 1)).toBe(200)
    expect(warmupRamp(185)).toEqual([
      { weight: 95, reps: 5 },
      { weight: 140, reps: 3 },
    ])
    expect(warmupRamp(185, 'barbell')).toEqual([
      { weight: 45, reps: 10 },
      { weight: 95, reps: 5 },
      { weight: 140, reps: 3 },
    ])
    expect(warmupRamp(65, 'barbell')).toEqual([{ weight: 45, reps: 10 }, { weight: 50, reps: 3 }])
    expect(warmupRamp(30)).toEqual([])
    expect(deloadLoad(185)).toBe(165)
    expect(deloadLoad(null)).toBeNull()
  })

  it('rolls body weight and finds the slope', () => {
    const rows = [
      { date: '2026-09-14', lbs: 200 },
      { date: '2026-09-17', lbs: 199 },
      { date: '2026-09-20', lbs: 198 },
    ]
    expect(rollingAverage(rows, '2026-09-20')).toBe(199)
    expect(rollingAverage(rows, '2026-09-21')).toBe(198.5)
    expect(rollingAverage(rows, '2026-09-01')).toBeNull()
    expect(weightSlopePerWeek(rows)).toBeCloseTo(-2.33, 1)
  })

  it('derives a real hold only with three weeks of weight and food', () => {
    const weights = Array.from({ length: 21 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      lbs: 200 + i * 0.05,
    }))
    const food = Array.from({ length: 21 }, (_, i) => ({
      id: String(i),
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      name: 'day',
      servings: 1,
      grams: 0,
      kcal: 2800,
      protein: 150,
      source: 'custom' as const,
    }))
    const out = holdFromData(weights, food, '2026-09-21')
    expect(out).not.toBeNull()
    expect(out!.avgKcal).toBe(2800)
    expect(out!.slope).toBeCloseTo(0.35, 1)
    expect(out!.hold).toBe(2630)
    expect(holdFromData(weights.slice(0, 2), food, '2026-09-21')).toBeNull()
    expect(holdFromData(weights, food.slice(0, 3), '2026-09-21')).toBeNull()
  })

  it('writes a week recap sentence', () => {
    const recap = weekRecap([log('2026-09-21'), log('2026-09-22')], [], '2026-09-22')
    expect(recap.sessions).toBe(2)
    expect(recap.volume).toBe(3700)
    expect(recap.sentence).toMatch(/2 sessions, 3,700 lbs moved\./)
    expect(recap.sentence).toMatch(/2-day streak/)
  })

  it('clocks the session window', () => {
    const start = new Date('2026-09-20T10:00:00Z').toISOString()
    expect(elapsedMinutes(start, new Date('2026-09-20T10:42:00Z').getTime())).toBe(42)
    expect(windowNudge(42, 90)).toBeNull()
    expect(windowNudge(80, 90)).toBe('10 min left in your window')
    expect(windowNudge(95, 90)).toBe('5 min over your 90-min window')
  })

  it('ranks later ideas by today then the week gap', () => {
    expect(laterRank('push', 'push', { push: 0, pull: 100, legs: 50 })).toBe(0)
    expect(laterRank('legs', 'push', { push: 2000, pull: 1000, legs: 0 })).toBe(1)
    expect(laterRank('pull', 'push', { push: 2000, pull: 1000, legs: 0 })).toBe(2)
  })
})
