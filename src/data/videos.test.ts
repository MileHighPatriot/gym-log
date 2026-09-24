/// <reference types="node" />
import { existsSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { EXERCISES, getExercise } from './exercises.ts'
import { DAYS } from './program.ts'

const PUBLIC = fileURLToPath(new URL('../../public', import.meta.url))
const MEDIA_DIR = `${PUBLIC}/exercises`
/** The only files ExerciseMedia ever loads. Anything else just bloats the deploy. */
const ALLOWED = ['setup.jpg', 'finish.jpg', 'machine.mp4']

const onDisk = (url: string) => `${PUBLIC}${url.replace(import.meta.env.BASE_URL, '/')}`
const folderOf = (url: string) => url.match(/exercises\/([^/]+)\//)?.[1]

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

  it('uses local how-to clips for every lift', () => {
    for (const ex of EXERCISES.filter((e) => e.kind === 'lift')) {
      expect(ex.video, ex.id).toMatch(/machine\.mp4$/)
    }
  })

  it('every media file the library points at is on disk', () => {
    for (const ex of EXERCISES) {
      for (const url of [ex.setupImage, ex.finishImage, ...(ex.kind === 'lift' ? [ex.video] : [])]) {
        expect(existsSync(onDisk(url)), `${ex.id}: ${url}`).toBe(true)
      }
    }
  })

  it('ships no media folder or file nothing uses', () => {
    const used = new Set(EXERCISES.flatMap((ex) => [ex.setupImage, ex.finishImage, ex.video].map(folderOf)))
    for (const name of readdirSync(MEDIA_DIR)) {
      const path = `${MEDIA_DIR}/${name}`
      if (!statSync(path).isDirectory()) continue
      expect(used.has(name), `unused folder exercises/${name}`).toBe(true)
      for (const file of readdirSync(path)) {
        expect(ALLOWED, `exercises/${name}/${file}`).toContain(file)
      }
    }
  })
})
