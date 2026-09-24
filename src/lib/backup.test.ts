import { describe, expect, it } from 'vitest'
import {
  BROKEN_PREFIX,
  SNAPSHOT_KEY,
  STORAGE_KEY,
  backupOverdue,
  emptyState,
  loadSnapshot,
  loadState,
  parseBackup,
  previewBackup,
  sanitizeLogs,
  saveState,
  snapshotDue,
  toBackup,
  writeSnapshot,
} from './backup.ts'
import type { AppState } from '../types.ts'

/** In-memory localStorage. `full` makes every write throw like a full phone. */
function fakeStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed))
  const store = {
    full: false,
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (store.full) throw new DOMException('full', 'QuotaExceededError')
      map.set(k, v)
    },
    removeItem: (k: string) => void map.delete(k),
  }
  return store
}

/** Every field set to something non-default, so a field dropped anywhere in the save path shows up. */
function fullState(): AppState {
  return {
    programOverride: null,
    logs: [
      {
        id: 'push-a-2026-09-21',
        date: '2026-09-21',
        weekday: 1,
        dayProgramId: 'push-a',
        startedAt: '2026-09-21T12:00:00.000Z',
        endedAt: '2026-09-21T13:00:00.000Z',
        notes: 'Felt strong',
        programVersion: 3,
        deload: true,
        blocks: [
          { id: 'w', kind: 'walk', label: 'Walk in', durationSec: 300, elapsedSec: 300, done: true },
          {
            id: 'b',
            kind: 'lift',
            exerciseId: 'seated-chest-press',
            substituteOf: 'bench-press',
            sets: 1,
            repMin: 6,
            repMax: 8,
            restSec: 120,
            notes: 'n',
            loadNote: 'l',
            logged: [{ weight: 135, reps: 8, done: true, rpe: 'hard' }],
          },
        ],
      },
    ],
    activeSession: null,
    bodyWeight: [{ date: '2026-09-21', lbs: 198.4 }],
    dismissedSuggestions: ['face-pull'],
    pinnedSuggestions: [{ suggestionId: 'x', dayProgramId: 'push-a' }],
    foodEntries: [
      {
        id: 'f',
        date: '2026-09-21',
        name: 'Egg',
        servings: 2,
        grams: 100,
        kcal: 140,
        protein: 12,
        source: 'photo',
        meal: 'breakfast',
      },
    ],
    dietGoals: { kcal: 2400, protein: 180 },
    settings: {
      onboarded: true,
      offDays: [5],
      deloadWeek: '2026-09-21',
      programVersion: 4,
      favoriteFoods: ['Egg'],
      goal: 'cut',
    },
  }
}
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

  it('round-trips every field of a full state unchanged', () => {
    const state = fullState()
    expect(parseBackup(JSON.stringify(toBackup(state)))).toEqual(state)
  })

  it('drops sessions too broken to show', () => {
    const good = fullState().logs[0]
    expect(sanitizeLogs([good, null, { id: 'x' }, { id: 'y', date: '2026-01-01' }, 'junk'])).toEqual([good])
    expect(sanitizeLogs('nope')).toEqual([])
  })

  it('previews a backup without applying it', () => {
    const result = previewBackup(JSON.stringify(toBackup(fullState())))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.summary).toMatchObject({
      sessions: 1,
      firstDate: '2026-09-21',
      lastDate: '2026-09-21',
      weighIns: 1,
      foods: 1,
    })
    expect(result.summary.exportedAt).toMatch(/^20/)
  })

  it('explains why a file can’t be imported', () => {
    expect(previewBackup('not json')).toEqual({ ok: false, error: 'That file isn’t valid JSON.' })
    expect(previewBackup('{"hello":1}')).toEqual({ ok: false, error: 'Not a Gym Log backup' })
    const newer = previewBackup(JSON.stringify({ version: 2, logs: [] }))
    expect(newer.ok).toBe(false)
    if (!newer.ok) expect(newer.error).toMatch(/newer Gym Log/)
  })

  it('parks unreadable saved data instead of letting the next save erase it', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{broken' })
    expect(loadState(storage, 123)).toEqual(emptyState())
    expect(storage.map.get(`${BROKEN_PREFIX}123`)).toBe('{broken')
  })

  it('says when a save was refused, and gives up the snapshot first to make room', () => {
    const storage = fakeStorage({ [SNAPSHOT_KEY]: 'old' })
    expect(saveState(fullState(), storage)).toBe(true)

    let calls = 0
    const tight = fakeStorage({ [SNAPSHOT_KEY]: 'old' })
    const set = tight.setItem
    tight.setItem = (k, v) => {
      calls += 1
      if (calls === 1) throw new DOMException('full', 'QuotaExceededError')
      set(k, v)
    }
    expect(saveState(fullState(), tight)).toBe(true)
    expect(tight.map.has(SNAPSHOT_KEY)).toBe(false)

    const full = fakeStorage()
    full.full = true
    expect(saveState(fullState(), full)).toBe(false)
  })

  it('keeps a snapshot and takes a new one once a day', () => {
    const storage = fakeStorage()
    expect(loadSnapshot(storage)).toBeNull()
    expect(writeSnapshot(fullState(), storage, '2026-09-21T15:00:00.000Z')).toBe(true)
    expect(loadSnapshot(storage)).toEqual({ at: '2026-09-21T15:00:00.000Z', state: fullState() })

    const noon = new Date(2026, 8, 21, 12).toISOString()
    expect(snapshotDue(null, '2026-09-21')).toBe(true)
    expect(snapshotDue(noon, '2026-09-21')).toBe(false)
    expect(snapshotDue(noon, '2026-09-22')).toBe(true)
  })
})
