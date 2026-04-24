import { useState } from 'react'
import { api } from '../../api/client'
import etoileUrl from '../../assets/svg/etoile_michelin.svg'
import bibsUrl from '../../assets/svg/bibs.svg'
import styles from './RoadtripSuggestionCard.module.css'

function DistinctionBadge({ slug }) {
  if (!slug) return null
  if (slug === 'bib-gourmand') {
    return (
      <span className={styles.badge}>
        <img src={bibsUrl} width={10} height={10} alt="" />
        Bib Gourmand
      </span>
    )
  }
  const count = slug.includes('3-stars') ? 3 : slug.includes('2-stars') ? 2 : slug.includes('1-star') ? 1 : 0
  if (count > 0) {
    return (
      <span className={styles.badge}>
        {Array.from({ length: count }).map((_, i) => (
          <img key={i} src={etoileUrl} width={10} height={10} alt="" />
        ))}
        {count === 1 ? 'Étoile' : 'Étoiles'} Michelin
      </span>
    )
  }
  return null
}

export default function RoadtripSuggestionCard({ stop, onAdd, isSelected, onRestaurantClick, onHotelClick }) {
  const [loading, setLoading] = useState(false)
  const isResto = stop.category === 'restaurant'
  const clickable = Boolean((isResto && onRestaurantClick) || (!isResto && onHotelClick))

  async function handleCardClick() {
    if (loading || !clickable) return
    try {
      setLoading(true)
      if (isResto && onRestaurantClick) {
        const data = await api.restaurants.get(stop.id)
        onRestaurantClick(data)
      } else if (!isResto && onHotelClick) {
        const data = await api.hotels.get(stop.id)
        onHotelClick(data)
      }
    } catch { /* silently ignore */ } finally {
      setLoading(false)
    }
  }

  return (
    <article
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${loading ? styles.cardLoading : ''}`}
    >
      <div
        className={`${styles.imgArea} ${clickable ? styles.imgClickable : ''}`}
        onClick={clickable ? handleCardClick : undefined}
        role={clickable ? 'button' : undefined}
        aria-label={clickable ? `Voir la fiche de ${stop.name}` : undefined}
      >
        {stop.image ? (
          <img src={stop.image} alt={stop.name} className={styles.img} loading="lazy" />
        ) : (
          <div className={styles.imgPlaceholder} />
        )}
      </div>
      <div
        className={`${styles.content} ${clickable ? styles.contentClickable : ''}`}
        onClick={clickable ? handleCardClick : undefined}
        role={clickable ? 'button' : undefined}
      >
        <p className={styles.type}>{stop.category === 'restaurant' ? 'Restaurant' : 'Hôtel'}</p>
        <p className={styles.name}>{stop.name}</p>
        {stop.city && <p className={styles.city}>{stop.city}</p>}
        <DistinctionBadge slug={stop.distinction_slug} />
      </div>
      <button
        className={`${styles.addBtn} ${isSelected ? styles.addBtnSelected : ''}`}
        onClick={() => !isSelected && onAdd(stop)}
        type="button"
        aria-label={isSelected ? 'Déjà ajouté' : `Ajouter ${stop.name}`}
      >
        {isSelected ? '✓' : '+'}
      </button>
    </article>
  )
}
