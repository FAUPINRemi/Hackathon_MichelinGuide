import etoileSvg from '../../assets/svg/etoile_michelin.svg'
import styles from './FavoriteItemCard.module.css'

export default function FavoriteItemCard({ entry, note, onRemove, onNoteOpen, onItemClick }) {
  const { data, type } = entry
  const isRestaurant = type === 'restaurant'

  const stars = isRestaurant ? (data.stars ?? 0) : 0
  const label = isRestaurant
    ? [data.price, data.cuisine].filter(Boolean).join(' · ')
    : [data.location, data.numRooms ? `${data.numRooms} chambres` : ''].filter(Boolean).join(' · ')

  return (
    <div className={styles.itemCard}>
      <button className={styles.itemCardTop} onClick={() => onItemClick?.(data, type)} aria-label={`Voir ${data.name}`}>
        <div className={styles.itemCardInfo}>
          {isRestaurant && stars > 0 && (
            <div className={styles.itemStars}>
              {Array.from({ length: stars }).map((_, i) => (
                <img key={i} src={etoileSvg} width={14} height={14} alt="" aria-hidden="true" />
              ))}
            </div>
          )}
          {!isRestaurant && (
            <p className={styles.itemType}>Hébergement MICHELIN</p>
          )}
          <h3 className={styles.itemName}>{data.name}</h3>
          <p className={styles.itemMeta}>{data.location}</p>
          {label ? <p className={styles.itemSub}>{label}</p> : null}
          {note && <p className={styles.notePreview}>📝 {note}</p>}
        </div>
        {data.img ? (
          <img src={data.img} alt={data.name} className={styles.itemThumb} />
        ) : (
          <div className={styles.itemThumbPlaceholder} />
        )}
      </button>

      <div className={styles.itemCardActions}>
        <button className={`${styles.actionBtn} ${note ? styles.actionActive : ''}`} onClick={e => { e.stopPropagation(); onNoteOpen?.() }} aria-label="Note personnelle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={note ? '#1a1a1a' : '#aaa'} strokeWidth="1.5" strokeLinecap="round">
            <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className={styles.actionBtn} aria-label="Déjà visité" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12l3 3 5-5"/>
          </svg>
        </button>
        <button className={styles.actionBtn} onClick={e => { e.stopPropagation(); onRemove?.() }} aria-label="Retirer des favoris">
          <svg width="18" height="16" viewBox="0 0 22 20" fill="#c41230" aria-hidden="true">
            <path d="M0 6.357C0 10.881 3.954 15.327 9.917 19.189c.194.12.466.246.664.246.198 0 .47-.125.668-.246C17.208 15.327 21.162 10.881 21.162 6.357 21.162 2.64 18.604 0 15.183 0c-1.962 0-3.668 1.006-4.602 2.563C9.661 1.013 7.941 0 5.979 0 2.558 0 0 2.64 0 6.357Z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
