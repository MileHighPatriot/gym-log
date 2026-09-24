import type { Tab } from '../types.ts'

const TABS: Tab[] = ['today', 'eat', 'exercises', 'progress', 'program', 'settings']

export function tabFromHash(hash = typeof location === 'undefined' ? '' : location.hash): Tab | null {
  const name = hash.replace(/^#\/?/, '').split('/')[0]
  if (name === 'try') return 'program'
  return TABS.includes(name as Tab) ? (name as Tab) : null
}

export function tabFromLocation(): Tab | null {
  if (typeof location === 'undefined') return null
  const q = new URLSearchParams(location.search).get('tab')
  if (q === 'try') return 'program'
  if (q && TABS.includes(q as Tab)) return q as Tab
  return tabFromHash()
}

export function hashForTab(tab: Tab, hash = typeof location === 'undefined' ? '' : location.hash): string {
  if (tab === 'program' && (hash.startsWith('#/try') || hash.startsWith('#/program/later'))) {
    return '#/program/later'
  }
  return `#/${tab}`
}
