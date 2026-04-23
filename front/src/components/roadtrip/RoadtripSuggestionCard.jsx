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

export default function RoadtripSuggestionCard({ stop, onAdd, isSelected }) {
  return (
    <article className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}>
      {stop.image ? (
        <img src={stop.image} alt={stop.name} className={styles.img} loading="lazy" />
      ) : (
        <div className={styles.imgPlaceholder} />
      )}
      <div className={styles.content}>
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
