import { describe, expect, it } from 'vitest'
import { getFood } from '../data/foods.ts'
import { FOODS } from '../data/foods.ts'
import { entryFromFood, remaining, suggestedPortion, suggestedProtein, totalsForDate } from './diet.ts'
import type { FoodEntry } from '../types.ts'

describe('diet math', () => {
  it('has a gym-food catalog', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(80)
    expect(getFood('chicken-breast')?.kcal).toBeGreaterThan(0)
  })

  it('suggests protein from body weight', () => {
    expect(suggestedProtein(200)).toBe(160)
  })

  it('sums a day and remaining budget', () => {
    const entries: FoodEntry[] = [
      {
        id: '1',
        date: '2026-09-20',
        name: 'Chicken',
        servings: 1,
        grams: 113,
        kcal: 187,
        protein: 35,
        source: 'search',
      },
      {
        id: '2',
        date: '2026-09-21',
        name: 'Other day',
        servings: 1,
        grams: 0,
        kcal: 900,
        protein: 10,
        source: 'custom',
      },
    ]
    expect(totalsForDate(entries, '2026-09-20')).toEqual({ kcal: 187, protein: 35 })
    expect(remaining({ kcal: 2000, protein: 160 }, { kcal: 187, protein: 35 })).toEqual({
      kcal: 1813,
      protein: 125,
    })
  })

  it('suggests a leftover portion in quarter servings', () => {
    const chicken = getFood('chicken-breast')!
    const portion = suggestedPortion(chicken, 280)
    expect(portion.servings).toBe(1.5)
    expect(portion.grams).toBe(Math.round(chicken.grams * 1.5))
    expect(suggestedPortion(chicken, 0).servings).toBe(1)
  })

  it('scales a logged entry', () => {
    const chicken = getFood('chicken-breast')!
    const entry = entryFromFood(chicken, 2, { date: '2026-09-20', source: 'search', id: 'x' })
    expect(entry.kcal).toBe(chicken.kcal * 2)
    expect(entry.protein).toBe(chicken.protein * 2)
    expect(entry.source).toBe('search')
  })
})
