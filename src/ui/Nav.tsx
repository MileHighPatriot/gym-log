import type { Tab } from '../types.ts'

const ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Cal', icon: '●' },
  { id: 'exercises', label: 'Lifts', icon: '☰' },
  { id: 'progress', label: 'Log', icon: '↗' },
  { id: 'try', label: 'Try', icon: '+' },
  { id: 'program', label: 'Week', icon: '▦' },
]

export function Nav({ tab, onTab }: { tab: Tab; onTab: (tab: Tab) => void }) {
  return (
    <nav className="nav" aria-label="Main">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={tab === item.id ? 'nav-item on' : 'nav-item'}
          onClick={() => onTab(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
