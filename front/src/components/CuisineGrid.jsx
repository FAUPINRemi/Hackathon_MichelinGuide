import styles from './CuisineGrid.module.css'

export default function CuisineGrid({ cuisines }) {
  return (
    <div className={styles.grid}>
      {cuisines.map(({ label, img }) => (
        <a key={label} href="#" className={styles.tile}>
          <img className={styles.img} src={img} alt={label} loading="lazy" />
          <span className={styles.label}>{label}</span>
        </a>
      ))}
    </div>
  )
}
