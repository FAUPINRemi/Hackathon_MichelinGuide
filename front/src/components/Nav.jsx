import styles from './Nav.module.css'

/* Mobile header — white bg, back or burger, title, actions */
export default function Nav({ title, onBack, showBack = false }) {
  return (
    <>
      {/* ── Desktop red bar ── */}
      <header className={styles.desktop}>
        <div className={styles.desktopInner}>
          <a href="#" className={styles.desktopLogo}>
            <span className={styles.logoM}>MICHELIN</span>
            <span className={styles.logoG}>GUIDE</span>
          </a>
          <nav className={styles.desktopLinks}>
            {['Restaurants', 'Hébergements', 'Guide de voyage', 'Régions', 'Magazine'].map((l) => (
              <a key={l} className={styles.desktopLink} href="#">{l}</a>
            ))}
          </nav>
          <div className={styles.desktopActions}>
            <button className={styles.desktopIconBtn} aria-label="Rechercher">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button className={styles.desktopIconBtn} aria-label="Mon compte">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile bar ── */}
      <header className={styles.mobile}>
        <div className={styles.mobileLeft}>
          {showBack ? (
            <button className={styles.backBtn} onClick={onBack} aria-label="Retour">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
          ) : (
            <div className={styles.placeholder} />
          )}
        </div>

        <span className={styles.mobileTitle}>{title || 'Restaurants'}</span>

        <div className={styles.mobileRight}>
          {showBack && (
            <>
              <button className={styles.mobileIconBtn} aria-label="Carte">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/>
                  <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
              </button>
              <button className={styles.mobileIconBtn} aria-label="Partager">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
                </svg>
              </button>
            </>
          )}
          {!showBack && (
            <button className={styles.mobileIconBtn} aria-label="Aide">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
          )}
        </div>
      </header>
    </>
  )
}
