import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import SearchBar from '../components/filters/SearchBar'
import RestaurantCard from '../components/cards/RestaurantCard'
import HotelCard from '../components/cards/HotelCard'
import { EDITORIAL } from '../data/restaurants'
import { api } from '../api/client'
import styles from './HomePage.module.css'

const RestaurantMap = lazy(() => import('../components/map/RestaurantMap'))

const REST_FILTERS = ['Tous', '3 Étoiles', '2 Étoiles', '1 Étoile', 'Bib Gourmand', 'Étoile Verte']
const FILTER_PARAM = {
  'Tous': '', '3 Étoiles': '3-stars', '2 Étoiles': '2-stars',
  '1 Étoile': '1-star', 'Bib Gourmand': 'bib', 'Étoile Verte': 'green',
}

function useApiData(fetcher, deps) {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((res) => {
        if (cancelled) return
        setData(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, total, loading, error }
}

// ─── Restaurants tab ─────────────────────────────────────────────────────────
function RestaurantsTab({ onRestaurantClick }) {
  const [search, setSearch]           = useState('')
  const [activeFilter, setActiveFilter] = useState('Tous')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [mapRestaurants, setMapRestaurants] = useState([])
  const [mapCenter, setMapCenter]           = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Géocode la recherche → met à jour le centre carte
  useEffect(() => {
    if (!debouncedSearch) {
      setMapCenter(null)
      return
    }
    let cancelled = false
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedSearch)}&format=json&limit=1&countrycodes=fr,be,ch,lu`,
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

  // Fetch les restaurants de la zone carte (change selon mapCenter)
  useEffect(() => {
    let cancelled = false
    if (mapCenter) {
      // Zone géographique : tous les restaurants dans un rayon de 50 km
      api.restaurants.list({ lat: mapCenter.lat, lng: mapCenter.lng, radius: 50, limit: 200 })
        .then((res) => { if (!cancelled) setMapRestaurants(res.data ?? []) })
        .catch(() => {})
    } else {
      // Pas de recherche active : mix étoilés + bibs pour avoir les 3 types de pins
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

      {/* ── MOBILE ── */}
      <div className={styles.mobileOnly}>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Restaurants</h1>
          <SearchBar value={search} onChange={setSearch} />
        </div>

        <section className={styles.mapSection}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Autour de moi</h2>
            <a href="#" className={styles.seeAll}>Tout Voir</a>
          </div>
          <div className={styles.mapWrap}>
            <Suspense fallback={<div className={styles.mapFrame} />}>
              <RestaurantMap
                restaurants={mapRestaurants}
                onRestaurantClick={onRestaurantClick}
                center={mapCenter}
              />
            </Suspense>
          </div>
        </section>

        {loading && <p className={styles.loadingMsg}>Chargement…</p>}
        {error   && <p className={styles.errorMsg}>Serveur non disponible</p>}

        {!loading && newStarred.length > 0 && (
          <section className={styles.scrollSection}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>Les nouveaux 3 &amp; 2 Étoiles</h2>
                <p className={styles.sectionSub}>Guide MICHELIN 2026</p>
              </div>
            </div>
            <div className={styles.hscroll}>
              {newStarred.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="scroll" />
              ))}
            </div>
          </section>
        )}

        {!loading && starred3.length > 0 && (
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
        )}

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

      {/* ── DESKTOP ── */}
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
          {error   && <p className={styles.errorMsg}>Serveur non disponible — lancez le backend.</p>}
          {!loading && !error && (
            <p className={styles.resultsCount}>{total} restaurants</p>
          )}
          <div className={styles.grid}>
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={onRestaurantClick} layout="grid" />
            ))}
          </div>

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

// ─── Hotels tab ──────────────────────────────────────────────────────────────
function HotelsTab({ onHotelClick }) {
  const [search, setSearch]           = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchAll = useCallback(() =>
    api.hotels.list({ search: debouncedSearch, limit: 60 }),
    [debouncedSearch]
  )

  const { data: hotels, total, loading, error } = useApiData(fetchAll, [debouncedSearch])

  const plusHotels = hotels.filter((h) => h.isPlus)
  const ecoHotels  = hotels.filter((h) => h.sustainableHotel)

  return (
    <div className={styles.page}>

      {/* ── MOBILE ── */}
      <div className={styles.mobileOnly}>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Hébergements</h1>
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {loading && <p className={styles.loadingMsg}>Chargement…</p>}
        {error   && <p className={styles.errorMsg}>Serveur non disponible</p>}

        {!loading && hotels.length > 0 && (
          <>
            <section className={styles.scrollSection}>
              <div className={styles.sectionHead}>
                <div>
                  <h2 className={styles.sectionTitle}>Sélection MICHELIN</h2>
                  <p className={styles.sectionSub}>Les meilleures adresses</p>
                </div>
              </div>
              <div className={styles.hscroll}>
                {hotels.slice(0, 10).map((h) => (
                  <HotelCard key={h.id} hotel={h} onClick={onHotelClick} layout="scroll" />
                ))}
              </div>
            </section>

            {plusHotels.length > 0 && (
              <section className={styles.scrollSection}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>MICHELIN Plus</h2>
                  <a href="#" className={styles.seeAll}>Tout Voir</a>
                </div>
                <div className={styles.hscroll}>
                  {plusHotels.map((h) => (
                    <HotelCard key={h.id} hotel={h} onClick={onHotelClick} layout="scroll" />
                  ))}
                </div>
              </section>
            )}

            {ecoHotels.length > 0 && (
              <section className={styles.scrollSection}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>🌿 Éco-responsables</h2>
                </div>
                <div className={styles.hscroll}>
                  {ecoHotels.map((h) => (
                    <HotelCard key={h.id} hotel={h} onClick={onHotelClick} layout="scroll" />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {!loading && !error && hotels.length === 0 && (
          <div className={styles.emptyState}>
            <p>Aucun hébergement trouvé.</p>
            <p className={styles.emptyHint}>Importez les données avec :<br /><code>docker compose --profile import up importer</code></p>
          </div>
        )}
      </div>

      {/* ── DESKTOP ── */}
      <div className={styles.desktopOnly}>
        <div className={styles.filterBar}>
          <div className={styles.filterBarInner}>
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un hôtel, une ville…" />
          </div>
        </div>

        <div className={styles.desktopContent}>
          {loading && <p className={styles.loadingMsg}>Chargement…</p>}
          {error   && <p className={styles.errorMsg}>Serveur non disponible — lancez le backend.</p>}
          {!loading && !error && (
            <p className={styles.resultsCount}>{total} hébergements</p>
          )}
          <div className={styles.grid}>
            {hotels.map((h) => (
              <HotelCard key={h.id} hotel={h} onClick={onHotelClick} layout="grid" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function HomePage({ activeTab, onRestaurantClick, onHotelClick }) {
  if (activeTab === 'hotels') {
    return <HotelsTab onHotelClick={onHotelClick} />
  }
  return <RestaurantsTab onRestaurantClick={onRestaurantClick} />
}
