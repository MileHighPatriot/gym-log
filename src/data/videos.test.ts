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

  it('uses local how-to clips, not YouTube', () => {
    const lifts = EXERCISES.filter((ex) => ex.kind === 'lift')
    for (const ex of lifts) {
      expect(ex.youtubeId, ex.id).toBeUndefined()
      expect(ex.videoCredit, ex.id).toBeUndefined()
      expect(ex.video, ex.id).toMatch(/machine\.mp4$/)
      expect(ex.vasaUrl ?? '').not.toMatch(/Selectorized_/)
    }
  })
})
