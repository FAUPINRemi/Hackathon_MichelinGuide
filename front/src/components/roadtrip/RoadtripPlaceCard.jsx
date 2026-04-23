import { useState } from 'react'
import { api } from '../../api/client'
import etoileSvg from '../../assets/svg/etoile_michelin.svg'
import bibsSvg from '../../assets/svg/bibs.svg'
import styles from './RoadtripPlaceCard.module.css'

function getStarCount(slug) {
  if (!slug) return 0
  if (slug.includes('3-stars')) return 3
  if (slug.includes('2-stars')) return 2
  if (slug.includes('1-star')) return 1
  return 0
}

function Distinction({ slug }) {
  if (!slug) return null
  if (slug === 'bib-gourmand') {
    return (
      <span className={styles.dist}>
        <img src={bibsSvg} width={13} height={13} alt="Bib Gourmand" />
        Bib Gourmand
      </span>
    )
  }
  if (slug.includes('green')) {
    return <span className={styles.dist} style={{ color: 'var(--green)' }}>Étoile Verte</span>
  }
  const stars = getStarCount(slug)
  if (stars > 0) {
    return (
      <span className={styles.dist}>
        {Array.from({ length: stars }).map((_, i) => (
          <img key={i} src={etoileSvg} width={12} height={12} alt="" aria-hidden="true" />
        ))}
        {stars === 1 ? '1 Étoile' : stars === 2 ? '2 Étoiles' : '3 Étoiles'}
      </span>
    )
  }
  return null
}

export default function RoadtripPlaceCard({ stop, isHighlighted, onRestaurantClick, onHotelClick, onRemove }) {
  const isResto = stop.category === 'restaurant'
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
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

  const clickable = Boolean((isResto && onRestaurantClick) || (!isResto && onHotelClick))

  return (
    <article
      id={`stop-${stop.category}-${stop.id}`}
      className={`${styles.card} ${isHighlighted ? styles.highlighted : ''} ${clickable ? styles.clickable : ''} ${loading ? styles.cardLoading : ''}`}
      onClick={clickable ? handleClick : undefined}
      role={clickable ? 'button' : undefined}
    >
      <div className={`${styles.imgCol} ${isResto ? styles.imgResto : styles.imgHotel}`}>
        {stop.image ? (
          <img src={stop.image} alt={stop.name} className={styles.img} loading="lazy" />
        ) : (
          <div className={styles.imgPlaceholder} />
        )}
        <span className={`${styles.typeBadge} ${isResto ? styles.badgeRed : styles.badgeDark}`}>
          {isResto ? 'Resto' : 'Hôtel'}
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.topRow}>
          <h3 className={styles.name}>{stop.name}</h3>
          <div className={styles.topActions}>
            {stop.detour_minutes != null && (
              <span className={styles.detourBadge}>+{stop.detour_minutes} min</span>
            )}
            {onRemove && (
              <button
                className={styles.removeBtn}
                onClick={(e) => { e.stopPropagation(); onRemove(stop.category, stop.id) }}
                aria-label={`Retirer ${stop.name}`}
                type="button"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {stop.city && <p className={styles.city}>{stop.city}</p>}

        <div className={styles.metaRow}>
          <Distinction slug={stop.distinction_slug} />
          {stop.budget_symbol && <span className={styles.budget}>{stop.budget_symbol}</span>}
        </div>

        {stop.cuisines?.length > 0 && (
          <p className={styles.cuisines}>{stop.cuisines.slice(0, 2).join(' · ')}</p>
        )}

        {stop.reason && <p className={styles.reason}>{stop.reason}</p>}

        {clickable && <span className={styles.seeMore}>Voir la fiche →</span>}
      </div>
    </article>
  )
}
