import { describe, expect, it } from 'vitest'
import { groupByMeal, mealForHour, recentFoods, repeatDay } from './diet.ts'
import type { FoodEntry } from '../types.ts'

function row(partial: Partial<FoodEntry> & Pick<FoodEntry, 'name' | 'date'>): FoodEntry {
  return {
    id: `${partial.date}-${partial.name}`,
    servings: 1,
    grams: 100,
    kcal: 200,
    protein: 20,
    source: 'search',
    ...partial,
  }
}

describe('diet extras', () => {
  it('buckets meals by the clock', () => {
    expect(mealForHour(7)).toBe('breakfast')
    expect(mealForHour(12)).toBe('lunch')
    expect(mealForHour(18)).toBe('dinner')
    expect(mealForHour(22)).toBe('snack')
  })

  it('groups entries by meal with snack as the default', () => {
    const grouped = groupByMeal([
      row({ name: 'Eggs', date: '2026-09-20', meal: 'breakfast' }),
      row({ name: 'Bar', date: '2026-09-20' }),
    ])
    expect(grouped.breakfast).toHaveLength(1)
    expect(grouped.snack).toHaveLength(1)
  })

  it('lists recent foods per serving, most recent first, deduped', () => {
    const recent = recentFoods([
      row({ name: 'Rice', date: '2026-09-18', servings: 2, kcal: 400, protein: 8, grams: 300 }),
      row({ name: 'Eggs', date: '2026-09-19' }),
      row({ name: 'Rice', date: '2026-09-20', servings: 1, kcal: 200, protein: 4, grams: 150 }),
    ])
    expect(recent.map((r) => r.name)).toEqual(['Rice', 'Eggs'])
    expect(recent[0]).toMatchObject({ kcal: 200, protein: 4, grams: 150, count: 2 })
  })

  it('repeats a day with fresh ids and the repeat source', () => {
    const copies = repeatDay(
      [row({ name: 'Eggs', date: '2026-09-19', meal: 'breakfast' }), row({ name: 'Old', date: '2026-09-18' })],
      '2026-09-19',
      '2026-09-20',
    )
    expect(copies).toHaveLength(1)
    expect(copies[0]).toMatchObject({ name: 'Eggs', date: '2026-09-20', meal: 'breakfast', source: 'repeat' })
    expect(copies[0].id).not.toBe('2026-09-19-Eggs')
  })
})
