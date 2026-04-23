import styles from './ListCard.module.css'

function HeartIcon({ size = 22 }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 22 20" fill="none" aria-hidden="true">
      <path d="M0 6.357C0 10.881 3.954 15.327 9.917 19.189c.194.12.466.246.664.246.198 0 .47-.125.668-.246C17.208 15.327 21.162 10.881 21.162 6.357 21.162 2.64 18.604 0 15.183 0c-1.962 0-3.668 1.006-4.602 2.563C9.661 1.013 7.941 0 5.979 0 2.558 0 0 2.64 0 6.357Z" stroke="#ccc" strokeWidth="1.2" fill="none"/>
    </svg>
  )
}

export default function ListCard({ list, listItems, onClick }) {
  const count = listItems.length
  const previewImg = count > 0 ? listItems[0].data?.img : null

  return (
    <button className={styles.listCard} onClick={onClick}>
      <div className={styles.listCardThumb}>
        {previewImg ? (
          <img src={previewImg} alt="" className={styles.listCardImg} />
        ) : (
          <div className={styles.listCardEmpty}>
            <HeartIcon size={28} />
            <span className={styles.listCardEmptyText}>Cette liste est vide.</span>
          </div>
        )}
        {count > 0 && <span className={styles.listCardCount}>{count}</span>}
      </div>
      <div className={styles.listCardLabel}>{list.name}</div>
    </button>
  )
}
