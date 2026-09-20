import { mondayOfWeek, addDays, parseISODate, weekDates } from './dates.ts'
import { recordsFromLogs, volumeForLog } from './prs.ts'
import type { BodyWeight, FoodEntry, LoggedSet, Rpe, SessionLog } from '../types.ts'

export type LastLoad = { weight: number | null; reps: number | null }

export const PLATES = [45, 35, 25, 10, 5, 2.5] as const
export const BAR_LBS = 45

export type LoadType = 'barbell' | 'plate' | null

/** What the weight field means for this piece of equipment. */
export function loadTypeFor(equipment: string): LoadType {
  if (/barbell/i.test(equipment)) return 'barbell'
  if (/plate-loaded/i.test(equipment)) return 'plate'
  return null
}

/** Round to the nearest loadable 5 lbs. */
export function roundLoad(lbs: number): number {
  return Math.max(0, Math.round(lbs / 5) * 5)
}

/** Greedy per-side plate split. `bar` is 45 for a barbell, 0 for a plate-loaded machine. */
export function platesPerSide(total: number, bar = 0): number[] {
  let side = (total - bar) / 2
  const out: number[] = []
  for (const plate of PLATES) {
    while (side >= plate - 1e-9) {
      out.push(plate)
      side -= plate
    }
  }
  return out
}

export function formatPlates(total: number, bar = 0): string {
  if (total <= 0) return ''
  if (bar > 0 && total <= bar) return total === bar ? 'empty bar' : 'under the bar'
  const side = platesPerSide(total, bar)
  if (!side.length) return 'under 5 / side'
  return `${side.join(' + ')} / side`
}

