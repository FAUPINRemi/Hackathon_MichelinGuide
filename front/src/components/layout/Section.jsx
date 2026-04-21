import styles from './Section.module.css'

export default function Section({ label, title, linkText = 'Tout voir →', dark = false, grey = false, children }) {
  const cls = [styles.section, dark && styles.dark, grey && styles.grey].filter(Boolean).join(' ')
  return (
    <section className={cls}>
      <div className={styles.head}>
        <div>
          {label && <p className={styles.label}>{label}</p>}
          <h2 className={styles.title}>{title}</h2>
        </div>
        {linkText && <a href="#" className={styles.link}>{linkText}</a>}
      </div>
      {children}
    </section>
  )
}
