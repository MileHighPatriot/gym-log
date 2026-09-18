import { describe, expect, it } from 'vitest'
import { tabFromHash } from './hash.ts'

describe('tabFromHash', () => {
  it('reads the tab name', () => {
    expect(tabFromHash('#/progress')).toBe('progress')
    expect(tabFromHash('#/program')).toBe('program')
    expect(tabFromHash('#/exercises/bench-press')).toBe('exercises')
    expect(tabFromHash('#/nope')).toBeNull()
  })
})
