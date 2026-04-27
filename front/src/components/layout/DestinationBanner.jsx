import styles from './DestinationBanner.module.css'

export default function DestinationBanner({ title, cta = 'Explorer la ville', img }) {
  return (
    <div className={styles.banner}>
      <img className={styles.img} src={img} alt={title} loading="lazy" />
      <div className={styles.content}>
        <h2 className={styles.title} dangerouslySetInnerHTML={{ __html: title }} />
        <a href="#" className={styles.cta}>{cta}</a>
      </div>
    </div>
  )
}
