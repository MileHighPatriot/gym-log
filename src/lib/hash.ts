import type { Tab } from '../types.ts'

const TABS: Tab[] = ['today', 'exercises', 'progress', 'try', 'program']

export function tabFromHash(hash = typeof location === 'undefined' ? '' : location.hash): Tab | null {
  const name = hash.replace(/^#\/?/, '').split('/')[0]
  return TABS.includes(name as Tab) ? (name as Tab) : null
}

export function tabFromLocation(): Tab | null {
  if (typeof location === 'undefined') return null
  const q = new URLSearchParams(location.search).get('tab')
  if (q && TABS.includes(q as Tab)) return q as Tab
  return tabFromHash()
}
