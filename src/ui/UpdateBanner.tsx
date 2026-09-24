import { useEffect, useState } from 'react'
import { isUpdateReady, onUpdateReady } from '../lib/sw.ts'

/** Shown once a new build has taken over. Never reloads on its own, so it can't eat a half-typed set. */
export function UpdateBanner() {
  const [ready, setReady] = useState(isUpdateReady)
  useEffect(() => onUpdateReady(() => setReady(true)), [])
  if (!ready) return null
  return (
    <div className="update-bar" role="status">
      <span>New version ready</span>
      <button type="button" className="small" onClick={() => location.reload()}>
        Reload
      </button>
    </div>
  )
}
