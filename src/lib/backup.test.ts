import { describe, expect, it } from 'vitest'
import { backupOverdue, emptyState, parseBackup, toBackup } from './backup.ts'
import { GEMINI_KEY_STORAGE } from './gemini.ts'

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

  it('loads old backups without food fields', () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAt: '2026-09-20T00:00:00.000Z',
      programOverride: null,
      logs: [],
      activeSession: null,
      bodyWeight: [],
      dismissedSuggestions: [],
      pinnedSuggestions: [],
    })
    expect(parseBackup(raw)).toMatchObject({
      foodEntries: [],
      dietGoals: { kcal: 0, protein: 0 },
    })
  })

  it('round-trips food entries and keeps the Gemini key out of backup', () => {
    const state = emptyState()
    state.dietGoals = { kcal: 2200, protein: 170 }
    state.foodEntries = [
      {
        id: '1',
        date: '2026-09-20',
        name: 'Chicken breast, cooked',
        servings: 1,
        grams: 113,
        kcal: 187,
        protein: 35,
        source: 'search',
      },
    ]
    const payload = toBackup(state)
    expect(JSON.stringify(payload)).not.toMatch(/gemini|AIza/i)
    expect(parseBackup(JSON.stringify(payload)).foodEntries).toHaveLength(1)
    expect(GEMINI_KEY_STORAGE).toBe('gym-log-gemini-key')
  })

  it('defaults settings for old backups and round-trips new ones', () => {
    const old = JSON.stringify({ version: 1, exportedAt: '', programOverride: null, logs: [] })
    expect(parseBackup(old).settings).toMatchObject({ onboarded: false, offDays: [], programVersion: 1 })
    const state = emptyState()
    state.settings = { ...state.settings, offDays: [5], deloadWeek: '2026-09-21', goal: 'cut', favoriteFoods: ['Whole egg'] }
    const back = parseBackup(JSON.stringify(toBackup(state)))
    expect(back.settings).toMatchObject({ offDays: [5], deloadWeek: '2026-09-21', goal: 'cut', favoriteFoods: ['Whole egg'] })
  })

  it('knows when a backup is overdue', () => {
    const now = new Date('2026-09-20T12:00:00Z')
    expect(backupOverdue(2, null, now)).toBe(false)
    expect(backupOverdue(3, null, now)).toBe(true)
    expect(backupOverdue(3, '2026-09-10T12:00:00Z', now)).toBe(false)
    expect(backupOverdue(3, '2026-09-01T12:00:00Z', now)).toBe(true)
  })

  it('rejects garbage', () => {
    expect(() => parseBackup('{"hello":1}')).toThrow(/Not a Gym Log backup/)
    expect(() => parseBackup('nope')).toThrow()
  })
})
