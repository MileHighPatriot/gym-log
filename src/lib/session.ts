import { deloadLoad, suggestNext } from './coach.ts'
import type { DayProgram, LoggedBlock, LoggedSet, LiftBlock, SessionLog } from '../types.ts'

export function emptySets(count: number, seed?: { weight: number | null; reps: number | null }): LoggedSet[] {
  return Array.from({ length: count }, () => ({
    weight: seed?.weight ?? null,
    reps: seed?.reps ?? null,
    done: false,
  }))
}

export function startSession(args: {
  day: DayProgram
  date: string
  weekday: number
  lastByExercise: Record<string, { weight: number | null; reps: number | null }>
  lastSetsByExercise?: Record<string, LoggedSet[]>
  extraBlocks?: LiftBlock[]
  /** Deload: −10% load, one fewer set, no +5 progression. */
  deload?: boolean
  programVersion?: number
}): SessionLog {
  const seedFor = (block: LiftBlock) => {
    const last = args.lastByExercise[block.exerciseId]
    if (args.deload) {
      return last ? { weight: deloadLoad(last.weight), reps: block.repMin } : last
    }
    const sets = args.lastSetsByExercise?.[block.exerciseId]
    return suggestNext(last, block.repMin, block.repMax, sets) ?? last
  }
  const setCount = (block: LiftBlock) => (args.deload ? Math.max(1, block.sets - 1) : block.sets)
  const blocks: LoggedBlock[] = args.day.blocks.map((block) => {
    if (block.kind === 'walk') {
      return {
        id: block.id,
        kind: 'walk',
        label: block.label,
        durationSec: block.durationSec,
        durationMaxSec: block.durationMaxSec,
        elapsedSec: 0,
        done: false,
      }
    }
    const sets = setCount(block)
    return {
      id: block.id,
      kind: 'lift',
      exerciseId: block.exerciseId,
      sets,
      repMin: block.repMin,
      repMax: block.repMax,
      restSec: block.restSec,
      notes: block.notes,
      loadNote: block.loadNote,
      logged: emptySets(sets, seedFor(block)),
    }
  })

  if (args.extraBlocks) {
    const cooldown = blocks.findIndex((b, i) => b.kind === 'walk' && i === blocks.length - 1)
    const extras: LoggedBlock[] = args.extraBlocks.map((block) => {
      const sets = setCount(block)
      return {
        id: block.id,
        kind: 'lift',
        exerciseId: block.exerciseId,
        sets,
        repMin: block.repMin,
        repMax: block.repMax,
        restSec: block.restSec,
        notes: block.notes,
        loadNote: block.loadNote,
        logged: emptySets(sets, seedFor(block)),
      }
    })
    if (cooldown >= 0) blocks.splice(cooldown, 0, ...extras)
    else blocks.push(...extras)
  }

  return {
    id: `${args.date}-${args.day.id}-${Date.now()}`,
    date: args.date,
    weekday: args.weekday,
    dayProgramId: args.day.id,
    startedAt: new Date().toISOString(),
    blocks,
    programVersion: args.programVersion,
    deload: args.deload || undefined,
  }
}

export function lastSetForExercise(logs: SessionLog[], exerciseId: string): { weight: number | null; reps: number | null } | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i]
    if (!log.endedAt) continue
    for (const block of log.blocks) {
      if (block.kind !== 'lift') continue
      if (block.exerciseId !== exerciseId && block.substituteOf !== exerciseId) continue
      const done = [...block.logged].reverse().find((set) => set.done && set.weight != null)
      if (done) return { weight: done.weight, reps: done.reps }
    }
  }
  return null
}

/** Every done set from the most recent finished session that had this lift. */
export function lastSetsForExercise(logs: SessionLog[], exerciseId: string): LoggedSet[] {
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i]
    if (!log.endedAt) continue
    for (const block of log.blocks) {
      if (block.kind !== 'lift') continue
      if (block.exerciseId !== exerciseId && block.substituteOf !== exerciseId) continue
      const done = block.logged.filter((set) => set.done && set.weight != null)
      if (done.length) return done
    }
  }
  return []
}

export function lastSetsByExercise(logs: SessionLog[]): Record<string, LoggedSet[]> {
  const map: Record<string, LoggedSet[]> = {}
  for (const log of logs) {
    if (!log.endedAt) continue
    for (const block of log.blocks) {
      if (block.kind !== 'lift') continue
      const done = block.logged.filter((set) => set.done && set.weight != null)
      if (!done.length) continue
      map[block.exerciseId] = done
      if (block.substituteOf) map[block.substituteOf] = done
    }
  }
  return map
}

export function lastByExercise(logs: SessionLog[]): Record<string, { weight: number | null; reps: number | null }> {
  const map: Record<string, { weight: number | null; reps: number | null }> = {}
  for (const log of logs) {
    if (!log.endedAt) continue
    for (const block of log.blocks) {
      if (block.kind !== 'lift') continue
      const done = [...block.logged].reverse().find((set) => set.done && set.weight != null)
      if (!done) continue
      const last = { weight: done.weight, reps: done.reps }
      map[block.exerciseId] = last
      if (block.substituteOf) map[block.substituteOf] = last
    }
  }
  return map
}

export function sessionProgress(session: SessionLog): { done: number; total: number } {
  let done = 0
  let total = 0
  for (const block of session.blocks) {
    if (block.kind === 'walk') {
      total += 1
      if (block.done) done += 1
    } else {
      total += block.logged.length
      done += block.logged.filter((set) => set.done).length
    }
  }
  return { done, total }
}

export function swapLift(session: SessionLog, blockId: string, newExerciseId: string): SessionLog {
  return {
    ...session,
    blocks: session.blocks.map((block) => {
      if (block.id !== blockId || block.kind !== 'lift') return block
      return {
        ...block,
        substituteOf: block.substituteOf ?? block.exerciseId,
        exerciseId: newExerciseId,
      }
    }),
  }
}
