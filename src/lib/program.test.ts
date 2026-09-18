import { describe, expect, it } from 'vitest'
import { DAYS, SCHEDULE, slotForWeekday } from '../data/program.ts'

describe('program seed', () => {
  it('maps the week to the right days', () => {
    expect(slotForWeekday(0).dayProgramId).toBeNull()
    expect(slotForWeekday(1).dayProgramId).toBe('push')
    expect(slotForWeekday(2).dayProgramId).toBe('pull')
    expect(slotForWeekday(3).dayProgramId).toBe('legs-squat')
    expect(slotForWeekday(4).dayProgramId).toBe('push')
    expect(slotForWeekday(5).dayProgramId).toBe('pull')
    expect(slotForWeekday(6).dayProgramId).toBe('legs-deadlift')
  })

  it('keeps Friday and Saturday KidCare notes', () => {
    expect(slotForWeekday(5).notes).toMatch(/KidCare/)
    expect(slotForWeekday(6).window).toMatch(/done by 10:00/)
  })

  it('has rest times from the written week', () => {
    const push = DAYS.find((d) => d.id === 'push')!
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
