import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import SearchBar from '../components/filters/SearchBar'
import RestaurantCard from '../components/cards/RestaurantCard'
import ScrollSection from '../components/layout/ScrollSection'
import Footer from '../components/layout/Footer'
import { EDITORIAL } from '../data/restaurants'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import heroPng from '../assets/hero.png'
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

const REST_FILTERS = ['Tous', 'Jeune', '3 Étoiles', '2 Étoiles', '1 Étoile', 'Bib Gourmand', 'Étoile Verte']
const FILTER_PARAM = {
  'Tous': '', 'Jeune': 'budget', '3 Étoiles': '3-stars', '2 Étoiles': '2-stars',
  '1 Étoile': '1-star', 'Bib Gourmand': 'bib', 'Étoile Verte': 'green',
}

export default function RestaurantsTab({ onRestaurantClick, onSave, isAnySaved, onLegalPage }) {
  const [search, setSearch]                   = useState('')
  const [activeFilter, setActiveFilter]       = useState('Tous')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [mapRestaurants, setMapRestaurants]   = useState([])
  const [mapCenter, setMapCenter]             = useState(null)
  const [isMobile, setIsMobile]               = useState(() => !window.matchMedia('(min-width: 768px)').matches)
  const [parisRestaurants, setParisRestaurants] = useState([])
  const [travelRestaurants, setTravelRestaurants] = useState([])
  const [budgetRestaurants, setBudgetRestaurants] = useState([])

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

  // Budget/Jeune section
  useEffect(() => {
    api.restaurants.list({ filter: 'budget', limit: 16 })
      .then(res => setBudgetRestaurants(res.data ?? []))
      .catch(() => {})
  }, [])

  // Paris restaurants for the featured section
  useEffect(() => {
    api.restaurants.list({ search: 'Paris', limit: 12 })
      .then(res => setParisRestaurants(res.data ?? []))
      .catch(() => {})
  }, [])

  // Travel section: best restaurants, 1 per country
  useEffect(() => {
    api.restaurants.list({ limit: 200 })
      .then(res => {
        const byCountry = {}
        for (const r of (res.data ?? [])) {
          const key = r.country_code || r.country
          if (key && !byCountry[key]) byCountry[key] = r
        }
        setTravelRestaurants(Object.values(byCountry).slice(0, 14))
      })
      .catch(() => {})
  }, [])

  const [geoSearch, setGeoSearch] = useState('')
  useEffect(() => {
    if (search.length < 3) { setGeoSearch(''); return }
    const t = setTimeout(() => setGeoSearch(search), 900)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!geoSearch) { setMapCenter(null); return }
    let cancelled = false
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geoSearch)}&format=json&limit=1&featuretype=city`,
      { headers: { 'Accept-Language': 'fr' } }
    )
      .then((r) => r.json())
      .then((results) => {
        if (cancelled || !results[0]) return
        const lat = parseFloat(results[0].lat)
        const lng = parseFloat(results[0].lon)
        if (!isFinite(lat) || !isFinite(lng)) return
        setMapCenter({ lat, lng })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [geoSearch])

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

  const isHomepage = !debouncedSearch && activeFilter === 'Tous'

  return (
    <div className={styles.page}>

      {/* ── Mobile ── */}
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

      {/* ── Desktop ── */}
      <div className={styles.desktopOnly}>

        {/* Filter bar — sticky */}
        <div className={styles.filterBar}>
          <div className={styles.filterBarInner}>
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un restaurant, une ville, une cuisine…" />
            <div className={styles.filterPills}>
              {REST_FILTERS.map((f) => (
                <button
                  key={f}
                  className={[
                    styles.filterPill,
                    f === 'Jeune' ? styles.pillJeune : '',
                    activeFilter === f ? styles.pillActive : '',
                  ].join(' ')}
                  onClick={() => setActiveFilter(f)}
                >
                  {f === 'Jeune' && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: 4, flexShrink: 0}}>
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  )}
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Homepage sections */}
        {isHomepage && (
          <>
            {/* Hero */}
            <section className={styles.deskHero}>
              <img
                src={parisRestaurants.find(r => r.img)?.img || heroPng}
                className={styles.deskHeroBg}
                alt=""
              />
              <div className={styles.deskHeroOverlay} />
              <div className={styles.deskHeroContent}>
                <span className={styles.deskHeroBadge}>Ville phare · Paris</span>
                <h1 className={styles.deskHeroTitle}>L'art de la table,<br />à portée de main</h1>
                <p className={styles.deskHeroSub}>Restaurants étoilés, Bib Gourmand et tables d'exception</p>
              </div>
            </section>

            {/* Budget / Jeune section */}
            {budgetRestaurants.length > 0 && (
              <div className={`${styles.deskSection} ${styles.deskSectionBudget}`}>
                <div className={styles.deskSectionHead}>
                  <div>
                    <div className={styles.budgetBadge}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                      Sélection Jeune
                    </div>
                    <h2 className={styles.deskSectionTitle}>Bien manger sans se ruiner</h2>
                    <p className={styles.deskSectionSub}>Bib Gourmand &amp; tables €/€€ — le meilleur rapport qualité-prix selon MICHELIN</p>
                  </div>
                  <button
                    className={styles.deskSeeAll}
                    onClick={() => { setActiveFilter('Jeune'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  >
                    Tout voir
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.deskHScroll}>
                  {budgetRestaurants.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="scroll" onSave={onSave} isSaved={isAnySaved?.(r.id, 'restaurant')} />
                  ))}
                </div>
              </div>
            )}

            {/* Paris section */}
            {parisRestaurants.length > 0 && (
              <div className={styles.deskSection}>
                <div className={styles.deskSectionHead}>
                  <div>
                    <h2 className={styles.deskSectionTitle}>Restaurants populaires · Paris</h2>
                    <p className={styles.deskSectionSub}>Les meilleures tables de la capitale française</p>
                  </div>
                  <button className={styles.deskSeeAll} onClick={() => { setSearch('Paris'); setDebouncedSearch('Paris') }}>
                    Tout voir
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.deskHScroll}>
                  {parisRestaurants.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="scroll" onSave={onSave} isSaved={isAnySaved?.(r.id, 'restaurant')} />
                  ))}
                </div>
              </div>
            )}

            {/* Travel section */}
            {travelRestaurants.length > 0 && (
              <div className={styles.deskSection}>
                <div className={styles.deskSectionHead}>
                  <div>
                    <h2 className={styles.deskSectionTitle}>Voyage gastronomique</h2>
                    <p className={styles.deskSectionSub}>Une table d'exception par destination</p>
                  </div>
                </div>
                <div className={styles.deskHScroll}>
                  {travelRestaurants.map((r) => (
                    <div key={r.id} className={styles.travelCard} onClick={() => onRestaurantClick?.(r)}>
                      <div className={styles.travelImgWrap}>
                        {r.img
                          ? <img src={r.img} alt={r.name} className={styles.travelImg} loading="lazy" />
                          : <div className={styles.travelImgPlaceholder} />
                        }
                        <div className={styles.travelOverlay} />
                        <div className={styles.travelInfo}>
                          <p className={styles.travelCountry}>{r.country || r.location}</p>
                          <p className={styles.travelName}>{r.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New starred */}
            {!loading && newStarred.length > 0 && (
              <div className={styles.deskSection}>
                <div className={styles.deskSectionHead}>
                  <div>
                    <h2 className={styles.deskSectionTitle}>Les nouveaux étoilés 2026</h2>
                    <p className={styles.deskSectionSub}>Nouvelles distinctions 3 et 2 Étoiles</p>
                  </div>
                </div>
                <div className={styles.deskHScroll}>
                  {newStarred.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="scroll" onSave={onSave} isSaved={isAnySaved?.(r.id, 'restaurant')} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Results grid */}
        <div className={`${styles.desktopContent} ${isHomepage ? styles.desktopContentHome : ''}`}>
          {loading && <p className={styles.loadingMsg}>Chargement…</p>}
          {error   && <p className={styles.errorMsg}>Serveur non disponible</p>}
          {!loading && !error && (
            <>
              <div className={styles.resultsHeader}>
                <h2 className={styles.resultsTitle}>
                  {debouncedSearch
                    ? `${total} résultat${total > 1 ? 's' : ''} pour « ${debouncedSearch} »`
                    : activeFilter !== 'Tous'
                      ? `${total} restaurants · ${activeFilter}`
                      : 'Toute la sélection'
                  }
                </h2>
                <p className={styles.resultsCount}>{total} restaurants</p>
              </div>
              <div className={styles.grid}>
                {restaurants.map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="grid" onSave={onSave} isSaved={isAnySaved?.(r.id, 'restaurant')} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <SiteFooterLinks onDestinationClick={(dest) => { window.scrollTo({ top: 0, behavior: 'instant' }); setSearch(dest); setDebouncedSearch(dest) }} />
      <Footer onLegalPage={onLegalPage} />
    </div>
  )
}
