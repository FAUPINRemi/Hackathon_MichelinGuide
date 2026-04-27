import { useState } from 'react'
import DetailMap from '../components/map/DetailMap'
import styles from './HotelDetailPage.module.css'

function formatTime(t) {
  if (!t) return null
  const h = Math.floor(t)
  const m = Math.round((t - h) * 60)
  return `${String(h).padStart(2, '0')}h${m ? String(m).padStart(2, '0') : '00'}`
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

export default function HotelDetailPage({ hotel }) {
  const [visited, setVisited]   = useState(false)
  const [saved, setSaved]       = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (!hotel) return null

  const {
    name, address, location, description, img,
    phone, website, michelin_guide_url,
    lat, lng, checkIn, checkOut, numRooms,
    distinction, distinction_score, isPlus, sustainableHotel,
  } = hotel

  const shortDesc   = description?.slice(0, 280)
  const needsExpand = description?.length > 280
  const checkInStr  = formatTime(checkIn)
  const checkOutStr = formatTime(checkOut)
  const hasMap      = lat && lng

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        {img
          ? <img src={img} alt={name} className={styles.heroImg} />
          : <div className={styles.heroPlaceholder}><BuildingIcon /></div>
        }
        <div className={styles.heroOverlay} />
        {(distinction_score > 0 || isPlus || sustainableHotel) && (
          <div className={styles.heroBadges}>
            {distinction_score > 0 && distinction?.label && (
              <span className={styles.heroBadge}>{distinction.label.split(':')[0]}</span>
            )}
            {isPlus && <span className={styles.heroBadgePlus}>MICHELIN Plus</span>}
            {sustainableHotel && <span className={styles.heroBadgeEco}>Éco</span>}
          </div>
        )}
        <div className={styles.heroGrid}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <rect x="1" y="6" width="4" height="16" rx="1"/>
            <rect x="9" y="1" width="4" height="21" rx="1"/>
            <rect x="17" y="4" width="4" height="18" rx="1"/>
          </svg>
        </div>
      </div>

      {/* Main info */}
      <div className={styles.info}>
        <h1 className={styles.name}>{name}</h1>
        <div className={styles.metaRow}>
          {address && <span>{address}</span>}
          {address && location && <span className={styles.metaDot}>·</span>}
          {location && <span>{location}</span>}
        </div>
      </div>

      {/* Action pills */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${visited ? styles.actionActive : ''}`}
          onClick={() => setVisited(v => !v)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          <span>Déjà visité</span>
        </button>

        <button
          className={`${styles.actionBtn} ${saved ? styles.actionActive : ''}`}
          onClick={() => setSaved(v => !v)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>Favori</span>
        </button>

        <button className={styles.actionBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span>Partager</span>
        </button>
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
            <DetailMap
              lat={lat}
              lng={lng}
              name={name}
              distinctionScore={distinction_score}
              type="hotel"
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

      {/* Signalement */}
      <hr className={styles.divider} />
      <div className={styles.section}>
        <div className={styles.reportBox}>
          <p className={styles.reportText}>Avez-vous trouvé une information erronée ou obsolète ?</p>
          <button className={styles.reportBtn}>Dites-le nous</button>
        </div>
      </div>

    </div>
  )
}
