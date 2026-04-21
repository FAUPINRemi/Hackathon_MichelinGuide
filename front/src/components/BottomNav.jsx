import styles from './BottomNav.module.css'

const TABS = [
  {
    id: 'restaurants',
    label: '',
    icon: (active) => (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={active ? '#c41230' : '#767676'} strokeWidth="1.8">
        <circle cx="16" cy="16" r="10" />
        <path d="M16 10v12M12 14h8" />
        <circle cx="16" cy="16" r="3" fill={active ? '#c41230' : '#767676'} stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'hotels',
    label: '',
    icon: (active) => (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={active ? '#c41230' : '#767676'} strokeWidth="1.8">
        <rect x="4" y="14" width="24" height="14" rx="2"/>
        <path d="M4 22h24M10 22v-6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/>
        <path d="M10 16h12"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: '',
    icon: (active) => (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={active ? '#c41230' : '#767676'} strokeWidth="1.8">
        <path d="M26 27v-2a6 6 0 0 0-6-6H12a6 6 0 0 0-6 6v2"/>
        <circle cx="16" cy="11" r="5"/>
      </svg>
    ),
  },
  {
    id: 'favorites',
    label: '',
    icon: (active) => (
      <svg width="28" height="28" viewBox="0 0 32 32" fill={active ? '#c41230' : 'none'} stroke={active ? '#c41230' : '#767676'} strokeWidth="1.8">
        <path d="M16 26S4 19 4 11a6 6 0 0 1 12-1h0a6 6 0 0 1 12 1c0 8-12 15-12 15z"/>
      </svg>
    ),
  },
]

export default function BottomNav({ active = 'restaurants', onChange }) {
  return (
    <nav className={styles.nav} aria-label="Navigation principale">
      {TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          className={`${styles.tab} ${active === id ? styles.active : ''}`}
          onClick={() => onChange?.(id)}
          aria-label={id}
        >
          {icon(active === id)}
          {label && <span className={styles.label}>{label}</span>}
        </button>
      ))}
    </nav>
  )
}
