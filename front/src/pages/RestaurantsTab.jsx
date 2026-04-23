import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import SearchBar from '../components/filters/SearchBar'
import RestaurantCard from '../components/cards/RestaurantCard'
import ScrollSection from '../components/layout/ScrollSection'
import Footer from '../components/layout/Footer'
import { EDITORIAL } from '../data/restaurants'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import styles from './HomeTabs.module.css'

const RestaurantMap = lazy(() => import('../components/map/RestaurantMap'))

const DESTINATIONS = [
  'Abu Dhabi', 'Allemagne', 'Arabie Saoudite', 'Argentine', 'Autriche', 'Belgique',
  'Brésil', 'Canada', 'Chine Continentale', 'Corée du Sud', 'Croatie', 'Danemark',
  'Dubai', 'Espagne', 'Estonie', 'Etats-Unis', 'Finlande', 'France', 'Grèce',
  'Hong Kong RAS', 'Hongrie', 'Irlande', 'Islande', 'Italie', 'Japon',
  'Les Philippines', 'Lettonie', 'Lituanie', 'Luxembourg', 'Macao RAS', 'Malaisie',
  'Malte', 'Mexique', 'Norvège', 'Pays-Bas', 'Pologne', 'Portugal', 'Qatar',
  'Région de Taïwan', 'République Tchèque', 'Royaume-Uni', 'Serbie', 'Singapour',
  'Slovénie', 'Suède', 'Suisse', 'Thaïlande', 'Turquie', 'Vietnam',
]

const GUIDE_LINKS = [
  'À propos du Guide', 'Restaurants', 'Hébergements',
  'Partenariat privilégié TheFork', 'Les partenaires',
  'Contactez-nous', 'Laisser un avis', 'Guide MICHELIN Plus',
]

const GROUPE_LINKS = [
  "L'entreprise MICHELIN", 'Les pneus MICHELIN', 'ViaMichelin',
]

