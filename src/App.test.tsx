/** @vitest-environment happy-dom */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App.tsx'
import { StoreProvider } from './state/Store.tsx'
import { STORAGE_KEY } from './lib/backup.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let el: HTMLDivElement

function render() {
  el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  act(() => {
    root.render(
      <StoreProvider>
        <App />
      </StoreProvider>,
    )
  })
}

function click(label: string) {
  const btn = [...el.querySelectorAll('button')].find((b) => b.textContent?.replace(/\s+/g, ' ').includes(label))
  if (!btn) throw new Error(`No button ${label}. Have: ${[...el.querySelectorAll('button')].map((b) => b.textContent).join(' | ')}`)
  act(() => {
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

describe('Gym Log app', () => {
  beforeEach(() => {
    localStorage.clear()
    location.hash = ''
  })

  afterEach(() => {
    root.unmount()
    el.remove()
  })

  it('shows today’s program and can start a session', () => {
    render()
    expect(el.textContent).toMatch(/Today/)
    expect(el.textContent).toMatch(/Start workout|Rest day/)
    if (el.textContent?.includes('Start workout')) {
      click('Start workout')
      expect(el.textContent).toMatch(/Walk|Exit/)
      click('Next')
      expect(el.textContent).toMatch(/How to|lbs/)
      click('Finish')
      expect(el.textContent).toMatch(/done|Start workout/)
    }
  })

  it('pins a suggestion onto a day', () => {
    render()
    click('Try')
    expect(el.textContent).toMatch(/Pec deck/)
    click('Pin to Push')
    expect(el.textContent).toMatch(/Pinned/)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toMatch(/pec-deck/)
  })
})
