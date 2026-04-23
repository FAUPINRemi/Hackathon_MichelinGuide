import styles from './LegalPage.module.css'

export default function LegalPage({ title, onBack, children }) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Retour">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.prose}>
        {children}
      </div>
    </div>
  )
}
