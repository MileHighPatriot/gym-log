import type { DietGoals, FoodEntry, FoodItem, Meal } from '../types.ts'

export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

/** Default meal bucket from the clock. */
export function mealForHour(hour: number): Meal {
  if (hour < 10) return 'breakfast'
  if (hour < 14) return 'lunch'
  if (hour < 20) return 'dinner'
  return 'snack'
}

export function groupByMeal(entries: FoodEntry[]): Record<Meal, FoodEntry[]> {
  const out: Record<Meal, FoodEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
  for (const row of entries) out[row.meal ?? 'snack'].push(row)
  return out
}

export type RecentFood = Pick<FoodItem, 'name' | 'grams' | 'kcal' | 'protein'> & { count: number }

/** Distinct foods you have logged, per single serving, most recent first. */
export function recentFoods(entries: FoodEntry[], limit = 8): RecentFood[] {
  const seen = new Map<string, RecentFood>()
  for (const row of [...entries].reverse()) {
    const key = row.name.trim().toLowerCase()
    if (!key) continue
    const servings = row.servings > 0 ? row.servings : 1
    const cur = seen.get(key)
    if (cur) {
      cur.count += 1
      continue
    }
    seen.set(key, {
      name: row.name,
      grams: Math.round(row.grams / servings),
      kcal: Math.round(row.kcal / servings),
      protein: Math.round((row.protein / servings) * 10) / 10,
      count: 1,
    })
  }
  return [...seen.values()].slice(0, limit)
}

/** Copies of `from`-day entries stamped for `to`. Ids are fresh. */
export function repeatDay(entries: FoodEntry[], from: string, to: string): FoodEntry[] {
  return entries
    .filter((row) => row.date === from)
    .map((row, i) => ({ ...row, id: `${to}-repeat-${Date.now()}-${i}`, date: to, source: 'repeat' as const }))
}

export function suggestedProtein(lbs: number): number {
  return Math.round(lbs * 0.8)
}

export function kcalHint(lbs: number): string {
  return `${Math.round(lbs * 12)}–${Math.round(lbs * 15)}`
}

export function totalsForDate(entries: FoodEntry[], date: string): { kcal: number; protein: number } {
  return entries
    .filter((row) => row.date === date)
    .reduce(
      (sum, row) => ({ kcal: sum.kcal + row.kcal, protein: sum.protein + row.protein }),
      { kcal: 0, protein: 0 },
    )
}

export function remaining(goals: DietGoals, totals: { kcal: number; protein: number }) {
  return {
    kcal: Math.max(0, Math.round(goals.kcal - totals.kcal)),
    protein: Math.max(0, Math.round((goals.protein - totals.protein) * 10) / 10),
  }
}

export function roundServings(n: number): number {
  return Math.round(n * 4) / 4
}

export function suggestedPortion(food: FoodItem, remainingKcal: number): { servings: number; grams: number } {
  if (food.kcal <= 0) return { servings: 1, grams: food.grams }
  if (remainingKcal <= 0) return { servings: 1, grams: food.grams }
  const raw = remainingKcal / food.kcal
  const servings = Math.min(4, Math.max(0.25, roundServings(raw)))
  return { servings, grams: Math.round(food.grams * servings) }
}

export function entryFromFood(
  food: Pick<FoodItem, 'name' | 'grams' | 'kcal' | 'protein'>,
  servings: number,
  extras: Pick<FoodEntry, 'date' | 'source'> & { id?: string },
): FoodEntry {
  const safe = servings > 0 ? servings : 1
  return {
    id: extras.id ?? `${extras.date}-${Date.now()}`,
    date: extras.date,
    name: food.name,
    servings: safe,
    grams: Math.round(food.grams * safe),
    kcal: Math.round(food.kcal * safe),
    protein: Math.round(food.protein * safe * 10) / 10,
    source: extras.source,
  }
}

export function gramsToOz(grams: number): string {
  const oz = grams / 28.3495
  if (oz < 0.5) return `${grams} g`
  const rounded = Math.round(oz * 2) / 2
  return `${rounded} oz`
}
