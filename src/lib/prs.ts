import type { LoggedSet, SessionLog } from '../types.ts'

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

export type SetBeat = { kind: 'pr' | 'last'; text: string }

export function beatForSet(args: {
  next: LoggedSet
  last: { weight: number | null; reps: number | null } | null
  pr: PersonalRecord | null
}): SetBeat | null {
  const { next, last, pr } = args
  if (!next.done || next.weight == null || next.reps == null) return null
  if (pr && (next.weight > pr.weight || (next.weight === pr.weight && next.reps > pr.reps))) {
    return { kind: 'pr', text: `PR · ${next.weight} × ${next.reps}` }
  }
  if (last?.weight != null) {
    if (next.weight > last.weight) {
      return { kind: 'last', text: `+${next.weight - last.weight} lbs vs last` }
    }
    if (last.reps != null && next.weight === last.weight && next.reps > last.reps) {
      return { kind: 'last', text: `+${next.reps - last.reps} reps vs last` }
    }
  }
  return null
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
