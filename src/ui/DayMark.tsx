import type { DayKind } from '../data/program.ts'

const STAMP: Record<DayKind, string> = {
  push: 'PUSH',
  pull: 'PULL',
  legs: 'LEGS',
  rest: 'REST',
}

export function DayMark({ kind, done = false }: { kind: DayKind; done?: boolean }) {
  return (
    <span className={`day-stamp kind-${kind}${done ? ' done' : ''}`} aria-hidden>
      {done ? 'X' : STAMP[kind]}
    </span>
  )
}
