import { describe, expect, it } from 'vitest'
import { addDays, formatClock, formatDuration, formatReps, formatRest, mondayOfWeek, monthGrid, shiftMonth, sundayWeekDates, weekDates, weekdayOf } from './dates.ts'

describe('dates', () => {
  it('weekdayOf uses local calendar dates', () => {
    expect(weekdayOf('2026-09-21')).toBe(1)
    expect(weekdayOf('2026-09-27')).toBe(0)
    expect(weekdayOf('2026-09-26')).toBe(6)
  })

  it('mondayOfWeek lands on Monday', () => {
    expect(mondayOfWeek('2026-09-23')).toBe('2026-09-21')
    expect(mondayOfWeek('2026-09-27')).toBe('2026-09-21')
    expect(mondayOfWeek('2026-09-21')).toBe('2026-09-21')
  })

  it('weekDates is Mon–Sun', () => {
    expect(weekDates('2026-09-24')).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ])
  })

  it('sundayWeekDates is Sun–Sat', () => {
    expect(sundayWeekDates('2026-09-23')).toEqual([
      '2026-09-20',
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
    ])
  })

  it('addDays', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
  })

  it('monthGrid starts on Sunday and covers the month', () => {
    const cells = monthGrid('2026-09-18')
    expect(cells).toHaveLength(42)
    expect(cells[0]).toBe('2026-08-30')
    expect(weekdayOf(cells[0])).toBe(0)
    expect(cells).toContain('2026-09-01')
    expect(cells).toContain('2026-09-30')
    expect(shiftMonth('2026-09-18', 1)).toBe('2026-10-18')
    expect(shiftMonth('2026-01-31', 1)).toBe('2026-02-28')
  })

  it('formats rest and clock', () => {
    expect(formatRest(45)).toBe('45s')
    expect(formatRest(90)).toBe('1:30')
    expect(formatRest(120)).toBe('2 min')
    expect(formatClock(75)).toBe('1:15')
    expect(formatReps(8, 10)).toBe('8–10')
    expect(formatReps(12, 12)).toBe('12')
    expect(formatDuration('2026-09-20T07:00:00.000Z', '2026-09-20T07:42:00.000Z')).toBe('42 min')
    expect(formatDuration('2026-09-20T07:00:00.000Z', '2026-09-20T08:15:00.000Z')).toBe('1h 15m')
  })
})
