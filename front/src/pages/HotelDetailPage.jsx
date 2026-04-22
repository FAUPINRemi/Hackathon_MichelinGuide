import { useState } from 'react'
import styles from './HotelDetailPage.module.css'

const ACTION_TILES = [
  {
    id: 'notes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 9h8M8 13h5"/>
      </svg>
    ),
    label: 'Remarques',
  },
  {
    id: 'visited',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    ),
    label: 'Déjà visité',
  },
  {
    id: 'save',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    label: 'Sauvegarder',
  },
  {
    id: 'favorite',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    label: 'Favori',
  },
]

function formatTime(t) {
  if (!t) return null;
  const h = Math.floor(t);
  const m = Math.round((t - h) * 60);
  return `${String(h).padStart(2, '0')}h${m ? String(m).padStart(2, '0') : '00'}`;
}

export default function HotelDetailPage({ hotel }) {
  const [activeActions, setActiveActions] = useState({})
  const [expanded, setExpanded] = useState(false)

  if (!hotel) return null

  const {
    name, address, location, description, img,
    phone, website, michelin_guide_url,
    lat, lng, checkIn, checkOut, numRooms,
    distinction, distinction_score, isPlus, sustainableHotel,
  } = hotel

  const toggleAction = (id) => setActiveActions((prev) => ({ ...prev, [id]: !prev[id] }))

  const shortDesc = description?.slice(0, 280)
  const needsExpand = description?.length > 280

  const checkInStr  = formatTime(checkIn)
  const checkOutStr = formatTime(checkOut)

  const hasMap = lat && lng

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        {img
          ? <img src={img} alt={name} className={styles.heroImg} />
          : <div className={styles.heroPlaceholder}><BuildingIcon /></div>
        }
        <div className={styles.heroGrid}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <rect x="1" y="6" width="4" height="16" rx="1"/>
            <rect x="9" y="1" width="4" height="21" rx="1"/>
            <rect x="17" y="4" width="4" height="18" rx="1"/>
          </svg>
        </div>
      </div>

      {/* Info principale */}
      <div className={styles.info}>
        <div className={styles.badges}>
          {distinction_score > 0 && distinction?.label && (
            <span className={styles.distBadge}>{distinction.label.split(':')[0]}</span>
          )}
          {isPlus && <span className={styles.plusBadge}>MICHELIN Plus</span>}
          {sustainableHotel && <span className={styles.ecoBadge}>🌿 Éco-responsable</span>}
        </div>
        <h1 className={styles.name}>{name}</h1>
        <p className={styles.addressLine}>{address}</p>
        <p className={styles.locationLine}>{location}</p>
      </div>

      {/* Action tiles */}
      <div className={styles.actions}>
        {ACTION_TILES.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`${styles.actionTile} ${activeActions[id] ? styles.tileActive : ''}`}
            onClick={() => toggleAction(id)}
          >
            <span className={styles.tileIcon}>{icon}</span>
            <span className={styles.tileLabel}>{label}</span>
          </button>
        ))}
      </div>

      <hr className={styles.divider} />

      {/* Description */}
      {description && (
        <>
          <div className={styles.section}>
            <p className={styles.description}>
              {expanded ? description : shortDesc}
              {!expanded && needsExpand ? '…' : ''}
            </p>
            {needsExpand && !expanded && (
              <button className={styles.readMore} onClick={() => setExpanded(true)}>Lire plus</button>
            )}
          </div>
          <hr className={styles.divider} />
        </>
      )}

      {/* Infos séjour */}
      {(checkInStr || checkOutStr || numRooms) && (
        <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Informations séjour</h2>
            <div className={styles.stayInfo}>
              {checkInStr && (
                <div className={styles.stayItem}>
                  <span className={styles.stayLabel}>Arrivée</span>
                  <span className={styles.stayValue}>à partir de {checkInStr}</span>
                </div>
              )}
              {checkOutStr && (
                <div className={styles.stayItem}>
                  <span className={styles.stayLabel}>Départ</span>
                  <span className={styles.stayValue}>avant {checkOutStr}</span>
                </div>
              )}
              {numRooms && (
                <div className={styles.stayItem}>
                  <span className={styles.stayLabel}>Chambres</span>
                  <span className={styles.stayValue}>{numRooms}</span>
                </div>
              )}
            </div>
          </div>
          <hr className={styles.divider} />
        </>
      )}

      {/* Adresse & carte */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Adresse</h2>
        <p className={styles.addressText}>{address}{location ? `, ${location}` : ''}</p>
        {hasMap && (
          <div className={styles.mapWrap}>
            <iframe
              title={`Carte ${name}`}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.03}%2C${lat - 0.015}%2C${lng + 0.03}%2C${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`}
              className={styles.mapFrame}
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* CTA */}
      <div className={styles.ctaSection}>
        {(website || michelin_guide_url) && (
          <a
            href={website || michelin_guide_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            <span>Voir le site internet</span>
          </a>
        )}
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, '')}`} className={styles.ctaBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 5a2 2 0 0 1 1.99-2H6.6a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>{phone}</span>
          </a>
        )}
      </div>

    </div>
  )
}

function BuildingIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
      <path d="M3 21h18M3 7l9-4 9 4M5 21V7M19 21V7"/>
      <rect x="9" y="13" width="6" height="8"/>
      <rect x="7" y="10" width="2" height="2"/><rect x="15" y="10" width="2" height="2"/>
    </svg>
  )
}