function SiteFooterLinks({ onDestinationClick }) {
  return (
    <div className={styles.siteFooter}>
      <div className={styles.siteFooterGrid}>
        <div className={styles.siteFooterCol}>
          <p className={styles.siteFooterTitle}>Guide MICHELIN</p>
          {GUIDE_LINKS.map(l => (
            <a key={l} href="#" className={styles.siteFooterLink}>{l}</a>
          ))}
          <p className={`${styles.siteFooterTitle} ${styles.siteFooterTitleGap}`}>Le groupe MICHELIN</p>
          {GROUPE_LINKS.map(l => (
            <a key={l} href="#" className={styles.siteFooterLink}>{l}</a>
          ))}
        </div>

        <div className={styles.siteFooterDestinations}>
          <p className={styles.siteFooterTitle}>Sélections du Guide MICHELIN</p>
          <div className={styles.destinationsGrid}>
            {DESTINATIONS.map(d => (
              <button key={d} className={styles.destinationLink} onClick={() => onDestinationClick(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const REST_FILTERS = ['Tous', '3 Étoiles', '2 Étoiles', '1 Étoile', 'Bib Gourmand', 'Étoile Verte']
const FILTER_PARAM = {
  'Tous': '', '3 Étoiles': '3-stars', '2 Étoiles': '2-stars',
  '1 Étoile': '1-star', 'Bib Gourmand': 'bib', 'Étoile Verte': 'green',
}

export default function RestaurantsTab({ onRestaurantClick, onSave, isAnySaved, onLegalPage }) {
  const [search, setSearch]                   = useState('')
  const [activeFilter, setActiveFilter]       = useState('Tous')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [mapRestaurants, setMapRestaurants]   = useState([])
  const [mapCenter, setMapCenter]             = useState(null)
  const [isMobile, setIsMobile]               = useState(() => !window.matchMedia('(min-width: 768px)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e) => setIsMobile(!e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!debouncedSearch) { setMapCenter(null); return }
    let cancelled = false
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedSearch)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'fr' } }
    )
      .then((r) => r.json())
      .then((results) => {
        if (cancelled || !results[0]) return
        setMapCenter({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false
    if (mapCenter) {
      api.restaurants.list({ lat: mapCenter.lat, lng: mapCenter.lng, radius: 50, limit: 200 })
        .then((res) => { if (!cancelled) setMapRestaurants(res.data ?? []) })
        .catch(() => {})
    } else {
      Promise.all([
        api.restaurants.list({ limit: 50 }),
        api.restaurants.list({ filter: 'bib', limit: 50 }),
      ]).then(([res1, res2]) => {
        if (cancelled) return
        const seen = new Set()
        setMapRestaurants(
          [...res1.data, ...res2.data].filter((r) => {
            if (!r.lat || !r.lng || seen.has(r.id)) return false
            seen.add(r.id)
            return true
          })
        )
      }).catch(() => {})
    }
    return () => { cancelled = true }
  }, [mapCenter])

  const fetchAll = useCallback(() =>
    api.restaurants.list({ search: debouncedSearch, filter: FILTER_PARAM[activeFilter], limit: 60 }),
    [debouncedSearch, activeFilter]
  )

  const { data: restaurants, total, loading, error } = useApiData(fetchAll, [debouncedSearch, activeFilter])

  const starred3   = restaurants.filter((r) => r.stars === 3)
  const newStarred = restaurants.filter((r) => r.stars >= 2)

  return (
    <div className={styles.page}>

      <div className={styles.mobileOnly}>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Restaurants</h1>
          <SearchBar value={search} onChange={setSearch} />
        </div>

        <section className={styles.mapSection}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{debouncedSearch ? debouncedSearch : 'Autour de moi'}</h2>
            <a href="#" className={styles.seeAll}>Tout Voir</a>
          </div>
          <div className={styles.mapWrap}>
            {isMobile && (
              <Suspense fallback={<div className={styles.mapFrame} />}>
                <RestaurantMap
                  restaurants={mapRestaurants}
                  onRestaurantClick={onRestaurantClick}
                  center={mapCenter}
                />
              </Suspense>
            )}
          </div>
        </section>

        {loading && <p className={styles.loadingMsg}>Chargement…</p>}
        {error   && <p className={styles.errorMsg}>Serveur non disponible</p>}

        {!loading && debouncedSearch && restaurants.length > 0 && (
          <ScrollSection title={`Résultats · ${restaurants.length} restaurant${restaurants.length > 1 ? 's' : ''}`}>
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="scroll" onSave={onSave} isSaved={isAnySaved?.(r.id, 'restaurant')} />
            ))}
          </ScrollSection>
        )}

        {!loading && debouncedSearch && restaurants.length === 0 && (
          <p className={styles.emptyState}>Aucun restaurant trouvé pour « {debouncedSearch} »</p>
        )}

        {!loading && !debouncedSearch && newStarred.length > 0 && (
          <ScrollSection title="Les nouveaux 3 &amp; 2 Étoiles" subtitle="Guide MICHELIN 2026">
            {newStarred.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="scroll" onSave={onSave} isSaved={isAnySaved?.(r.id, 'restaurant')} />
            ))}
          </ScrollSection>
        )}

        {!loading && !debouncedSearch && starred3.length > 0 && (
          <ScrollSection title="3 Étoiles MICHELIN" seeAllHref="#">
            {starred3.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="scroll" onSave={onSave} isSaved={isAnySaved?.(r.id, 'restaurant')} />
            ))}
          </ScrollSection>
        )}

        {!debouncedSearch && (
          <ScrollSection title="Magazine" seeAllHref="#">
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
          </ScrollSection>
        )}
      </div>

      <div className={styles.desktopOnly}>
        <div className={styles.filterBar}>
          <div className={styles.filterBarInner}>
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un restaurant, une ville…" />
            <div className={styles.filterPills}>
              {REST_FILTERS.map((f) => (
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
          {loading && <p className={styles.loadingMsg}>Chargement…</p>}
          {error   && <p className={styles.errorMsg}>Serveur non disponible</p>}
          {!loading && !error && (
            <p className={styles.resultsCount}>{total} restaurants</p>
          )}
          <div className={styles.grid}>
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="grid" onSave={onSave} isSaved={isAnySaved?.(r.id, 'restaurant')} />
            ))}
          </div>

        </div>
      </div>

      <SiteFooterLinks onDestinationClick={(dest) => { window.scrollTo({ top: 0, behavior: 'instant' }); setSearch(dest); setDebouncedSearch(dest) }} />
      <Footer onLegalPage={onLegalPage} />
    </div>
  )
}
