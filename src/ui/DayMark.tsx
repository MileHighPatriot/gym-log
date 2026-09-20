import type { DayKind } from '../data/program.ts'

export function DayMark({ kind, done = false }: { kind: DayKind; done?: boolean }) {
  if (done) {
    return (
      <span className="day-check" aria-hidden>
        ✓
      </span>
    )
  }
  return <span className={`day-dot kind-${kind}`} aria-hidden />
}
