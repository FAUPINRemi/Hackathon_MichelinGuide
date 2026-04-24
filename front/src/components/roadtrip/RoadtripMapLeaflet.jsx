import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import etoileUrl from '../../assets/svg/etoile_michelin.svg'
import bibsUrl from '../../assets/svg/bibs.svg'
import couvertsUrl from '../../assets/svg/couverts_simple.svg'
import litUrl from '../../assets/svg/lit.svg'
import styles from './RoadtripMapLeaflet.module.css'

function createStopIcon(stop) {
  const slug = stop.distinction_slug ?? ''
  const isHotel = stop.category === 'hotel'

  let src, size
  if (slug === 'bib-gourmand')    { src = bibsUrl;     size = 14 }
  else if (slug.includes('star')) { src = etoileUrl;   size = 13 }
  else if (isHotel)               { src = litUrl;      size = 13 }
  else                            { src = couvertsUrl; size = 12 }

  const top  = Math.round(4 + (22 - size) / 2)
  const left = Math.round((32 - size) / 2)

  const circleFill = isHotel && !slug.includes('star') ? '#1f2937' : '#c41230'

  return L.divIcon({
    html: `<div style="position:relative;width:32px;height:42px;">
      <svg viewBox="0 0 32 42" width="32" height="42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16,0C7.163,0,0,7.163,0,16C0,24.837,16,42,16,42s16-17.163,16-26C32,7.163,24.837,0,16,0z"
          fill="white" stroke="#d0d0d0" stroke-width="1.5"/>
        <circle cx="16" cy="15" r="11" fill="${circleFill}"/>
      </svg>
      <img src="${src}" width="${size}" height="${size}"
        style="position:absolute;top:${top}px;left:${left}px;filter:brightness(0) invert(1);pointer-events:none;"
      />
    </div>`,
    className: '',
    iconSize:    [32, 42],
    iconAnchor:  [16, 42],
    popupAnchor: [0, -44],
  })
}

function createEndpointIcon(type) {
  const fill = type === 'origin' ? '#16a34a' : '#2563eb'
  const letter = type === 'origin' ? 'A' : 'B'
  return L.divIcon({
    html: `<div style="position:relative;width:32px;height:42px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.28))">
      <svg viewBox="0 0 32 42" width="32" height="42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16,0C7.163,0,0,7.163,0,16C0,24.837,16,42,16,42s16-17.163,16-26C32,7.163,24.837,0,16,0z"
          fill="${fill}"/>
      </svg>
      <span style="position:absolute;top:6px;left:0;width:32px;text-align:center;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:900;color:#fff;line-height:1;">${letter}</span>
    </div>`,
    className: '',
    iconSize:    [32, 42],
    iconAnchor:  [16, 42],
    popupAnchor: [0, -44],
  })
}

function AutoFitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length < 2) return
    map.fitBounds(points, { padding: [36, 36] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(points)])
  return null
}

function formatDistinction(slug) {
  if (!slug) return null
  if (slug === 'bib-gourmand')    return 'Bib Gourmand'
  if (slug.includes('3-stars'))   return '3 Étoiles Michelin'
  if (slug.includes('2-stars'))   return '2 Étoiles Michelin'
  if (slug.includes('1-star'))    return '1 Étoile Michelin'
  if (slug.includes('green'))     return 'Étoile Verte'
  return null
}

export default function RoadtripMapLeaflet({ origin, destination, stops, polyline, onScrollToCard }) {
  const allPoints = [
    ...(origin?.lat != null      ? [[origin.lat, origin.lng]]           : []),
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
            icon={createStopIcon(stop)}
          >
            <Popup>
              <div className={styles.popup}>
                {stop.image && (
                  <div className={styles.popupImgWrap}>
                    <img src={stop.image} alt={stop.name} className={styles.popupImg} />
                  </div>
                )}
                <p className={styles.popupType}>
                  {stop.category === 'restaurant' ? 'Restaurant' : 'Hôtel'}
                  {stop.detour_minutes != null && (
                    <span className={styles.popupDetour}> · +{stop.detour_minutes} min</span>
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
                  Voir la fiche
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
