import { describe, expect, it } from 'vitest'
import { DAYS, SCHEDULE, slotForWeekday } from '../data/program.ts'

function liftIds(dayId: string) {
  const day = DAYS.find((d) => d.id === dayId)!
  return day.blocks.filter((b) => b.kind === 'lift').map((b) => b.exerciseId)
}

describe('program seed', () => {
  it('maps the week to mixed PPL days', () => {
    expect(slotForWeekday(0).dayProgramId).toBeNull()
    expect(slotForWeekday(1).dayProgramId).toBe('push-a')
    expect(slotForWeekday(2).dayProgramId).toBe('pull-a')
    expect(slotForWeekday(3).dayProgramId).toBe('legs-squat')
    expect(slotForWeekday(4).dayProgramId).toBe('push-b')
    expect(slotForWeekday(5).dayProgramId).toBe('pull-b')
    expect(slotForWeekday(6).dayProgramId).toBe('legs-deadlift')
  })

  it('does not repeat the same lift list on the two push or two pull days', () => {
    expect(liftIds('push-a')).not.toEqual(liftIds('push-b'))
    expect(liftIds('pull-a')).not.toEqual(liftIds('pull-b'))
    expect(liftIds('legs-squat')).not.toEqual(liftIds('legs-deadlift'))
    const pushOverlap = liftIds('push-a').filter((id) => liftIds('push-b').includes(id))
    const pullOverlap = liftIds('pull-a').filter((id) => liftIds('pull-b').includes(id))
    expect(pushOverlap).toEqual([])
    expect(pullOverlap).toEqual([])
  })

  it('keeps one row per pull day', () => {
    for (const id of ['pull-a', 'pull-b']) {
      const rows = liftIds(id).filter((ex) => /row/.test(ex))
      expect(rows).toHaveLength(1)
    }
  })

  it('keeps Friday and Saturday KidCare notes', () => {
    expect(slotForWeekday(5).notes).toMatch(/KidCare/)
    expect(slotForWeekday(6).window).toMatch(/done by 10:00/)
  })

  it('has rest times from the written week', () => {
    const push = DAYS.find((d) => d.id === 'push-a')!
    const bench = push.blocks.find((b) => b.kind === 'lift' && b.exerciseId === 'bench-press')
    const tri = push.blocks.find((b) => b.kind === 'lift' && b.exerciseId === 'tricep-pushdown')
    expect(bench).toMatchObject({ restSec: 90, sets: 3, repMin: 8, repMax: 10 })
    expect(tri).toMatchObject({ restSec: 60 })
    const squatDay = DAYS.find((d) => d.id === 'legs-squat')!
    const squat = squatDay.blocks.find((b) => b.kind === 'lift' && b.exerciseId === 'squat')
    expect(squat).toMatchObject({ restSec: 120, sets: 4 })
  })

  it('covers every weekday', () => {
    expect(SCHEDULE.map((s) => s.weekday).sort()).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})
