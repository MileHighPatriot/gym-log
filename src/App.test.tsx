/** @vitest-environment happy-dom */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App.tsx'
import { StoreProvider } from './state/Store.tsx'
import { SNAPSHOT_KEY, STORAGE_KEY } from './lib/backup.ts'
import { addDays, localISODate } from './lib/dates.ts'

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

function nav(label: string) {
  const btn = [...el.querySelectorAll('.nav-item')].find((b) => b.textContent?.includes(label))
  if (!btn) throw new Error(`No nav ${label}`)
  act(() => {
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

function click(label: string) {
  const btn = [...el.querySelectorAll('button')].find((b) => b.textContent?.replace(/\s+/g, ' ').includes(label))
  if (!btn) throw new Error(`No button ${label}. Have: ${[...el.querySelectorAll('button')].map((b) => b.textContent).join(' | ')}`)
  act(() => {
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

function type(input: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function openSettings() {
  const gear = el.querySelector('button[aria-label="Settings"]')
  if (!gear) throw new Error('No settings gear')
  act(() => {
    gear.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

async function pickFile(input: HTMLInputElement, file: File) {
  await act(async () => {
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 0))
  })
}

function seed(extra: Record<string, unknown>) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      exportedAt: '',
      programOverride: null,
      logs: [],
      activeSession: null,
      bodyWeight: [],
      dismissedSuggestions: [],
      pinnedSuggestions: [],
      foodEntries: [],
      dietGoals: { kcal: 0, protein: 0 },
      ...extra,
    }),
  )
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
    nav('Log')
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
    click('Today')
    expect(el.textContent).toMatch(/kcal left|Log food/)
    expect(el.textContent).not.toMatch(/Type a food/)
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
    const calls: { url: string; init?: RequestInit }[] = []
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      return new Response(
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
      )
    }) as typeof fetch
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
      // The key rides in a header, never the URL.
      expect(calls[0].url).not.toMatch(/key=/)
      expect(new Headers(calls[0].init?.headers).get('x-goog-api-key')).toBe('test-key')
    } finally {
      globalThis.fetch = orig
    }
  })

  it('pins a suggestion onto a day', () => {
    render()
    click('Week')
    expect(el.textContent).not.toMatch(/Pec deck/)
    click('Later (')
    expect(el.textContent).toMatch(/Pec deck/)
    click('Pin to Push')
    expect(el.textContent).toMatch(/Pinned/)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toMatch(/pec-deck/)
  })

  it('shows session HUD last/next and Same marks a set', () => {
    const seed = {
      version: 1,
      exportedAt: '2026-09-20T12:00:00.000Z',
      programOverride: null,
      logs: [
        {
          id: 'old-push',
          date: '2026-09-14',
          weekday: 1,
          dayProgramId: 'push-a',
          startedAt: '2026-09-14T12:00:00.000Z',
          endedAt: '2026-09-14T13:00:00.000Z',
          blocks: [
            {
              id: 'pa-bench',
              kind: 'lift',
              exerciseId: 'bench-press',
              sets: 3,
              repMin: 8,
              repMax: 10,
              restSec: 90,
              logged: [{ weight: 185, reps: 6, done: true }],
            },
          ],
        },
      ],
      activeSession: null,
      bodyWeight: [],
      dismissedSuggestions: [],
      pinnedSuggestions: [],
      foodEntries: [],
      dietGoals: { kcal: 0, protein: 0 },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    render()
    const mon = [...el.querySelectorAll('.week-day')].find((b) => b.textContent?.includes('Mon'))
    if (!mon) throw new Error('No Monday on the week strip')
    act(() => {
      mon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(el.textContent).toMatch(/Push/)
    click('Start')
    expect(el.textContent).toMatch(/Leave/)
    click('Next')
    expect(el.textContent).toMatch(/last 185 × 6 · beat it/)
    const lbs = el.querySelector('input[aria-label="lbs"]') as HTMLInputElement
    expect(lbs.value).toBe('185')
    click('Same')
    expect(el.textContent).toMatch(/✓/)
    expect(el.textContent).toMatch(/Next up Barbell bench press/)
    click('Skip rest')
    expect(el.textContent).not.toMatch(/Skip rest/)
  })

  it('seeds +5 when every last set hit the top of the range', () => {
    const seed = {
      version: 1,
      exportedAt: '2026-09-20T12:00:00.000Z',
      programOverride: null,
      logs: [
        {
          id: 'old-push',
          date: '2026-09-14',
          weekday: 1,
          dayProgramId: 'push-a',
          startedAt: '2026-09-14T12:00:00.000Z',
          endedAt: '2026-09-14T13:00:00.000Z',
          blocks: [
            {
              id: 'pa-bench',
              kind: 'lift',
              exerciseId: 'bench-press',
              sets: 3,
              repMin: 8,
              repMax: 10,
              restSec: 90,
              logged: [
                { weight: 185, reps: 10, done: true },
                { weight: 185, reps: 10, done: true },
                { weight: 185, reps: 10, done: true },
              ],
            },
          ],
        },
      ],
      activeSession: null,
      bodyWeight: [],
      dismissedSuggestions: [],
      pinnedSuggestions: [],
      foodEntries: [],
      dietGoals: { kcal: 0, protein: 0 },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    render()
    const mon = [...el.querySelectorAll('.week-day')].find((b) => b.textContent?.includes('Mon'))
    if (!mon) throw new Error('No Monday on the week strip')
    act(() => {
      mon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    click('Start')
    click('Next')
    expect(el.textContent).toMatch(/last 185 × 10 · next 190 × 6/)
    const lbsInput = el.querySelector('input[aria-label="lbs"]') as HTMLInputElement
    expect(lbsInput.value).toBe('190')
    expect(el.textContent).toMatch(/Warm-up/)
    expect(el.textContent).toMatch(/95 × 5/)
    expect(el.textContent).toMatch(/45 \+ 25 \+ 2.5 \/ side/)
    expect(el.textContent).toMatch(/45 × 10/)
  })

  it('starts a walk-only session from a rest day and logs it as a walk', () => {
    render()
    const sun = [...el.querySelectorAll('.week-day')].find((b) => b.textContent?.includes('Sun'))
    if (!sun) throw new Error('No Sunday on the week strip')
    act(() => {
      sun.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    const isToday = el.textContent?.includes('Today') && !el.textContent?.includes('Calendar')
    if (!isToday) return
    click('Walk now')
    expect(el.textContent).toMatch(/Leave/)
    expect(el.textContent).toMatch(/set walk/)
    click('Mark done')
    click('Finish')
    click('Done')
    nav('Log')
    click('Walks')
    expect(el.textContent).toMatch(/Walk · Just a walk/)
  })

  it('deload week trims a set and the load', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        exportedAt: '',
        programOverride: null,
        logs: [
          {
            id: 'old-push',
            date: '2026-09-14',
            weekday: 1,
            dayProgramId: 'push-a',
            startedAt: '2026-09-14T12:00:00.000Z',
            endedAt: '2026-09-14T13:00:00.000Z',
            blocks: [
              {
                id: 'pa-bench',
                kind: 'lift',
                exerciseId: 'bench-press',
                sets: 3,
                repMin: 8,
                repMax: 10,
                restSec: 90,
                logged: [{ weight: 200, reps: 10, done: true }],
              },
            ],
          },
        ],
        activeSession: null,
        bodyWeight: [],
        dismissedSuggestions: [],
        pinnedSuggestions: [],
        foodEntries: [],
        dietGoals: { kcal: 0, protein: 0 },
      }),
    )
    render()
    click('Week')
    click('Off')
    expect(el.textContent).toMatch(/This week is a deload/)
    click('Today')
    const mon = [...el.querySelectorAll('.week-day')].find((b) => b.textContent?.includes('Mon'))
    if (!mon) throw new Error('No Monday')
    act(() => {
      mon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(el.textContent).toMatch(/−10% · −1 set/)
    click('Start')
    click('Next')
    expect(el.textContent).toMatch(/deload/)
    expect(el.querySelectorAll('input[aria-label="lbs"]')).toHaveLength(3)
    expect((el.querySelector('input[aria-label="lbs"]') as HTMLInputElement).value).toBe('180')
  })

  it('RPE hard blocks the +5 next time', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        exportedAt: '',
        programOverride: null,
        logs: [
          {
            id: 'old-push',
            date: '2026-09-14',
            weekday: 1,
            dayProgramId: 'push-a',
            startedAt: '2026-09-14T12:00:00.000Z',
            endedAt: '2026-09-14T13:00:00.000Z',
            blocks: [
              {
                id: 'pa-bench',
                kind: 'lift',
                exerciseId: 'bench-press',
                sets: 3,
                repMin: 8,
                repMax: 10,
                restSec: 90,
                logged: [
                  { weight: 185, reps: 10, done: true, rpe: 'hard' },
                  { weight: 185, reps: 10, done: true },
                ],
              },
            ],
          },
        ],
        activeSession: null,
        bodyWeight: [],
        dismissedSuggestions: [],
        pinnedSuggestions: [],
        foodEntries: [],
        dietGoals: { kcal: 0, protein: 0 },
      }),
    )
    render()
    const mon = [...el.querySelectorAll('.week-day')].find((b) => b.textContent?.includes('Mon'))
    if (!mon) throw new Error('No Monday')
    act(() => {
      mon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    click('Start')
    click('Next')
    expect(el.textContent).toMatch(/last 185 × 10 · match it/)
    click('Same')
    expect(el.textContent).toMatch(/easy/)
    click('hard')
    click('Undo set')
    expect(el.textContent).not.toMatch(/Skip rest/)
    expect(el.textContent).not.toMatch(/✓/)
  })

  it('logs a food into a meal and repeats yesterday', () => {
    // Local calendar day, not UTC: the app works in local dates.
    const yesterday = addDays(localISODate(), -1)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        exportedAt: '',
        programOverride: null,
        logs: [],
        activeSession: null,
        bodyWeight: [],
        dismissedSuggestions: [],
        pinnedSuggestions: [],
        foodEntries: [
          {
            id: 'y1',
            date: yesterday,
            name: 'Greek yogurt, nonfat',
            servings: 1,
            grams: 227,
            kcal: 130,
            protein: 23,
            source: 'search',
            meal: 'breakfast',
          },
        ],
        dietGoals: { kcal: 2000, protein: 160 },
      }),
    )
    render()
    click('Eat')
    expect(el.textContent).toMatch(/Recent/)
    expect(el.textContent).toMatch(/Greek yogurt/)
    click('Repeat yesterday')
    expect(el.textContent).toMatch(/Copied 1 item/)
    expect(el.textContent).toMatch(/breakfast · 130 kcal/)
    click('Read a label')
  })

  it('opens Settings from the gear', () => {
    render()
    openSettings()
    expect(el.textContent).toMatch(/Settings/)
    expect(el.textContent).toMatch(/Safety copy/)
    expect(el.textContent).toMatch(/Build /)
  })

  it('imports a backup only after you confirm, keeping a safety copy', async () => {
    seed({ bodyWeight: [{ date: '2026-09-01', lbs: 190 }], settings: { onboarded: true } })
    render()
    openSettings()
    const backup = JSON.stringify({
      version: 1,
      exportedAt: '2026-09-20T12:00:00.000Z',
      programOverride: null,
      logs: [
        {
          id: 'l1',
          date: '2026-09-20',
          weekday: 0,
          dayProgramId: 'push-a',
          startedAt: '2026-09-20T12:00:00.000Z',
          endedAt: '2026-09-20T13:00:00.000Z',
          blocks: [],
        },
      ],
      activeSession: null,
      bodyWeight: [{ date: '2026-09-20', lbs: 201 }],
      dismissedSuggestions: [],
      pinnedSuggestions: [],
      foodEntries: [],
      dietGoals: { kcal: 0, protein: 0 },
    })
    const input = el.querySelector('input[type="file"]') as HTMLInputElement
    await pickFile(input, new File([backup], 'backup.json', { type: 'application/json' }))
    expect(el.textContent).toMatch(/Replace everything on this phone/)
    expect(el.textContent).toMatch(/sessions · 2026-09-20 to 2026-09-20/)
    expect(localStorage.getItem(STORAGE_KEY)).toMatch(/"lbs":190/)

    click('Replace my data')
    expect(localStorage.getItem(STORAGE_KEY)).toMatch(/"lbs":201/)
    expect(localStorage.getItem(SNAPSHOT_KEY)).toMatch(/"lbs":190/)
    expect(el.textContent).toMatch(/Imported backup.json/)
  })

  it('a bad import says why and changes nothing', async () => {
    seed({ bodyWeight: [{ date: '2026-09-01', lbs: 190 }], settings: { onboarded: true } })
    render()
    openSettings()
    const input = el.querySelector('input[type="file"]') as HTMLInputElement
    await pickFile(input, new File(['nope'], 'bad.json', { type: 'application/json' }))
    expect(el.textContent).toMatch(/isn’t valid JSON/)
    expect(el.textContent).toMatch(/Nothing was changed/)
    expect(el.textContent).not.toMatch(/Replace everything/)
    expect(localStorage.getItem(STORAGE_KEY)).toMatch(/"lbs":190/)
  })

  it('Week editor saves once on Save and blocks a backwards rep range', () => {
    render()
    nav('Week')
    expect(el.textContent).toMatch(/card v1/)
    const [sets, from, to] = [...el.querySelectorAll('.lift-edit')][0].querySelectorAll('input')
    type(from, String(Number(to.value) + 1))
    expect(el.textContent).toMatch(/can’t be more than/)
    const save = [...el.querySelectorAll('button')].find((b) => b.textContent === 'Save') as HTMLButtonElement
    expect(save.disabled).toBe(true)
    expect(el.textContent).toMatch(/card v1/)

    type(from, '1')
    type(sets, '5')
    expect(el.textContent).toMatch(/card v1/)
    click('Save')
    expect(el.textContent).toMatch(/card v2/)
    expect([...el.querySelectorAll('.lift-edit')][0].textContent).toMatch(/5×/)
  })
})
