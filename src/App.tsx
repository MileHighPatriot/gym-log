import { useEffect } from 'react'
import { Nav } from './ui/Nav.tsx'
import { useStore } from './state/Store.tsx'
import { TodayPage } from './pages/Today.tsx'
import { ExercisesPage } from './pages/Exercises.tsx'
import { ProgressPage } from './pages/Progress.tsx'
import { TryNextPage } from './pages/TryNext.tsx'
import { ProgramPage } from './pages/Program.tsx'
import type { Tab } from './types.ts'

export default function App() {
  const { tab, setTab, openExercise, openSession, openEat, state, sessionView } = useStore()

  useEffect(() => {
    const next = `#/${tab}`
    if (location.hash !== next) history.replaceState(null, '', next)
  }, [tab])

  const go = (next: Tab) => {
    openExercise(null)
    openSession(null)
    openEat(false)
    setTab(next)
  }

  return (
    <div className={`app${state.activeSession && sessionView && tab === 'today' ? ' in-session' : ''}`}>
      <main>
        <div key={tab} className="page-enter">
          {tab === 'today' && <TodayPage />}
          {tab === 'exercises' && <ExercisesPage />}
          {tab === 'progress' && <ProgressPage />}
          {tab === 'try' && <TryNextPage />}
          {tab === 'program' && <ProgramPage />}
        </div>
      </main>
      {!(state.activeSession && sessionView && tab === 'today') && <Nav tab={tab} onTab={go} />}
    </div>
  )
}
