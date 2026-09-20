import { useEffect } from 'react'
import { Nav } from './ui/Nav.tsx'
import { useStore } from './state/Store.tsx'
import { TodayPage } from './pages/Today.tsx'
import { EatPage } from './pages/Eat.tsx'
import { ExercisesPage } from './pages/Exercises.tsx'
import { ProgressPage } from './pages/Progress.tsx'
import { ProgramPage } from './pages/Program.tsx'
import { hashForTab, tabFromHash } from './lib/hash.ts'
import { OfflineBar } from './ui/Install.tsx'
import type { Tab } from './types.ts'

export default function App() {
  const { tab, setTab, openExercise, openSession, state, sessionView } = useStore()

  useEffect(() => {
    if (location.hash.startsWith('#/try')) {
      history.replaceState(null, '', '#/program/later')
      if (tab !== 'program') setTab('program')
      return
    }
    const next = hashForTab(tab, location.hash)
    if (location.hash !== next) history.replaceState(null, '', next)
  }, [tab, setTab])

  useEffect(() => {
    const onHash = () => {
      if (location.hash.startsWith('#/try')) {
        history.replaceState(null, '', '#/program/later')
        setTab('program')
        return
      }
      const fromHash = tabFromHash()
      if (fromHash) setTab(fromHash)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [setTab])

  const go = (next: Tab) => {
    openExercise(null)
    openSession(null)
    setTab(next)
  }

  return (
    <div className={`app${state.activeSession && sessionView && tab === 'today' ? ' in-session' : ''}`}>
      <OfflineBar />
      <main>
        <div key={tab} className="page-enter">
          {tab === 'today' && <TodayPage />}
          {tab === 'eat' && <EatPage />}
          {tab === 'exercises' && <ExercisesPage />}
          {tab === 'progress' && <ProgressPage />}
          {tab === 'program' && <ProgramPage />}
        </div>
      </main>
      {!(state.activeSession && sessionView && tab === 'today') && <Nav tab={tab} onTab={go} />}
    </div>
  )
}
