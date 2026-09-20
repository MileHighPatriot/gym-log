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
      expect(el.textContent).toMatch(/Walk|Leave/)
      click('Leave')
      expect(el.textContent).toMatch(/Resume workout/)
      click('Resume workout')
      expect(el.textContent).toMatch(/Walk|Leave/)
      click('Next')
      expect(el.textContent).toMatch(/How to|lbs/)
      click('Finish')
      expect(el.textContent).toMatch(/Session done/)
      click('Review session')
      expect(el.textContent).toMatch(/Set 1/)
      click('← Back')
      expect(el.textContent).toMatch(/Start workout|Review session|Rest day/)
    }
  })

  it('opens a finished session from Log and jumps from the week strip', () => {
    render()
    if (!el.textContent?.includes('Start workout')) return
    click('Start workout')
    click('Finish')
    click('Done')
    click('Log')
    expect(el.textContent).toMatch(/Push|Pull|Legs/)
    const sessionBtn = [...el.querySelectorAll('button')].find((b) => b.className.includes('session-row-btn'))
    if (!sessionBtn) throw new Error('No session row')
    act(() => {
      sessionBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(el.textContent).toMatch(/Set 1|Walk/)
    click('← Back')
    const weekDay = [...el.querySelectorAll('.week-day')].find((b) => b.textContent?.includes('Mon'))
    if (!weekDay) throw new Error('No Monday on week strip')
    act(() => {
      weekDay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(el.textContent).toMatch(/Today|Calendar/)
  })

  it('logs a typed food from Today and keeps the Gemini key out of backup', () => {
    render()
    click('Log food')
    expect(el.textContent).toMatch(/Eat/)
    const kcal = el.querySelectorAll('input[type="number"]')[0] as HTMLInputElement
    const protein = el.querySelectorAll('input[type="number"]')[1] as HTMLInputElement
    act(() => {
      kcal.value = '2000'
      kcal.dispatchEvent(new Event('input', { bubbles: true }))
      protein.value = '160'
      protein.dispatchEvent(new Event('input', { bubbles: true }))
    })
    click('Save')
    const search = el.querySelector('input[type="search"]') as HTMLInputElement
    act(() => {
      search.value = 'chicken breast'
      search.dispatchEvent(new Event('input', { bubbles: true }))
    })
    click('Chicken breast, cooked')
    const logBtns = [...el.querySelectorAll('button')].filter((b) => b.textContent === 'Log food')
    act(() => {
      logBtns.at(-1)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(el.textContent).toMatch(/Chicken breast/)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toMatch(/chicken|Chicken/)
    expect(raw).not.toMatch(/gym-log-gemini-key/)
    click('← Back')
    expect(el.textContent).toMatch(/left|Eat/)
  })

  it('photo without a key stays typed and never saves a guess', async () => {
    render()
    click('Log food')
    const input = el.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'plate.png', { type: 'image/png' })
    await act(async () => {
      Object.defineProperty(input, 'files', { configurable: true, value: [file] })
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(el.textContent).toMatch(/No Gemini key/)
    expect(el.textContent).not.toMatch(/Save guess/)
  })

  it('photo with a key lands as an editable draft', async () => {
    const orig = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      items: [{ name: 'Rice', grams: 200, kcal: 260, protein: 5, confidence: 0.6 }],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )) as typeof fetch
    try {
      render()
      click('Log food')
      const keyBox = el.querySelector('input[placeholder="Gemini API key"]') as HTMLInputElement
      act(() => {
        const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        proto?.call(keyBox, 'test-key')
        keyBox.dispatchEvent(new Event('input', { bubbles: true }))
        keyBox.dispatchEvent(new Event('blur', { bubbles: true }))
      })
      const input = el.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['x'], 'plate.png', { type: 'image/png' })
      await act(async () => {
        Object.defineProperty(input, 'files', { configurable: true, value: [file] })
        input.dispatchEvent(new Event('change', { bubbles: true }))
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(el.textContent).toMatch(/guess/i)
      const name = [...el.querySelectorAll('input')].find((i) => (i as HTMLInputElement).value === 'Rice') as
        | HTMLInputElement
        | undefined
      if (!name) throw new Error('No draft name field')
      act(() => {
        const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        proto?.call(name, 'White rice')
        name.dispatchEvent(new Event('input', { bubbles: true }))
      })
      click('Save guess')
      expect(el.textContent).toMatch(/White rice/)
      const raw = localStorage.getItem(STORAGE_KEY)
      expect(raw).toMatch(/White rice/)
      expect(raw).not.toMatch(/test-key/)
    } finally {
      globalThis.fetch = orig
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
