import { useState } from 'react'
import { MichelinFlower } from '../common/MichelinIcon'
import styles from './RestaurantCard.module.css'

export default function RestaurantCard({ restaurant, onClick, layout = 'grid' }) {
  const [saved, setSaved] = useState(false)
  const { name, cuisine, location, price, stars, bib, img } = restaurant

  return (
    <article
      className={`${styles.card} ${layout === 'scroll' ? styles.scroll : ''}`}
      onClick={() => onClick?.(restaurant)}
    >
      <div className={styles.imgWrap}>
        <img className={styles.img} src={img} alt={name} loading="lazy" />
        <button
          className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
          onClick={(e) => { e.stopPropagation(); setSaved((s) => !s) }}
          aria-label={saved ? 'Retirer' : 'Sauvegarder'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'white' : 'none'} stroke="white" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.distinctions}>
          {bib ? (
            <span className={styles.bibIcon}>😊</span>
          ) : (
            Array.from({ length: stars }).map((_, i) => (
              <MichelinFlower key={i} size={16} color="#c41230" />
            ))
          )}
        </div>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.meta}>{location} · {cuisine}</p>
        <p className={styles.price}>{price}</p>
      </div>
    </article>
  )
}
