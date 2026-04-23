import { useState, useEffect } from 'react'
import { api } from '../api/client'
import styles from './CollectionPage.module.css'

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  )
}

function ProgressBar({ visited, total }) {
  const pct = total > 0 ? Math.round((visited / total) * 100) : 0
  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.progressLabel}>{visited}/{total}</span>
    </div>
  )
}

function Card({ name, visited, total, onClick }) {
  return (
    <button className={styles.card} onClick={onClick}>
      <span className={styles.cardName}>{name}</span>
      <ProgressBar visited={visited} total={total} />
    </button>
  )
}

const SORT_OPTIONS = [
  { value: 'default',      label: 'Par défaut' },
  { value: 'visited-desc', label: 'Plus visités (nb)' },
  { value: 'visited-asc',  label: 'Moins visités (nb)' },
  { value: 'pct-desc',     label: 'Plus visités (%)' },
  { value: 'pct-asc',      label: 'Moins visités (%)' },
]

function pct(item) {
  return item.total > 0 ? item.visited / item.total : 0
}

function applySortToItems(items, sort) {
  const s = [...items]
  switch (sort) {
    case 'visited-desc': return s.sort((a, b) => b.visited - a.visited || b.total - a.total)
    case 'visited-asc':  return s.sort((a, b) => a.visited - b.visited || a.total - b.total)
    case 'pct-desc':     return s.sort((a, b) => pct(b) - pct(a) || b.visited - a.visited)
    case 'pct-asc':      return s.sort((a, b) => pct(a) - pct(b) || a.visited - b.visited)
    default:             return s
  }
}

function GridView({ items, onSelect, loading, sort, onSortChange }) {
  const sorted = applySortToItems(items, sort)

  return (
    <>
      <div className={styles.toolbar}>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={e => onSortChange(e.target.value)}
          aria-label="Trier par"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${styles.card} ${styles.cardSkeleton}`} />
          ))}
        </div>
      ) : !sorted.length ? (
        <p className={styles.empty}>Aucune donnée disponible.</p>
      ) : (
        <div className={styles.grid}>
          {sorted.map((item) => (
            <Card
              key={item.id ?? item.code ?? item.name}
              name={item.name}
              visited={item.visited}
              total={item.total}
              onClick={() => onSelect(item)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function Stars({ stars, bib }) {
  if (bib) return <span className={styles.badge}>Bib</span>
  if (stars === 3) return <span className={styles.stars}>★★★</span>
  if (stars === 2) return <span className={styles.stars}>★★</span>
  if (stars === 1) return <span className={styles.stars}>★</span>
  return null
}

function RestaurantList({ items, loading }) {
  const [filter, setFilter] = useState('all')

  const displayed = filter === 'visited'   ? items.filter(r => r.visited)
                  : filter === 'unvisited' ? items.filter(r => !r.visited)
                  : items

  if (loading) {
    return (
      <div className={styles.restaurantList}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${styles.restaurantRow} ${styles.cardSkeleton}`} style={{ height: 64 }} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className={styles.filterBar}>
        {[['all', 'Tous'], ['visited', 'Visités'], ['unvisited', 'Non visités']].map(([key, label]) => (
          <button
            key={key}
            className={`${styles.filterBtn} ${filter === key ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {!displayed.length ? (
        <p className={styles.empty}>Aucun restaurant dans cette sélection.</p>
      ) : (
        <ul className={styles.restaurantList}>
          {displayed.map((r) => (
            <li key={r.id} className={`${styles.restaurantRow} ${r.visited ? styles.restaurantVisited : ''}`}>
              <div className={styles.restaurantInfo}>
                <div className={styles.restaurantTop}>
                  <Stars stars={r.stars} bib={r.bib} />
                  <span className={styles.restaurantName}>{r.name}</span>
                </div>
                {r.cuisine && <span className={styles.restaurantCuisine}>{r.cuisine}</span>}
              </div>
              <div className={styles.visitedMark}>
                {r.visited
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/></svg>
                }
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

const SUBTITLES = {
  countries:   'Pays',
  regions:     'Régions',
  cities:      'Villes',
  restaurants: 'Restaurants',
}

export default function CollectionPage({ onClose }) {
  const [view, setView]           = useState('continents')
  const [continent, setContinent] = useState(null)
  const [country, setCountry]     = useState(null)
  const [region, setRegion]       = useState(null)
  const [city, setCity]           = useState(null)
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [sort, setSort]           = useState('default')

  useEffect(() => {
    setLoading(true)
    setItems([])
    setSort('default')
    let req
    if      (view === 'continents') req = api.collection.continents()
    else if (view === 'countries')  req = api.collection.countries(continent.id)
    else if (view === 'regions')    req = api.collection.regions(country.code)
    else if (view === 'cities')     req = api.collection.cities(country.code, region.name)
    else                            req = api.collection.restaurants(country.code, region.name, city.name)

    req.then(setItems).catch(() => setItems([])).finally(() => setLoading(false))
  }, [view, continent, country, region, city])

  function handleBack() {
    if      (view === 'restaurants') { setView('cities');     setCity(null) }
    else if (view === 'cities')      { setView('regions');    setRegion(null) }
    else if (view === 'regions')     { setView('countries');  setCountry(null) }
    else if (view === 'countries')   { setView('continents'); setContinent(null) }
    else onClose()
  }

  function handleSelect(item) {
    if      (view === 'continents') { setContinent(item); setView('countries') }
    else if (view === 'countries')  { setCountry(item);   setView('regions') }
    else if (view === 'regions')    { setRegion(item);    setView('cities') }
    else if (view === 'cities')     { setCity(item);      setView('restaurants') }
  }

  const title =
    view === 'continents' ? 'Collection' :
    view === 'countries'  ? continent?.name :
    view === 'regions'    ? country?.name :
    view === 'cities'     ? region?.name :
    city?.name

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={handleBack} aria-label="Retour">
            <BackIcon />
          </button>
          <div className={styles.headerText}>
            <h1 className={styles.title}>{title}</h1>
            {view !== 'continents' && (
              <span className={styles.subtitle}>{SUBTITLES[view]}</span>
            )}
          </div>
        </div>

        {view === 'restaurants' ? (
          <RestaurantList items={items} loading={loading} />
        ) : (
          <GridView
            items={items}
            onSelect={handleSelect}
            loading={loading}
            sort={sort}
            onSortChange={setSort}
          />
        )}
      </div>
    </div>
  )
}
