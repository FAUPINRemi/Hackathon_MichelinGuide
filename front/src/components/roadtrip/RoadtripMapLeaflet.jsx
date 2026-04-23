import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './RoadtripMapLeaflet.module.css'

function makePinSvg(fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 38" width="28" height="38"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.68 14 24 14 24S28 23.68 28 14C28 6.27 21.73 0 14 0z" fill="${fill}"/><circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/></svg>`
}

function makeIconSvg(fill, emoji) {
  return `<div style="position:relative;width:32px;height:42px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.28))"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42"><path d="M16 0C7.16 0 0 7.16 0 16c0 11.06 16 26 16 26S32 27.06 32 16C32 7.16 24.84 0 16 0z" fill="${fill}"/></svg><span style="position:absolute;top:5px;left:50%;transform:translateX(-50%);font-size:13px;line-height:1">${emoji}</span></div>`
}

function createEndpointIcon(type) {
  const fill = type === 'origin' ? '#16a34a' : '#2563eb'
  const label = type === 'origin' ? 'A' : 'B'
  return L.divIcon({
    html: `<div style="position:relative;width:28px;height:38px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${makePinSvg(fill)}<span style="position:absolute;top:6px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:900;color:${fill};line-height:1">${label}</span></div>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -40],
    className: '',
  })
}

function createStopIcon(category) {
  const fill = category === 'restaurant' ? '#c41230' : '#1f2937'
  const emoji = category === 'restaurant' ? '🍽' : '🏨'
  return L.divIcon({
    html: makeIconSvg(fill, emoji),
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
    className: '',
  })
}

function AutoFitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length < 2) return
    map.fitBounds(points, { padding: [36, 36] })
  }, [map, JSON.stringify(points)])
  return null
}

function formatDistinction(slug) {
  if (!slug) return null
  if (slug === 'bib-gourmand') return '😊 Bib Gourmand'
  if (slug.includes('3') || slug.includes('three')) return '⭐⭐⭐ 3 Étoiles'
  if (slug.includes('2') || slug.includes('two')) return '⭐⭐ 2 Étoiles'
  if (slug.includes('1') || slug.includes('one') || slug === 'etoile-michelin') return '⭐ 1 Étoile'
  if (slug.includes('green')) return '🌿 Étoile Verte'
  return null
}

export default function RoadtripMapLeaflet({ origin, destination, stops, polyline, onScrollToCard }) {
  const allPoints = [
    ...(origin?.lat != null ? [[origin.lat, origin.lng]] : []),
    ...stops.filter((s) => s.lat != null).map((s) => [s.lat, s.lng]),
    ...(destination?.lat != null ? [[destination.lat, destination.lng]] : []),
  ]

  return (
    <MapContainer center={[46.6, 2.2]} zoom={6} className={styles.map}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {polyline.length > 1 && (
        <Polyline
          positions={polyline}
          pathOptions={{ color: '#c41230', weight: 4, opacity: 0.85 }}
        />
      )}

      {origin?.lat != null && (
        <Marker position={[origin.lat, origin.lng]} icon={createEndpointIcon('origin')}>
          <Popup>
            <div className={styles.popup}>
              <p className={styles.popupType}>Départ</p>
              <p className={styles.popupName}>{origin.label}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {destination?.lat != null && (
        <Marker position={[destination.lat, destination.lng]} icon={createEndpointIcon('destination')}>
          <Popup>
            <div className={styles.popup}>
              <p className={styles.popupType}>Arrivée</p>
              <p className={styles.popupName}>{destination.label}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {stops.map((stop) => {
        const dist = formatDistinction(stop.distinction_slug)
        return (
          <Marker
            key={`${stop.category}-${stop.id}`}
            position={[stop.lat, stop.lng]}
            icon={createStopIcon(stop.category)}
          >
            <Popup>
              <div className={styles.popup}>
                <p className={styles.popupType}>
                  {stop.category === 'restaurant' ? 'Restaurant' : 'Hôtel'}
                  {stop.detour_minutes != null && (
                    <span className={styles.popupDetour}> +{stop.detour_minutes} min</span>
                  )}
                </p>
                <p className={styles.popupName}>{stop.name}</p>
                {stop.city && <p className={styles.popupCity}>{stop.city}</p>}
                {dist && <p className={styles.popupDist}>{dist}</p>}
                {stop.budget_symbol && (
                  <p className={styles.popupBudget}>{stop.budget_symbol}</p>
                )}
                <button
                  className={styles.popupBtn}
                  onClick={() => onScrollToCard?.(`${stop.category}-${stop.id}`)}
                >
                  Voir la fiche →
                </button>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {allPoints.length >= 2 && <AutoFitBounds points={allPoints} />}
    </MapContainer>
  )
}
