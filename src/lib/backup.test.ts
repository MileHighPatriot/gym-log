import { describe, expect, it } from 'vitest'
import { emptyState, parseBackup, toBackup } from './backup.ts'

describe('backup', () => {
  it('round-trips state', () => {
    const state = emptyState()
    state.bodyWeight = [{ date: '2026-09-21', lbs: 198 }]
    state.dismissedSuggestions = ['face-pull']
    const raw = JSON.stringify(toBackup(state))
    expect(parseBackup(raw)).toMatchObject({
      bodyWeight: [{ date: '2026-09-21', lbs: 198 }],
      dismissedSuggestions: ['face-pull'],
      logs: [],
    })
  })

  it('rejects garbage', () => {
    expect(() => parseBackup('{"hello":1}')).toThrow(/Not a Gym Log backup/)
    expect(() => parseBackup('nope')).toThrow()
  })
})
