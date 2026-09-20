import { useMemo, useRef, useState } from 'react'
import { searchFoods } from '../data/foods.ts'
import {
  entryFromFood,
  gramsToOz,
  kcalHint,
  remaining,
  suggestedPortion,
  suggestedProtein,
  totalsForDate,
} from '../lib/diet.ts'
import { estimateFoodPhoto, loadGeminiKey, saveGeminiKey } from '../lib/gemini.ts'
import { useStore } from '../state/Store.tsx'
import { FuelBars } from '../ui/FuelBars.tsx'
import type { FoodItem } from '../types.ts'
import type { PhotoGuess } from '../lib/gemini.ts'

export function EatPage() {
  const { state, today, openEat, logFood, removeFood, setDietGoals } = useStore()
  const latestLbs = [...state.bodyWeight].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.lbs
  const [kcal, setKcal] = useState(state.dietGoals.kcal ? String(state.dietGoals.kcal) : '')
  const [protein, setProtein] = useState(
    state.dietGoals.protein
      ? String(state.dietGoals.protein)
      : latestLbs
        ? String(suggestedProtein(latestLbs))
        : '',
  )
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<FoodItem | null>(null)
  const [servings, setServings] = useState(1)
  const [customName, setCustomName] = useState('')
  const [customKcal, setCustomKcal] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [key, setKey] = useState(() => loadGeminiKey())
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [drafts, setDrafts] = useState<PhotoGuess[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const totals = totalsForDate(state.foodEntries, today)
  const left = remaining(state.dietGoals, totals)
  const matches = useMemo(() => searchFoods(q), [q])
  const todayFoods = state.foodEntries.filter((row) => row.date === today).reverse()

  const pick = (food: FoodItem) => {
    const portion = suggestedPortion(food, left.kcal)
    setPicked(food)
    setServings(portion.servings)
    setQ(food.name)
  }

  const savePicked = () => {
    if (!picked) return
    logFood(entryFromFood(picked, servings, { date: today, source: 'search' }))
    setPicked(null)
    setQ('')
  }

  const saveCustom = () => {
    const name = customName.trim()
    const k = Number(customKcal)
    if (!name || !k) return
    logFood(
      entryFromFood(
        { name, grams: 0, kcal: k, protein: Number(customProtein) || 0 },
        1,
        { date: today, source: 'custom' },
      ),
    )
    setCustomName('')
    setCustomKcal('')
    setCustomProtein('')
  }

  const patchDraft = (i: number, patch: Partial<PhotoGuess>) => {
    setDrafts((rows) => rows.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }

  const onPhoto = async (file: File | undefined) => {
    setPhotoError('')
    setDrafts([])
    if (!file) return
    try {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
      setPhotoUrl(URL.createObjectURL(file))
    } catch {
      setPhotoUrl('')
    }
    const stored = key.trim()
    saveGeminiKey(stored)
    if (!stored) {
      setPhotoError('No Gemini key yet. Type the food, or paste a key below.')
      return
    }
    setPhotoBusy(true)
    try {
      const items = await estimateFoodPhoto(file, stored)
      if (!items.length) setPhotoError('Nothing guessed. Type it instead.')
      else setDrafts(items)
    } catch {
      setPhotoError('Photo estimate failed. Type it instead.')
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <section className="page">
      <button type="button" className="ghost" onClick={() => openEat(false)}>
        ← Back
      </button>
      <header className="page-head">
        <p className="eyebrow">Fuel</p>
        <h1>Eat</h1>
        <p className="muted">A guess you can edit. Photo is never the count until you save it.</p>
      </header>

      <div className="card">
        {state.dietGoals.kcal > 0 ? (
          <FuelBars goals={state.dietGoals} totals={totals} />
        ) : (
          <p className="muted">Set a daily calorie target to see what’s left.</p>
        )}
      </div>

      <div className="card">
        <h2>Targets</h2>
        {latestLbs && (
          <p className="muted">
            Latest weight {latestLbs} lbs. Protein often starts near {suggestedProtein(latestLbs)} g.
            Calories many people sit around {kcalHint(latestLbs)}.
          </p>
        )}
        <form
          className="row wrap"
          onSubmit={(e) => {
            e.preventDefault()
            setDietGoals({ kcal: Number(kcal) || 0, protein: Number(protein) || 0 })
          }}
        >
          <label className="grow">
            kcal
            <input
              inputMode="numeric"
              type="number"
              min="0"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
            />
          </label>
          <label>
            protein g
            <input
              inputMode="numeric"
              type="number"
              min="0"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </label>
          <button type="submit" className="primary">
            Save
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Type a food</h2>
        <input
          className="search"
          type="search"
          placeholder="Chicken, rice, eggs…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPicked(null)
          }}
        />
        {!picked && (
          <ul className="plain">
            {matches.map((food) => (
              <li key={food.id}>
                <button type="button" className="linkish" onClick={() => pick(food)}>
                  {food.name}
                </button>
                <span>
                  {food.kcal} kcal · {food.protein} g · {food.servingLabel}
                </span>
              </li>
            ))}
          </ul>
        )}
        {picked && (
          <div className="portion">
            <p className="eyebrow">{picked.servingLabel}</p>
            <h3>{picked.name}</h3>
            {state.dietGoals.kcal > 0 ? (
              <p className="muted">
                {`About ${servings} ${servings === 1 ? 'serving' : 'servings'}${
                  picked.grams ? ` / ${gramsToOz(picked.grams * servings)}` : ''
                } uses what’s left (${left.kcal} kcal).`}
              </p>
            ) : (
              <p className="muted">Set a calorie target to get a leftover portion.</p>
            )}
            <label>
              servings
              <input
                inputMode="decimal"
                type="number"
                step="0.25"
                min="0.25"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value) || 1)}
              />
            </label>
            <p className="muted">
              {Math.round(picked.kcal * servings)} kcal · {Math.round(picked.protein * servings * 10) / 10} g
              protein
            </p>
            <div className="row">
              <button type="button" className="primary" onClick={savePicked}>
                Log food
              </button>
              <button type="button" className="ghost" onClick={() => setPicked(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Snap a plate</h2>
        <p className="muted">Often off by a lot. Edit or drop every guess before it counts.</p>
        <input
          ref={fileRef}
          className="file-hidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            void onPhoto(file)
          }}
        />
        <button type="button" className="primary wide" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
          {photoBusy ? 'Guessing…' : 'Snap or pick a photo'}
        </button>
        {photoUrl && <img className="photo-preview" src={photoUrl} alt="Plate reminder" />}
        {photoError && <p className="note">{photoError}</p>}
        {drafts.map((draft, i) => (
          <div key={`draft-${i}`} className="portion">
            <p className="eyebrow">Guess — edit before it counts</p>
            <h3>{draft.name || 'Food'}</h3>
            {draft.confidence ? (
              <p className="muted">{Math.round(draft.confidence * 100)}% confidence</p>
            ) : null}
            <div className="row wrap">
              <label className="grow">
                name
                <input
                  value={draft.name}
                  onChange={(e) => patchDraft(i, { name: e.target.value })}
                />
              </label>
              <label>
                kcal
                <input
                  inputMode="numeric"
                  type="number"
                  min="0"
                  value={draft.kcal || ''}
                  onChange={(e) => patchDraft(i, { kcal: Number(e.target.value) || 0 })}
                />
              </label>
              <label>
                protein g
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  value={draft.protein || ''}
                  onChange={(e) => patchDraft(i, { protein: Number(e.target.value) || 0 })}
                />
              </label>
              <label>
                grams
                <input
                  inputMode="numeric"
                  type="number"
                  min="0"
                  value={draft.grams || ''}
                  onChange={(e) => patchDraft(i, { grams: Number(e.target.value) || 0 })}
                />
              </label>
            </div>
            <div className="row">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  if (!draft.name.trim() || !draft.kcal) return
                  logFood(
                    entryFromFood(
                      { name: draft.name.trim(), grams: draft.grams || 0, kcal: draft.kcal, protein: draft.protein },
                      1,
                      { date: today, source: 'photo' },
                    ),
                  )
                  setDrafts((rows) => rows.filter((_, idx) => idx !== i))
                }}
              >
                Save guess
              </button>
              <button type="button" className="ghost" onClick={() => setDrafts((rows) => rows.filter((_, idx) => idx !== i))}>
                Drop
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Not in the list</h2>
        <div className="row wrap">
          <input placeholder="Name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          <input
            inputMode="numeric"
            type="number"
            min="0"
            placeholder="kcal"
            value={customKcal}
            onChange={(e) => setCustomKcal(e.target.value)}
          />
          <input
            inputMode="decimal"
            type="number"
            min="0"
            placeholder="protein g"
            value={customProtein}
            onChange={(e) => setCustomProtein(e.target.value)}
          />
          <button type="button" className="primary" onClick={saveCustom}>
            Add
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Today</h2>
        {todayFoods.length === 0 && <p className="muted">Nothing logged yet.</p>}
        <ul className="plain">
          {todayFoods.map((row) => (
            <li key={row.id}>
              <span>
                <strong>{row.name}</strong>
                <em className="muted">
                  {' '}
                  {row.kcal} kcal · {row.protein} g
                  {row.source === 'photo' ? ' · photo' : ''}
                </em>
              </span>
              <button type="button" className="ghost" onClick={() => removeFood(row.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Photo key</h2>
        <p className="muted">Gemini key stays on this phone. It is not in the JSON backup. Estimates leave the phone to Google.</p>
        <input
          type="password"
          autoComplete="off"
          placeholder="Gemini API key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onBlur={() => saveGeminiKey(key)}
        />
      </div>
    </section>
  )
}
