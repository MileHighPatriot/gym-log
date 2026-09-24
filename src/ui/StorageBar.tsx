import { useStore } from '../state/Store.tsx'

/** The phone refused the last save. Says so loudly instead of losing sets quietly. */
export function StorageBar() {
  const { storageError, setTab } = useStore()
  if (!storageError) return null
  return (
    <div className="storage-bar" role="alert">
      <span>Phone storage is full · your last change didn’t save</span>
      <button type="button" className="small" onClick={() => setTab('settings')}>
        Export
      </button>
    </div>
  )
}
