import { useState } from 'react'
import styles from './DistinctionFilter.module.css'

const PILLS = [
  { icon: '⭐', label: '1 Étoile' },
  { icon: '⭐⭐', label: '2 Étoiles' },
  { icon: '⭐⭐⭐', label: '3 Étoiles' },
  { icon: '😊', label: 'Bib Gourmand' },
  { icon: '🍽️', label: 'Assiette' },
  { icon: '🌿', label: 'Vert' },
]

export default function DistinctionFilter({ onChange }) {
  const [active, setActive] = useState(0)

  const handleClick = (i) => {
    setActive(i)
    onChange?.(PILLS[i])
  }

  return (
    <div className={styles.wrap}>
      {PILLS.map(({ icon, label }, i) => (
        <button
          key={label}
          className={`${styles.pill} ${active === i ? styles.active : ''}`}
          onClick={() => handleClick(i)}
        >
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </div>
  )
}
