import styles from './ScrollSection.module.css'

export default function ScrollSection({ title, subtitle, seeAllHref, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.sub}>{subtitle}</p>}
        </div>
        {seeAllHref && <a href={seeAllHref} className={styles.seeAll}>Tout Voir</a>}
      </div>
      <div className={styles.hscroll}>
        {children}
      </div>
    </section>
  )
}
