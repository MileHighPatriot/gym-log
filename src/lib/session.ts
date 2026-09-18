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
  extraBlocks?: LiftBlock[]
}): SessionLog {
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
    const last = args.lastByExercise[block.exerciseId]
    return {
      id: block.id,
      kind: 'lift',
      exerciseId: block.exerciseId,
      sets: block.sets,
      repMin: block.repMin,
      repMax: block.repMax,
      restSec: block.restSec,
      notes: block.notes,
      loadNote: block.loadNote,
      logged: emptySets(block.sets, last),
    }
  })

  if (args.extraBlocks) {
    const cooldown = blocks.findIndex((b, i) => b.kind === 'walk' && i === blocks.length - 1)
    const extras: LoggedBlock[] = args.extraBlocks.map((block) => {
      const last = args.lastByExercise[block.exerciseId]
      return {
        id: block.id,
        kind: 'lift',
        exerciseId: block.exerciseId,
        sets: block.sets,
        repMin: block.repMin,
        repMax: block.repMax,
        restSec: block.restSec,
        notes: block.notes,
        loadNote: block.loadNote,
        logged: emptySets(block.sets, last),
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

export function lastByExercise(logs: SessionLog[]): Record<string, { weight: number | null; reps: number | null }> {
  const map: Record<string, { weight: number | null; reps: number | null }> = {}
  for (const log of logs) {
    if (!log.endedAt) continue
    for (const block of log.blocks) {
      if (block.kind !== 'lift') continue
      const done = [...block.logged].reverse().find((set) => set.done && set.weight != null)
      if (!done) continue
      map[block.exerciseId] = { weight: done.weight, reps: done.reps }
    }
  }
  return map
}

export function sessionComplete(session: SessionLog): boolean {
  return session.blocks.every((block) => {
    if (block.kind === 'walk') return block.done
    return block.logged.every((set) => set.done)
  })
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
