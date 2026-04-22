import { useState } from 'react'
import styles from './HotelCard.module.css'

export default function HotelCard({ hotel, onClick, layout = 'grid' }) {
  const [saved, setSaved] = useState(false)
  const { name, location, img, distinction, distinction_score, numRooms } = hotel

  const hasDistinction = distinction_score > 0
  const isPlus = hotel.isPlus

  return (
    <article
      className={`${styles.card} ${layout === 'scroll' ? styles.scroll : ''}`}
      onClick={() => onClick?.(hotel)}
    >
      <div className={styles.imgWrap}>
        {img
          ? <img className={styles.img} src={img} alt={name} loading="lazy" />
          : <div className={styles.imgPlaceholder}><HotelIcon /></div>
        }
        <button
          className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
          onClick={(e) => { e.stopPropagation(); setSaved((s) => !s) }}
          aria-label={saved ? 'Retirer' : 'Sauvegarder'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'white' : 'none'} stroke="white" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        {isPlus && <span className={styles.plusBadge}>PLUS</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.distinctions}>
          {hasDistinction && distinction?.label ? (
            <span className={styles.distLabel}>{distinction.label.split(':')[0]}</span>
          ) : (
            <span className={styles.distLabel}>Sélection MICHELIN</span>
          )}
        </div>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.meta}>
          {location}
          {numRooms ? ` · ${numRooms} chambres` : ''}
        </p>
      </div>
    </article>
  )
}

function HotelIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.2">
      <path d="M3 21h18M3 7l9-4 9 4M5 21V7M19 21V7"/>
      <rect x="9" y="13" width="6" height="8"/>
      <rect x="7" y="10" width="2" height="2"/><rect x="15" y="10" width="2" height="2"/>
    </svg>
  )
}