/** Epley estimated one-rep max. */
export function epley(weight: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

/**
 * Warm-up before the first lift: 50% × 5, 75% × 3. On a barbell the empty bar
 * comes first and nothing lighter than the bar is suggested.
 */
export function warmupRamp(target: number | null | undefined, load: LoadType = null): { weight: number; reps: number }[] {
  if (target == null || target < 40) return []
  const ramp = [
    { weight: roundLoad(target * 0.5), reps: 5 },
    { weight: roundLoad(target * 0.75), reps: 3 },
  ]
  if (load !== 'barbell') return ramp
  const bar = { weight: BAR_LBS, reps: 10 }
  const loaded = ramp.filter((w) => w.weight > BAR_LBS)
  return target > BAR_LBS ? [bar, ...loaded] : [bar]
}

export function deloadLoad(weight: number | null): number | null {
  if (weight == null) return null
  return roundLoad(weight * 0.9)
}

export function setNudge(last: LastLoad | null | undefined, repMax: number): 'beat it' | 'match it' | null {
  if (last?.weight == null) return null
  if (last.reps != null && last.reps < repMax) return 'beat it'
  return 'match it'
}

/**
 * Next target. +5 lbs when the last session hit the top of the range on every
 * done set (or on the last set when only one load is known) and none of them
 * was rated hard. Otherwise match last.
 */
export function suggestNext(
  last: LastLoad | null | undefined,
  repMin: number,
  repMax: number,
  lastSets?: { reps: number | null; rpe?: Rpe }[],
): LastLoad | null {
  if (last?.weight == null) return null
  const sets: { reps: number | null; rpe?: Rpe }[] =
    lastSets && lastSets.length > 0 ? lastSets : [{ reps: last.reps }]
  const allTop = sets.every((set) => set.reps != null && set.reps >= repMax)
  const anyHard = sets.some((set) => set.rpe === 'hard')
  if (allTop && !anyHard) return { weight: last.weight + 5, reps: repMin }
  return { weight: last.weight, reps: last.reps ?? repMin }
}

export function sameLoad(a: LastLoad | null | undefined, b: LastLoad | null | undefined): boolean {
  return a?.weight === b?.weight && a?.reps === b?.reps
}

export function formatLoad(load: LastLoad | null | undefined): string {
  if (load?.weight == null) return '—'
  if (load.reps == null) return `${load.weight}`
  return `${load.weight} × ${load.reps}`
}

export function applySame(last: LastLoad | null | undefined): LoggedSet | null {
  if (last?.weight == null) return null
  return { weight: last.weight, reps: last.reps, done: true }
}

export function bumpWeight(set: LoggedSet, delta: number): LoggedSet {
  const base = set.weight ?? 0
  return { ...set, weight: Math.max(0, base + delta) }
}

export function bumpReps(set: LoggedSet, delta: number): LoggedSet {
  const base = set.reps ?? 0
  return { ...set, reps: Math.max(0, base + delta) }
}

export function trainedDates(logs: SessionLog[]): string[] {
  return [...new Set(logs.filter((l) => l.endedAt).map((l) => l.date))].sort()
}

/** Consecutive trained days. Rest days (no log) break the streak. */
export function trainStreak(logs: SessionLog[], today: string): number {
  const days = new Set(trainedDates(logs))
  if (days.size === 0) return 0
  let cursor = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function weekVolume(logs: SessionLog[], around: string): number {
  const week = weekDates(around)
  return logs
    .filter((l) => l.endedAt && week.includes(l.date))
    .reduce((sum, l) => sum + volumeForLog(l), 0)
}

export function weekCompare(logs: SessionLog[], today: string): { thisWeek: number; lastWeek: number; delta: number } {
  const thisWeek = weekVolume(logs, today)
  const lastWeek = weekVolume(logs, addDays(mondayOfWeek(today), -1))
  return { thisWeek, lastWeek, delta: thisWeek - lastWeek }
}

export function bestLiftsThisWeek(
  logs: SessionLog[],
  today: string,
): { exerciseId: string; weight: number; reps: number }[] {
  const week = new Set(weekDates(today))
  const best = new Map<string, { weight: number; reps: number }>()
  for (const log of logs) {
    if (!log.endedAt || !week.has(log.date)) continue
    for (const block of log.blocks) {
      if (block.kind !== 'lift') continue
      for (const set of block.logged) {
        if (!set.done || set.weight == null || set.reps == null) continue
        const cur = best.get(block.exerciseId)
        if (!cur || set.weight > cur.weight || (set.weight === cur.weight && set.reps > cur.reps)) {
          best.set(block.exerciseId, { weight: set.weight, reps: set.reps })
        }
      }
    }
  }
  return [...best.entries()]
    .map(([exerciseId, row]) => ({ exerciseId, ...row }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
}

export function kindVolumeThisWeek(
  logs: SessionLog[],
  today: string,
  kindOf: (dayProgramId: string) => 'push' | 'pull' | 'legs' | 'rest',
): { push: number; pull: number; legs: number } {
  const week = new Set(weekDates(today))
  const out = { push: 0, pull: 0, legs: 0 }
  for (const log of logs) {
    if (!log.endedAt || !week.has(log.date)) continue
    const kind = kindOf(log.dayProgramId)
    if (kind === 'rest') continue
    out[kind] += volumeForLog(log)
  }
  return out
}

export function laterRank(
  fitsKind: 'push' | 'pull' | 'legs' | 'rest',
  todayKind: 'push' | 'pull' | 'legs' | 'rest',
  vol: { push: number; pull: number; legs: number },
): number {
  if (fitsKind !== 'rest' && fitsKind === todayKind) return 0
  const gap = (['push', 'pull', 'legs'] as const)
    .filter((k) => k !== todayKind)
    .sort((a, b) => vol[a] - vol[b] || a.localeCompare(b))[0]
  if (fitsKind === gap) return 1
  return 2
}

export function goalFromWeight(lbs: number, goal: 'hold' | 'cut' | 'gain'): { kcal: number; protein: number } {
  const hold = Math.round(lbs * 14)
  const kcal = goal === 'cut' ? hold - 400 : goal === 'gain' ? hold + 300 : hold
  return { kcal: Math.max(0, kcal), protein: Math.round(lbs * 0.8) }
}

export function sortedWeights(rows: BodyWeight[]): BodyWeight[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date))
}

/** Mean of entries in the 7 days ending at `date` (inclusive). Null when empty. */
export function rollingAverage(rows: BodyWeight[], date: string, days = 7): number | null {
  const start = addDays(date, -(days - 1))
  const inWindow = rows.filter((row) => row.date >= start && row.date <= date)
  if (!inWindow.length) return null
  const mean = inWindow.reduce((sum, row) => sum + row.lbs, 0) / inWindow.length
  return Math.round(mean * 10) / 10
}

/** Least-squares slope in lbs per week over the rows given. Null under 2 points. */
export function weightSlopePerWeek(rows: BodyWeight[]): number | null {
  const sorted = sortedWeights(rows)
  if (sorted.length < 2) return null
  const t0 = parseISODate(sorted[0].date).getTime()
  const xs = sorted.map((row) => (parseISODate(row.date).getTime() - t0) / 86_400_000)
  const ys = sorted.map((row) => row.lbs)
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  if (den === 0) return null
  return Math.round((num / den) * 7 * 100) / 100
}

/**
 * What "hold" really is for you: average logged kcal minus the surplus/deficit
 * implied by the weight trend (500 kcal/day ≈ 1 lb/week). Needs ~3 weeks of
 * both weight and food. Null until then.
 */
export function holdFromData(
  bodyWeight: BodyWeight[],
  food: FoodEntry[],
  today: string,
  windowDays = 21,
): { avgKcal: number; slope: number; hold: number; days: number } | null {
  const start = addDays(today, -(windowDays - 1))
  const weights = sortedWeights(bodyWeight).filter((row) => row.date >= start && row.date <= today)
  if (weights.length < 4) return null
  const span = (parseISODate(weights.at(-1)!.date).getTime() - parseISODate(weights[0].date).getTime()) / 86_400_000
  if (span < 14) return null
  const byDay = new Map<string, number>()
  for (const row of food) {
    if (row.date < start || row.date > today) continue
    byDay.set(row.date, (byDay.get(row.date) ?? 0) + row.kcal)
  }
  const loggedDays = [...byDay.values()].filter((kcal) => kcal > 0)
  if (loggedDays.length < 10) return null
  const avgKcal = Math.round(loggedDays.reduce((a, b) => a + b, 0) / loggedDays.length)
  const slope = weightSlopePerWeek(weights)
  if (slope == null) return null
  const hold = Math.max(0, Math.round((avgKcal - slope * 500) / 10) * 10)
  return { avgKcal, slope, hold, days: loggedDays.length }
}

export type WeekRecap = {
  sessions: number
  volume: number
  prs: number
  streak: number
  weightDelta: number | null
  sentence: string
}

export function weekRecap(logs: SessionLog[], bodyWeight: BodyWeight[], today: string): WeekRecap {
  const week = weekDates(today)
  const weekSet = new Set(week)
  const done = logs.filter((l) => l.endedAt && weekSet.has(l.date))
  const sessions = done.filter((l) => l.blocks.some((b) => b.kind === 'lift')).length
  const volume = done.reduce((sum, l) => sum + volumeForLog(l), 0)
  const prs = recordsFromLogs(logs).filter((r) => weekSet.has(r.date)).length
  const streak = trainStreak(logs, today)
  const thisAvg = rollingAverage(bodyWeight, today)
  const lastAvg = rollingAverage(bodyWeight, addDays(today, -7))
  const weightDelta = thisAvg != null && lastAvg != null ? Math.round((thisAvg - lastAvg) * 10) / 10 : null
  const parts: string[] = []
  parts.push(sessions === 0 ? 'No lifts logged yet this week.' : `${sessions} ${sessions === 1 ? 'session' : 'sessions'}, ${volume.toLocaleString()} lbs moved.`)
  if (prs) parts.push(`${prs} PR${prs === 1 ? '' : 's'}.`)
  if (streak > 1) parts.push(`${streak}-day streak.`)
  if (weightDelta != null && weightDelta !== 0) {
    parts.push(`Weight ${weightDelta > 0 ? 'up' : 'down'} ${Math.abs(weightDelta)} lb on the 7-day average.`)
  }
  return { sessions, volume, prs, streak, weightDelta, sentence: parts.join(' ') }
}

export function elapsedMinutes(startedAt: string, now = Date.now()): number {
  const ms = now - new Date(startedAt).getTime()
  return Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 60000) : 0
}

export function windowNudge(elapsed: number, windowMin: number): string | null {
  const left = windowMin - elapsed
  if (left <= 0) return `${-left} min over your ${windowMin}-min window`
  if (left <= 15) return `${left} min left in your window`
  return null
}
