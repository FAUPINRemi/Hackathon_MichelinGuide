import styles from './EditorialCard.module.css'

export default function EditorialCard({ article }) {
  const { tag, title, img } = article
  return (
    <article className={styles.card}>
      <div className={styles.imgWrap}>
        <img className={styles.img} src={img} alt={title} loading="lazy" />
      </div>
      <div className={styles.body}>
        <p className={styles.tag}>{tag}</p>
        <h3 className={styles.title}>{title}</h3>
      </div>
    </article>
  )
}
