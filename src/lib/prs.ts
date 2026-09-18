import type { SessionLog } from '../types.ts'

export type PersonalRecord = {
  exerciseId: string
  weight: number
  reps: number
  date: string
}

export function recordsFromLogs(logs: SessionLog[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>()
  for (const log of logs) {
    if (!log.endedAt) continue
    for (const block of log.blocks) {
      if (block.kind !== 'lift') continue
      for (const set of block.logged) {
        if (!set.done || set.weight == null || set.reps == null) continue
        if (set.reps < block.repMin) continue
        const current = best.get(block.exerciseId)
        const better =
          !current ||
          set.weight > current.weight ||
          (set.weight === current.weight && set.reps > current.reps)
        if (better) {
          best.set(block.exerciseId, {
            exerciseId: block.exerciseId,
            weight: set.weight,
            reps: set.reps,
            date: log.date,
          })
        }
      }
    }
  }
  return [...best.values()]
}

export function recordFor(logs: SessionLog[], exerciseId: string): PersonalRecord | null {
  return recordsFromLogs(logs).find((r) => r.exerciseId === exerciseId) ?? null
}

export function volumeForLog(log: SessionLog): number {
  let total = 0
  for (const block of log.blocks) {
    if (block.kind !== 'lift') continue
    for (const set of block.logged) {
      if (!set.done || set.weight == null || set.reps == null) continue
      total += set.weight * set.reps
    }
  }
  return total
}

export function historyForExercise(
  logs: SessionLog[],
  exerciseId: string,
): { date: string; bestWeight: number; bestReps: number; volume: number }[] {
  const rows = []
  for (const log of logs) {
    if (!log.endedAt) continue
    let bestWeight = 0
    let bestReps = 0
    let volume = 0
    let any = false
    for (const block of log.blocks) {
      if (block.kind !== 'lift') continue
      if (block.exerciseId !== exerciseId) continue
      for (const set of block.logged) {
        if (!set.done || set.weight == null || set.reps == null) continue
        any = true
        volume += set.weight * set.reps
        if (set.weight > bestWeight || (set.weight === bestWeight && set.reps > bestReps)) {
          bestWeight = set.weight
          bestReps = set.reps
        }
      }
    }
    if (any) rows.push({ date: log.date, bestWeight, bestReps, volume })
  }
  return rows
}
