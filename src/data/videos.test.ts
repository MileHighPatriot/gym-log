import { describe, expect, it } from 'vitest'
import { EXERCISES, getExercise } from './exercises.ts'
import { DAYS } from './program.ts'

describe('videos', () => {
  it('every programmed lift exists and has a how-to source', () => {
    for (const day of DAYS) {
      for (const block of day.blocks) {
        if (block.kind !== 'lift') continue
        const ex = getExercise(block.exerciseId)
        expect(ex.video).toMatch(/machine\.mp4$/)
      }
    }
  })

  it('YouTube clips are real VASA-gym videos, not the old blog MP4s', () => {
    const withYt = EXERCISES.filter((ex) => ex.youtubeId)
    expect(withYt.length).toBeGreaterThan(20)
    for (const ex of withYt) {
      expect(ex.vasaUrl ?? '').not.toMatch(/Selectorized_/)
      expect(ex.videoCredit ?? '').toMatch(/YouTube/)
      expect(ex.videoCredit ?? '').toMatch(/VASA/i)
    }
  })
})
