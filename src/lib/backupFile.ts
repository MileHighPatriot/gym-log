import { useState } from 'react'
import { useStore } from '../state/Store.tsx'
import { loadLastExport, markExported } from './backup.ts'

/** Export / share the backup file. Shared by Log's reminder and Settings. */
export function useBackupActions() {
  const { exportBackup, today } = useStore()
  const [lastExport, setLastExport] = useState<string | null>(() => loadLastExport())
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const fileName = `gym-log-${today}.json`

  const backupFile = () => new File([exportBackup()], fileName, { type: 'application/json' })

  const exported = () => {
    const now = new Date().toISOString()
    markExported(now)
    setLastExport(now)
  }

  const download = () => {
    const url = URL.createObjectURL(backupFile())
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    exported()
  }

  const share = async () => {
    const file = backupFile()
    try {
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        download()
        return
      }
      await navigator.share({ files: [file], title: 'Gym Log backup' })
      exported()
    } catch {
      /* user cancelled */
    }
  }

  return { lastExport, canShare, download, share }
}
