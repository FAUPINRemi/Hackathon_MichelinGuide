import styles from './BottomNav.module.css'

const TABS = [
  {
    id: 'restaurants',
    label: '',
    icon: (active) => {
      const c = active ? '#c41230' : '#767676'
      return (
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <g transform="matrix(0.8499983,0,0,0.8499983,2.0818388,3.7975318)" fill={c}>
            <path d="m 20.8,8.6 c 0,0 0,-5.5 0,-7.3 0,-0.2 0,-0.4 -0.1,-0.6 -0.1,-0.2 -0.3,-0.4 -0.6,-0.1 -1,1.3 -0.8,5.9 -0.8,6.5 0.1,0.6 0.6,1 0.6,1.3 0.1,1 -0.2,4 -0.2,5.2 0,0.6 0.1,1.8 0.2,2.3 0,0.1 0.1,0.3 0.3,0.3 h 0.3 c 0.1,0 0.3,-0.1 0.3,-0.3 0.1,-0.6 0.2,-1.8 0.2,-2.3 0,-1 -0.2,-4 -0.2,-5 z"/>
            <path d="m 1.8,0.7 c 0,0 0,2.3 -0.1,3 0,0.1 0,0.1 -0.1,0.1 C 1.5,3.8 1.5,3.7 1.5,3.7 1.4,2.9 1.3,0.7 1.3,0.7 c 0,-0.1 -0.1,-0.1 -0.1,0 0,0 -0.1,2.3 -0.1,3 0,0.1 0,0.1 -0.1,0.1 v 0 c 0,0 0,-0.1 0,-0.2 -0.1,-0.8 -0.1,-3 -0.1,-3 0,-0.1 -0.1,-0.1 -0.1,0 0,0 -0.1,2.3 -0.2,3 0,0.1 0,0.1 -0.1,0.1 -0.1,0 0,0 0,-0.1 0,-0.8 -0.1,-3 -0.1,-3 0,-0.1 0,-0.1 -0.1,0 0,0.8 -0.4,3.1 -0.3,3.9 0.1,0.8 0.3,1 0.4,1.2 0.3,0.3 0.5,0.7 0.5,1.3 0,1 0.1,2.5 -0.1,4.6 -0.1,1.5 -0.3,3.6 -0.1,4.6 0,0.1 0.1,0.3 0.3,0.3 h 0.2 c 0.1,0 0.3,-0.1 0.3,-0.3 0.1,-0.9 0.1,-3 -0.1,-4.6 C 1.3,9.5 1.4,8 1.4,7 1.4,6.4 1.6,6 1.8,5.7 2,5.5 2.2,5.3 2.2,4.5 2.3,3.7 1.9,1.4 1.8,0.7 c 0,-0.2 0,-0.2 0,0 z"/>
            <path d="m 10.6,3.9 c 2.5,0 4.5,2.1 4.5,4.6 0,2.6 -2,4.6 -4.5,4.6 -2.5,0 -4.5,-2 -4.5,-4.6 0,-2.5 2,-4.6 4.5,-4.6 m 0,-0.7 c -2.9,0 -5.2,2.3 -5.2,5.3 0,3 2.3,5.3 5.2,5.3 2.9,0 5.2,-2.3 5.2,-5.3 0,-3 -2.3,-5.3 -5.2,-5.3 z"/>
            <path d="m 10.6,1.6 c 3.8,0 6.9,3 6.9,6.9 0,3.8 -3.1,6.9 -6.9,6.9 C 6.8,15.4 3.7,12.3 3.7,8.5 3.8,4.6 6.8,1.6 10.6,1.6 m 0,-1.1 c -4.4,0 -7.9,3.5 -7.9,8 0,4.5 3.6,8 7.9,8 4.4,0 7.9,-3.6 7.9,-8 0.1,-4.5 -3.4,-8 -7.9,-8 z"/>
          </g>
        </svg>
      )
    },
  },
  {
    id: 'hotels',
    label: '',
    icon: (active) => {
      const c = active ? '#c41230' : '#767676'
      return (
        <svg width="26" height="22" viewBox="0 0 26 22" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="1" y="13" width="24" height="6" rx="1.5"/>
          <path d="M4 13V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5"/>
          <rect x="6" y="9" width="6" height="4" rx="1"/>
          <rect x="14" y="9" width="6" height="4" rx="1"/>
          <line x1="3" y1="19" x2="3" y2="21"/>
          <line x1="23" y1="19" x2="23" y2="21"/>
        </svg>
      )
    },
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
