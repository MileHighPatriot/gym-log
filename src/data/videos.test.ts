import { describe, expect, it } from 'vitest'
import { EXERCISES, getExercise } from './exercises.ts'
import { DAYS } from './program.ts'

describe('videos', () => {
  it('every programmed lift exists and has a how-to source', () => {
    for (const day of DAYS) {
      for (const block of day.blocks) {
        if (block.kind !== 'lift') continue
        const ex = getExercise(block.exerciseId)
        expect(ex.vasaUrl || ex.youtubeId || ex.video).toBeTruthy()
      }
    }
  })

  it('VASA urls look like official mp4s', () => {
    const vasa = EXERCISES.filter((ex) => ex.vasaUrl)
    expect(vasa.length).toBeGreaterThanOrEqual(8)
    for (const ex of vasa) {
      expect(ex.vasaUrl).toMatch(/^https:\/\/media\.vasafitness\.com\/.+\.mp4$/)
      expect(ex.videoCredit).toBe('VASA Fitness')
    }
  })
})
