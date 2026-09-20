import { describe, expect, it } from 'vitest'
import { getExercise } from '../data/exercises.ts'
import { DAYS, SCHEDULE, WALK_DAY, missedDay, nextTrainingDay, scheduledDay, slotForWeekday } from '../data/program.ts'

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

  it('squats every leg day and deadlifts from the floor on Saturday', () => {
    expect(liftIds('legs-squat')[0]).toBe('squat')
    expect(liftIds('legs-squat')).toContain('leg-press')
    expect(liftIds('legs-squat')).not.toContain('deadlift')
    expect(liftIds('legs-deadlift')[0]).toBe('deadlift')
    expect(liftIds('legs-deadlift')).toContain('squat')
    expect(liftIds('legs-deadlift')).toContain('leg-press')
    expect(getExercise('deadlift').equipment).toMatch(/from the floor/i)
    const core = ['squat', 'deadlift', 'hip-thrust', 'leg-press']
    const wedExtra = liftIds('legs-squat').filter((ex) => !core.includes(ex))
    const satExtra = liftIds('legs-deadlift').filter((ex) => !core.includes(ex))
    expect(wedExtra.some((ex) => satExtra.includes(ex))).toBe(false)
  })

  it('opens both push days with a barbell bench', () => {
    expect(liftIds('push-a')[0]).toBe('bench-press')
    expect(liftIds('push-b')[0]).toBe('incline-bench')
    expect(getExercise('bench-press').equipment).toMatch(/barbell/i)
    expect(getExercise('incline-bench').equipment).toMatch(/barbell/i)
  })

  it('uses barbells, machines, and cables — never dumbbells or a Smith bar', () => {
    for (const day of DAYS) {
      for (const block of day.blocks) {
        if (block.kind !== 'lift') continue
        const ex = getExercise(block.exerciseId)
        expect(`${ex.id} ${ex.name} ${ex.equipment} ${block.notes ?? ''}`, ex.id).not.toMatch(/dumbbell|smith|no barbell/i)
      }
    }
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
    expect(bench).toMatchObject({ restSec: 120, sets: 4, repMin: 6, repMax: 8 })
    expect(tri).toMatchObject({ restSec: 60 })
    const squatDay = DAYS.find((d) => d.id === 'legs-squat')!
    const squat = squatDay.blocks.find((b) => b.kind === 'lift' && b.exerciseId === 'squat')
    expect(squat).toMatchObject({ restSec: 150, sets: 4 })
    const dlDay = DAYS.find((d) => d.id === 'legs-deadlift')!
    const dl = dlDay.blocks.find((b) => b.kind === 'lift' && b.exerciseId === 'deadlift')
    expect(dl).toMatchObject({ restSec: 180, sets: 4, repMin: 3, repMax: 5 })
  })

  it('covers every weekday', () => {
    expect(SCHEDULE.map((s) => s.weekday).sort()).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('honors off days and finds the next training day', () => {
    // 2026-09-21 is a Monday
    expect(scheduledDay('2026-09-21', DAYS)?.id).toBe('push-a')
    expect(scheduledDay('2026-09-21', DAYS, [1])).toBeNull()
    expect(nextTrainingDay('2026-09-20', DAYS)?.day.id).toBe('push-a')
    expect(nextTrainingDay('2026-09-20', DAYS, [1])?.day.id).toBe('pull-a')
  })

  it('flags the most recent missed day only once you have trained before', () => {
    // 2026-09-23 is a Wednesday; Monday and Tuesday are scheduled
    expect(missedDay('2026-09-23', DAYS, new Set())).toBeNull()
    expect(missedDay('2026-09-23', DAYS, new Set(['2026-09-14']))?.day.id).toBe('pull-a')
    expect(missedDay('2026-09-23', DAYS, new Set(['2026-09-14', '2026-09-22']))?.day.id).toBe('push-a')
    expect(missedDay('2026-09-23', DAYS, new Set(['2026-09-14', '2026-09-22', '2026-09-21']))).toBeNull()
    expect(missedDay('2026-09-23', DAYS, new Set(['2026-09-14']), [2])?.day.id).toBe('push-a')
  })

  it('ships a walk-only day with no lifts', () => {
    expect(WALK_DAY.blocks.every((b) => b.kind === 'walk')).toBe(true)
    expect(slotForWeekday(5).slots?.length).toBe(2)
  })
})
