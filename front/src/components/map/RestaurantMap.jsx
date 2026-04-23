import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './RestaurantMap.module.css'
import etoileUrl from '../../assets/svg/etoile_michelin.svg'
import bibsUrl from '../../assets/svg/bibs.svg'
import couvertsUrl from '../../assets/svg/couverts_simple.svg'

// Pin icon selon le slug de distinction Michelin
function createPinIcon(r) {
  const slug = r.distinction_slug ?? ''
  let src, size

  if (slug === 'bib-gourmand')      { src = bibsUrl;    size = 14 }
  else if (slug.includes('star'))   { src = etoileUrl;  size = 13 }
  else                              { src = couvertsUrl; size = 12 }

  const top  = Math.round(4 + (22 - size) / 2)
  const left = Math.round((32 - size) / 2)

  return L.divIcon({
    html: `<div style="position:relative;width:32px;height:42px;">
      <svg viewBox="0 0 32 42" width="32" height="42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16,0C7.163,0,0,7.163,0,16C0,24.837,16,42,16,42s16-17.163,16-26C32,7.163,24.837,0,16,0z"
          fill="white" stroke="#d0d0d0" stroke-width="1.5"/>
        <circle cx="16" cy="15" r="11" fill="#c41230"/>
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

const USER_ICON = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#1a73e8;border:3px solid white;box-shadow:0 0 0 4px rgba(26,115,232,0.25);"></div>`,
  className: '',
  iconSize:   [14, 14],
  iconAnchor: [7, 7],
})

// Gère position explicite (geocodage) et géolocalisation initiale
function LocationManager({ center, restaurants }) {
  const map = useMap()
  const centerRef = useRef(center)
  const [geoPos, setGeoPos] = useState(null)

  // Synchronise la ref pour que le callback géoloc voie la valeur courante
  useEffect(() => { centerRef.current = center }, [center])

  // Fly vers le centre explicite quand il change (recherche ville)
  useEffect(() => {
    if (!center || !isFinite(center.lat) || !isFinite(center.lng)) return
    map.flyTo([center.lat, center.lng], 11, { duration: 1.2 })
  }, [center, map])

  // Géolocalisation initiale (une seule fois au montage)
  useEffect(() => {
    if (!navigator.geolocation) {
      fitFallback()
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (centerRef.current) return  // centre explicite déjà défini, on ignore
        const pos = [coords.latitude, coords.longitude]
        setGeoPos(pos)
        map.flyTo(pos, 11, { duration: 1.5 })
      },
      () => fitFallback()
    )

    function fitFallback() {
      if (centerRef.current || restaurants.length === 0) return
      map.fitBounds(
        restaurants.map((r) => [r.lat, r.lng]),
        { padding: [24, 24], maxZoom: 13 }
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Affiche le point bleu seulement si on a utilisé la géoloc (pas un centre explicite)
  if (!geoPos || center) return null
  return <Marker position={geoPos} icon={USER_ICON} />
}

export default function RestaurantMap({ restaurants, onRestaurantClick, center }) {
  const valid = restaurants.filter((r) => r.lat && r.lng)

  return (
    <MapContainer
      center={[46.6, 2.3]}
      zoom={6}
      className={styles.map}
      scrollWheelZoom={false}
      zoomControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
      />
      <LocationManager center={center} restaurants={valid} />
      {valid.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={createPinIcon(r)}
          eventHandlers={{ click: () => onRestaurantClick?.(r) }}
        >
          <Popup className={styles.popup}>
            <strong className={styles.popupName}>{r.name}</strong>
            {r.stars > 0 && <span className={styles.popupStars}>{'★'.repeat(r.stars)}</span>}
            {r.distinction_slug === 'bib-gourmand' && (
              <span className={styles.popupBib}>Bib Gourmand</span>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
