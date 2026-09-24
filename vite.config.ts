import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

function gitShort(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'local'
  }
}

function localStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

/** e.g. 20260923-1412-761e34e (local time + commit). New every build, so every deploy is a new service worker. */
const BUILD_ID = `${localStamp()}-${gitShort()}`

/** Files from public/ that the app shell needs offline. Exercise media is cached on first view instead. */
const SHELL_FILES = ['index.html', 'manifest.webmanifest', 'favicon.svg']

/** Emits sw.js from src/sw/sw.template.js with this build's ID and hashed asset list. */
function serviceWorker(): Plugin {
  return {
    name: 'gym-log-sw',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter((file) => file.startsWith('assets/'))
      const source = readFileSync(new URL('./src/sw/sw.template.js', import.meta.url), 'utf8')
        .replace('__BUILD_ID__', BUILD_ID)
        .replace('__PRECACHE__', JSON.stringify([...SHELL_FILES, ...assets]))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  base: process.env.GITHUB_PAGES === 'true' ? '/gym-log/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_ID),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
