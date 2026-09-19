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

  it('every lift has a real gym tutorial of that exercise', () => {
    const lifts = EXERCISES.filter((ex) => ex.kind === 'lift')
    for (const ex of lifts) {
      expect(ex.youtubeId, ex.id).toBeTruthy()
      expect(ex.videoCredit, ex.id).toBeTruthy()
      expect(ex.vasaUrl ?? '').not.toMatch(/Selectorized_/)
      expect(ex.videoCredit ?? '').not.toMatch(/Training Chest at VASA Indianapolis/)
    }
    const ids = lifts.map((ex) => ex.youtubeId)
    expect(new Set(ids).size).toBeGreaterThan(40)
  })

  it('does not reuse a tutorial from a different lift', () => {
    expect(getExercise('overhead-tricep').youtubeId).not.toBe('xvvN9HZvaBE')
    expect(getExercise('tricep-extension-machine').youtubeId).not.toBe(getExercise('tricep-pushdown').youtubeId)
    expect(getExercise('cable-chest-fly').youtubeId).not.toBe('Iwe6AmxVf7o')
    expect(getExercise('reverse-grip-pulldown').youtubeId).not.toBe('wyr6gygEeRU')
    expect(getExercise('plate-chest-press').youtubeId).not.toBe(getExercise('seated-chest-press').youtubeId)
    expect(getExercise('plate-incline-press').youtubeId).not.toBe(getExercise('incline-machine').youtubeId)
    expect(getExercise('plate-row').youtubeId).not.toBe(getExercise('seated-row').youtubeId)
    expect(getExercise('curl-machine').youtubeId).not.toBe(getExercise('preacher-curl').youtubeId)
    expect(getExercise('close-grip-pulldown').youtubeId).not.toBe(getExercise('lat-pulldown').youtubeId)
    expect(getExercise('paused-bench').youtubeId).not.toBe(getExercise('bench-press').youtubeId)
  })
})
