import type { Tab } from '../types.ts'

const ITEMS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'eat', label: 'Eat' },
  { id: 'progress', label: 'Log' },
  { id: 'exercises', label: 'Library' },
  { id: 'program', label: 'Week' },
]

function NavIcon({ id }: { id: Tab }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (id === 'today') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    )
  }
  if (id === 'eat') {
    return (
      <svg {...common}>
        <path d="M7 3v10M5 3v6a2 2 0 0 0 4 0V3M17 3v18M15 3h4v6h-4z" />
      </svg>
    )
  }
  if (id === 'exercises') {
    return (
      <svg {...common}>
        <path d="M4 9h3v6H4zM17 9h3v6h-3zM7 12h10M7 8v8M17 8v8" />
      </svg>
    )
  }
  if (id === 'progress') {
    return (
      <svg {...common}>
        <path d="M4 17l5-5 4 3 7-8" />
        <path d="M15 7h5v5" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  )
}

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
          <span className="nav-icon">
            <NavIcon id={item.id} />
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
