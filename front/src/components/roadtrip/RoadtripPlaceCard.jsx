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
      <div className={styles.distinctions}>
        <img src={bibsSvg} width={16} height={16} alt="Bib Gourmand" />
        <span className={styles.distLabel}>Bib Gourmand</span>
      </div>
    )
  }
  if (slug.includes('green')) {
    return (
      <div className={styles.distinctions}>
        <span className={styles.distLabel} style={{ color: 'var(--green)' }}>Étoile Verte</span>
      </div>
    )
  }
  const stars = getStarCount(slug)
  if (stars > 0) {
    return (
      <div className={styles.distinctions}>
        {Array.from({ length: stars }).map((_, i) => (
          <img key={i} src={etoileSvg} width={14} height={14} alt="" aria-hidden="true" />
        ))}
        <span className={styles.distLabel}>
          {stars === 1 ? '1 Étoile' : stars === 2 ? '2 Étoiles' : '3 Étoiles'}
        </span>
      </div>
    )
  }
  return null
}

export default function RoadtripPlaceCard({ stop, isHighlighted }) {
  const isResto = stop.category === 'restaurant'
  const hasImage = Boolean(stop.image)

  return (
    <article
      id={`stop-${stop.category}-${stop.id}`}
      className={`${styles.card} ${isHighlighted ? styles.highlighted : ''}`}
    >
      <div className={styles.imgWrap}>
        {hasImage ? (
          <img
            src={stop.image}
            alt={stop.name}
            className={styles.img}
            loading="lazy"
          />
        ) : (
          <div className={`${styles.imgPlaceholder} ${isResto ? styles.placeholderResto : styles.placeholderHotel}`} />
        )}
        <span className={`${styles.typeBadge} ${isResto ? styles.badgeRed : styles.badgeDark}`}>
          {isResto ? 'Restaurant' : 'Hôtel'}
        </span>
        {stop.detour_minutes != null && (
          <span className={styles.detourBadge}>+{stop.detour_minutes} min</span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.badgesRow}>
          <Distinction slug={stop.distinction_slug} />
          {stop.budget_symbol && (
            <span className={styles.budgetBadge}>{stop.budget_symbol}</span>
          )}
        </div>

        <h3 className={styles.name}>{stop.name}</h3>
        {stop.city && <p className={styles.city}>{stop.city}</p>}

        {stop.cuisines?.length > 0 && (
          <p className={styles.cuisines}>{stop.cuisines.join(' · ')}</p>
        )}

        {stop.reason && <p className={styles.reason}>{stop.reason}</p>}

        {stop.url && (
          <a
            href={stop.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Ouvrir la fiche
          </a>
        )}
      </div>
    </article>
  )
}
