import { useState } from 'react'
import SearchBar from '../components/SearchBar'
import RestaurantCard from '../components/RestaurantCard'
import { MichelinFlower } from '../components/MichelinIcon'
import { RESTAURANTS, EDITORIAL } from '../data/restaurants'
import styles from './HomePage.module.css'

const FILTERS = ['Tous', '3 Étoiles', '2 Étoiles', '1 Étoile', 'Bib Gourmand', 'Étoile Verte']

export default function HomePage({ onRestaurantClick }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('Tous')

  const filtered = RESTAURANTS.filter((r) => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisine.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      activeFilter === 'Tous' ||
      (activeFilter === '3 Étoiles' && r.stars === 3) ||
      (activeFilter === '2 Étoiles' && r.stars === 2) ||
      (activeFilter === '1 Étoile' && r.stars === 1) ||
      (activeFilter === 'Bib Gourmand' && r.bib)
    return matchSearch && matchFilter
  })

  const starred3 = RESTAURANTS.filter((r) => r.stars === 3)
  const newStarred = RESTAURANTS.filter((r) => r.stars >= 2)

  return (
    <div className={styles.page}>

      {/* ── MOBILE layout ── */}
      <div className={styles.mobileOnly}>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Restaurants</h1>
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Autour de moi */}
        <section className={styles.mapSection}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Autour de moi</h2>
            <a href="#" className={styles.seeAll}>Tout Voir</a>
          </div>
          <div className={styles.mapWrap}>
            <iframe
              title="Carte des restaurants"
              src="https://www.openstreetmap.org/export/embed.html?bbox=2.28%2C48.83%2C2.42%2C48.90&layer=mapnik&marker=48.8566%2C2.3522"
              className={styles.mapFrame}
              loading="lazy"
            />
            {/* Michelin-style pins overlay (decorative) */}
            <div className={styles.mapPins}>
              {[
                { top: '38%', left: '52%' }, { top: '55%', left: '35%' },
                { top: '30%', left: '68%' }, { top: '65%', left: '60%' },
                { top: '20%', left: '45%' },
              ].map((pos, i) => (
                <div key={i} className={styles.mapPin} style={pos}>
                  <MichelinFlower size={20} color="#c41230" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nouveaux étoilés — horizontal scroll */}
        <section className={styles.scrollSection}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Les nouveaux 3 &amp; 2 Étoiles</h2>
              <p className={styles.sectionSub}>France 2026</p>
            </div>
          </div>
          <div className={styles.hscroll}>
            {newStarred.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="scroll" />
            ))}
          </div>
        </section>

        {/* 3 étoiles — horizontal scroll */}
        <section className={styles.scrollSection}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>3 Étoiles MICHELIN</h2>
            <a href="#" className={styles.seeAll}>Tout Voir</a>
          </div>
          <div className={styles.hscroll}>
            {starred3.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="scroll" />
            ))}
          </div>
        </section>

        {/* Magazine */}
        <section className={styles.scrollSection}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Magazine</h2>
            <a href="#" className={styles.seeAll}>Tout Voir</a>
          </div>
          <div className={styles.hscroll}>
            {EDITORIAL.map((a) => (
              <article key={a.id} className={styles.editCard}>
                <div className={styles.editImgWrap}>
                  <img src={a.img} alt={a.title} loading="lazy" className={styles.editImg} />
                </div>
                <div className={styles.editBody}>
                  <p className={styles.editTag}>{a.tag}</p>
                  <h3 className={styles.editTitle}>{a.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className={styles.desktopOnly}>
        {/* Filter bar */}
        <div className={styles.filterBar}>
          <div className={styles.filterBarInner}>
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un restaurant, une ville..." />
            <div className={styles.filterPills}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={`${styles.filterPill} ${activeFilter === f ? styles.pillActive : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.desktopContent}>
          <p className={styles.resultsCount}>
            {filtered.length} sur {RESTAURANTS.length} restaurants
          </p>
          <div className={styles.grid}>
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="grid" />
            ))}
          </div>

          {/* Footer promo */}
          <div className={styles.footerPromo}>
            <h2>À la découverte des expériences du Guide MICHELIN</h2>
            <div className={styles.promoLinks}>
              {['Paris', 'Lyon', 'Bordeaux', 'Marseille', 'Strasbourg', 'Nice', 'Toulouse', 'Nantes', 'Montpellier', 'Lille'].map((c) => (
                <a key={c} href="#" className={styles.promoLink}>{c}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
