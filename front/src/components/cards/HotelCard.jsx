import styles from './HotelCard.module.css'

export default function HotelCard({ hotel, onClick, layout = 'grid', onSave, isSaved = false }) {
  const { name, location, img, distinction, distinction_score, numRooms } = hotel

  const hasDistinction = distinction_score > 0

  const handleSave = (e) => {
    e.stopPropagation()
    onSave?.(hotel, 'hotel')
  }

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
          className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
          onClick={handleSave}
          aria-label={isSaved ? 'Retirer' : 'Sauvegarder'}
        >
          <svg width="16" height="15" viewBox="0 0 22 20" fill={isSaved ? '#c41230' : 'none'} xmlns="http://www.w3.org/2000/svg">
            <path d="M0 6.357C0 10.881 3.95401 15.327 9.91701 19.189C10.111 19.309 10.383 19.435 10.581 19.435C10.779 19.435 11.051 19.31 11.249 19.189C17.208 15.327 21.162 10.881 21.162 6.357C21.162 2.64 18.604 0 15.183 0C13.221 0 11.515 1.006 10.581 2.563C9.66099 1.013 7.941 0 5.979 0C2.558 0 0 2.64 0 6.357ZM1.34399 6.357C1.34399 3.37 3.306 1.341 5.964 1.341C7.978 1.341 9.235 2.591 9.974 3.835C10.206 4.192 10.361 4.298 10.581 4.298C10.801 4.298 10.941 4.185 11.185 3.835C11.965 2.606 13.188 1.341 15.198 1.341C17.855 1.341 19.818 3.371 19.818 6.357C19.818 10.427 15.57 14.73 10.775 17.924C10.687 17.987 10.625 18.031 10.581 18.031C10.537 18.031 10.475 17.987 10.394 17.924C5.592 14.73 1.34399 10.426 1.34399 6.357Z" fill={isSaved ? '#c41230' : '#767676'}/>
          </svg>
        </button>
        {hotel.isPlus && <span className={styles.plusBadge}>PLUS</span>}
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
