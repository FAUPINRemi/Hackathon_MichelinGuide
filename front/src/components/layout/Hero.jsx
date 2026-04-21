import { useState } from 'react'
import styles from './Hero.module.css'

const TABS = ['Restaurants', 'Hôtels', 'Itinéraires']

export default function Hero({ onSearch }) {
  const [activeTab, setActiveTab] = useState(0)
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = () => {
    onSearch?.({ query, location, tab: TABS[activeTab] })
  }

  const handleGeo = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
      () => {}
    )
  }

  return (
    <section className={styles.hero}>
      <div className={styles.bg} />
      <div className={styles.imgOverlay} />
      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <span className={styles.line} />
          <span className={styles.eyebrowText}>Depuis 1900</span>
          <span className={styles.line} />
        </div>
        <h1 className={styles.title}>
          L'excellence<br /><em>gastronomique</em><br />à portée de main
        </h1>
        <p className={styles.subtitle}>
          Restaurants étoilés, Bib Gourmand, hôtels d'exception…
        </p>

        <div className={styles.searchBox}>
          <div className={styles.tabs}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === i ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <span className={styles.fieldIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                className={styles.input}
                type="text"
                placeholder="Ville, restaurant, cuisine..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <input
                className={styles.input}
                type="text"
                placeholder="Où ?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <button className={styles.geoBtn} onClick={handleGeo} aria-label="Ma position">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              </button>
            </div>
          </div>

          <button className={styles.submit} onClick={handleSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Rechercher
          </button>
        </div>
      </div>
    </section>
  )
}
