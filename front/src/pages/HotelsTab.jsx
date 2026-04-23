import { useState, useEffect, useCallback } from 'react'
import SearchBar from '../components/filters/SearchBar'
import HotelCard from '../components/cards/HotelCard'
import ScrollSection from '../components/layout/ScrollSection'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import styles from './HomeTabs.module.css'

export default function HotelsTab({ onHotelClick, onSave, isAnySaved }) {
  const [search, setSearch]                   = useState('')
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

      <div className={styles.mobileOnly}>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Hébergements</h1>
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {loading && <p className={styles.loadingMsg}>Chargement…</p>}
        {error   && <p className={styles.errorMsg}>Serveur non disponible</p>}

        {!loading && hotels.length > 0 && (
          <>
            <ScrollSection title="Sélection MICHELIN" subtitle="Les meilleures adresses">
              {hotels.slice(0, 10).map((h) => (
                <HotelCard key={h.id} hotel={h} onClick={onHotelClick} layout="scroll" onSave={onSave} isSaved={isAnySaved?.(h.id, 'hotel')} />
              ))}
            </ScrollSection>

            {plusHotels.length > 0 && (
              <ScrollSection title="MICHELIN Plus" seeAllHref="#">
                {plusHotels.map((h) => (
                  <HotelCard key={h.id} hotel={h} onClick={onHotelClick} layout="scroll" onSave={onSave} isSaved={isAnySaved?.(h.id, 'hotel')} />
                ))}
              </ScrollSection>
            )}

            {ecoHotels.length > 0 && (
              <ScrollSection title="🌿 Éco-responsables">
                {ecoHotels.map((h) => (
                  <HotelCard key={h.id} hotel={h} onClick={onHotelClick} layout="scroll" onSave={onSave} isSaved={isAnySaved?.(h.id, 'hotel')} />
                ))}
              </ScrollSection>
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
              <HotelCard key={h.id} hotel={h} onClick={onHotelClick} layout="grid" onSave={onSave} isSaved={isAnySaved?.(h.id, 'hotel')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
