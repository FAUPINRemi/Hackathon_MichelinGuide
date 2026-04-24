import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './RestaurantMap.module.css'
import etoileUrl from '../../assets/svg/etoile_michelin.svg'
import bibsUrl from '../../assets/svg/bibs.svg'
import couvertsUrl from '../../assets/svg/couverts_simple.svg'
import litUrl from '../../assets/svg/lit.svg'
import keyEtoileUrl from '../../assets/svg/key_etoile.svg'

function createPinIcon(distinctionSlug, distinctionScore, type) {
  let src, size

  if (type === 'hotel') {
    if ((distinctionScore ?? 0) > 0) { src = keyEtoileUrl; size = 14 }
    else                              { src = litUrl;       size = 14 }
  } else {
    const slug = distinctionSlug ?? ''
    if (slug === 'bib-gourmand')    { src = bibsUrl;     size = 14 }
    else if (slug.includes('star')) { src = etoileUrl;   size = 13 }
    else                            { src = couvertsUrl; size = 12 }
  }

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

export default function LeafletDetailMap({ lat, lng, name, distinctionSlug, distinctionScore, type }) {
  const icon = createPinIcon(distinctionSlug, distinctionScore, type)

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      className={styles.map}
      scrollWheelZoom={false}
      zoomControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
      />
      <Marker position={[lat, lng]} icon={icon}>
        <Popup className={styles.popup}>
          <strong className={styles.popupName}>{name}</strong>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
