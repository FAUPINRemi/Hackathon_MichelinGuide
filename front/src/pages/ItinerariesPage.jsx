import { useState } from 'react'
import etoileSvg from '../assets/svg/etoile_michelin.svg'
import bibsSvg from '../assets/svg/bibs.svg'
import styles from './ItinerariesPage.module.css'

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  } catch { return '' }
}

function getStarCount(slug) {
  if (!slug) return 0
  if (slug.includes('3-stars')) return 3
  if (slug.includes('2-stars')) return 2
  if (slug.includes('1-star')) return 1
  return 0
}

function StopRow({ stop }) {
  const isResto = stop.category === 'restaurant'
  const stars = getStarCount(stop.distinction_slug)
  return (
    <div className={styles.stopRow}>
      {stop.image
        ? <img src={stop.image} alt={stop.name} className={styles.stopImg} />
        : <div className={`${styles.stopImgPlaceholder} ${isResto ? styles.placeholderResto : styles.placeholderHotel}`} />
      }
      <div className={styles.stopInfo}>
        <p className={styles.stopName}>{stop.name}</p>
        <p className={styles.stopMeta}>
          <span className={`${styles.stopType} ${isResto ? styles.typeRed : styles.typeDark}`}>
            {isResto ? 'Restaurant' : 'Hôtel'}
          </span>
          {stop.city && <span> · {stop.city}</span>}
          {stop.distinction_slug === 'bib-gourmand' && (
            <span> · <img src={bibsSvg} width={11} height={11} alt="" style={{ verticalAlign: 'middle' }} /> Bib Gourmand</span>
          )}
          {stars > 0 && (
            <span> · {Array.from({ length: stars }).map((_, i) => (
              <img key={i} src={etoileSvg} width={11} height={11} alt="" style={{ verticalAlign: 'middle' }} />
            ))}</span>
          )}
          {stop.detour_minutes != null && (
            <span className={styles.detour}> · +{stop.detour_minutes} min</span>
          )}
        </p>
      </div>
    </div>
  )
}

function ItineraryDetail({ itinerary, onBack, onDelete }) {
  function handleDelete() {
    if (window.confirm(`Supprimer « ${itinerary.name} » ?`)) {
      onDelete(itinerary.id)
      onBack()
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button className={styles.backBtn} onClick={onBack}>
          ← Retour
        </button>
        <h1 className={styles.title}>{itinerary.name}</h1>
        <p className={styles.dateLabel}>Enregistré le {formatDate(itinerary.createdAt)}</p>

        <div className={styles.routeCard}>
          <div className={styles.routeRow}>
            <span className={styles.routeDot} style={{ background: '#16a34a' }} />
            <span className={styles.routeLabel}>{itinerary.origin?.label ?? '?'}</span>
          </div>
          {(itinerary.stops ?? []).map((s, i) => (
            <div key={i} className={styles.routeRow}>
              <span className={styles.routeLine} />
              <span className={`${styles.routeDot} ${s.category === 'restaurant' ? styles.dotRed : styles.dotDark}`} />
              <span className={styles.routeLabel}>{s.name}</span>
            </div>
          ))}
          <div className={styles.routeRow}>
            <span className={styles.routeLine} />
            <span className={styles.routeDot} style={{ background: '#2563eb' }} />
            <span className={styles.routeLabel}>{itinerary.destination?.label ?? '?'}</span>
          </div>
        </div>

        {itinerary.googleMapsUrl && (
          <a
            href={itinerary.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapsBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Ouvrir dans Google Maps
          </a>
        )}

        {(itinerary.stops ?? []).length > 0 && (
          <div className={styles.stopsSection}>
            <p className={styles.sectionTitle}>Arrêts ({itinerary.stops.length})</p>
            <div className={styles.stopsList}>
              {itinerary.stops.map((stop, i) => <StopRow key={i} stop={stop} />)}
            </div>
          </div>
        )}

        <button className={styles.deleteBtn} onClick={handleDelete}>
          Supprimer cet itinéraire
        </button>
      </div>
    </div>
  )
}

export default function ItinerariesPage({ itineraries, onDelete, onClose }) {
  const [selected, setSelected] = useState(null)

  if (selected) {
    return (
      <ItineraryDetail
        itinerary={selected}
        onBack={() => setSelected(null)}
        onDelete={onDelete}
      />
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button className={styles.backBtn} onClick={onClose}>← Retour</button>
        <h1 className={styles.title}>Mes itinéraires</h1>

        {itineraries.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Aucun itinéraire enregistré.</p>
            <p className={styles.emptyHint}>Générez un road trip dans l&apos;onglet « Road Trip » puis cliquez sur Enregistrer.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {itineraries.map((it) => (
              <button key={it.id} className={styles.itCard} onClick={() => setSelected(it)}>
                <div className={styles.itCardBody}>
                  <p className={styles.itName}>{it.name}</p>
                  <p className={styles.itMeta}>
                    {(it.stops ?? []).length} arrêt{(it.stops ?? []).length !== 1 ? 's' : ''}
                    {' · '}{formatDate(it.createdAt)}
                  </p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
