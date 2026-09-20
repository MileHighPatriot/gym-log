import { describe, expect, it } from 'vitest'
import { AVOID } from './avoid.ts'
import { EXERCISES } from './exercises.ts'
import { SUGGESTIONS } from './suggestions.ts'

describe('exercise library', () => {
  it('has unique ids and names', () => {
    const ids = EXERCISES.map((e) => e.id)
    const names = EXERCISES.map((e) => e.name.toLowerCase())
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
  })

  it('does not log avoid-list movements', () => {
    const banned = [
      'shrug',
      'assisted pull',
      'unassisted',
      'walking lunge',
      'stair',
      'behind-the-neck',
      'off the floor',
    ]
    for (const ex of EXERCISES) {
      const blob = `${ex.id} ${ex.name}`.toLowerCase()
      for (const word of banned) {
        expect(blob).not.toContain(word)
      }
    }
  })

  it('keeps close-grip pulldown as a swap, not a second card lift', () => {
    const lift = EXERCISES.find((e) => e.id === 'close-grip-pulldown')
    expect(lift?.role).toBe('swap')
    expect(EXERCISES.filter((e) => e.role === 'card' && e.dayGroup === 'pull').map((e) => e.id)).toEqual([
      'lat-pulldown',
      'seated-row',
      'plate-pulldown',
      'curl-machine',
      'preacher-curl',
    ])
  })

  it('has one row on the card and row swaps are not extra card rows', () => {
    const cardRows = EXERCISES.filter((e) => e.role === 'card' && /row/i.test(e.name))
    expect(cardRows.map((e) => e.id)).toEqual(['seated-row'])
  })

  it('wires suggestion ids to real unique lifts', () => {
    const ids = SUGGESTIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of SUGGESTIONS) {
      expect(EXERCISES.some((e) => e.id === s.exerciseId)).toBe(true)
    }
  })

  it('lists avoid items without duplicating the library', () => {
    expect(AVOID.map((a) => a.id).length).toBe(new Set(AVOID.map((a) => a.id)).size)
    for (const item of AVOID) {
      expect(EXERCISES.some((e) => e.id === item.id)).toBe(false)
    }
  })
})
