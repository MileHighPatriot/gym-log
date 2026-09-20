import type { DietGoals, FoodEntry, FoodItem } from '../types.ts'

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
