import { useState, useEffect } from 'react'
import etoileSvg from '../assets/svg/etoile_michelin.svg'
import bibsSvg from '../assets/svg/bibs.svg'
import NoteDialog from '../components/feedback/NoteDialog'
import DetailMap from '../components/map/DetailMap'
import HotelCard from '../components/cards/HotelCard'
import { api } from '../api/client'
import styles from './RestaurantDetailPage.module.css'

const FAKE_HOURS = [
  { day: 'Lundi',    slots: null },
  { day: 'Mardi',    slots: null },
  { day: 'Mercredi', slots: null },
  { day: 'Jeudi',    slots: ['12h00 – 14h30', '19h00 – 22h30'] },
  { day: 'Vendredi', slots: ['12h00 – 14h30', '19h00 – 23h00'] },
  { day: 'Samedi',   slots: ['12h00 – 15h00', '19h00 – 23h00'] },
  { day: 'Dimanche', slots: ['12h00 – 15h00'] },
]

const PRICE_RANGE = {
  '€':    'de 15€ à 35€',
  '€€':   'de 35€ à 70€',
  '€€€':  'de 70€ à 150€',
  '€€€€': 'de 150€ à 300€',
}

const AMENITIES = [
  { label: 'Accès handicapé',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="4" r="2"/><path d="M10 9h4l2 6h-2l-1-3H9a1 1 0 0 1-.9-1.4L10 9z"/><path d="M10 15l-1 5h2l1-3h2l1 3h2l-2-5"/></svg> },
  { label: 'Air conditionné',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="8" rx="2"/><path d="M8 14v4M12 14v4M16 14v4M6 10h.01M10 10h.01M14 10h.01"/></svg> },
  { label: 'American Express',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
  { label: 'Mastercard',         icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
  { label: 'Visa',               icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
  { label: 'Parking',            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg> },
  { label: 'Vue exceptionnelle', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg> },
]

const TODAY_IDX = (new Date().getDay() + 6) % 7

export default function RestaurantDetailPage({ restaurant, isSaved = false, onSave, onHotelClick, onSaveHotel, isAnySaved, getNote, setNote }) {
  const [visited, setVisited]           = useState(false)
  const [showNote, setShowNote]         = useState(false)
  const [expanded, setExpanded]         = useState(false)
  const [nearbyHotels, setNearbyHotels] = useState(null)

  useEffect(() => {
    if (!restaurant?.location) { setNearbyHotels([]); return }
    let cancelled = false
    api.hotels.list({ search: restaurant.location, limit: 6 })
      .then(res => { if (!cancelled) setNearbyHotels(res.data ?? []) })
      .catch(() => { if (!cancelled) setNearbyHotels([]) })
    return () => { cancelled = true }
  }, [restaurant?.location])

  if (!restaurant) return null

  const { name, cuisine, address, location, price, stars, bib, img, likes, phone, website, description } = restaurant

  const shortDesc = description?.slice(0, 220)
  const needsExpand = description?.length > 220

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        <img src={img} alt={name} className={styles.heroImg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroDistinctions}>
          {bib ? (
            <img src={bibsSvg} className={styles.heroBib} alt="Bib Gourmand" />
          ) : (
            Array.from({ length: stars }).map((_, i) => (
              <img key={i} src={etoileSvg} className={styles.heroStar} alt="" aria-hidden="true" />
            ))
          )}
        </div>
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
          {cuisine && <span>{cuisine}</span>}
          {cuisine && location && <span className={styles.metaDot}>·</span>}
          {location && <span>{location}</span>}
          {price && <><span className={styles.metaDot}>·</span><span>{price}</span></>}
        </div>
        {likes > 0 && (
          <div className={styles.ratingRow}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className={styles.ratingHeart}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span><strong>{likes?.toLocaleString('fr-FR')}</strong> personnes aiment cette adresse</span>
          </div>
        )}
      </div>

      {/* Action pills */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${showNote ? styles.actionActive : ''}`}
          onClick={() => setShowNote(true)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M8 9h8M8 13h5"/>
          </svg>
          <span>Remarques</span>
        </button>

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
          className={`${styles.actionBtn} ${isSaved ? styles.actionActive : ''}`}
          onClick={onSave}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>Favori</span>
        </button>
      </div>

      {showNote && (
        <NoteDialog
          itemName={name}
          initialNote={getNote?.(restaurant.id, 'restaurant') ?? ''}
          onSave={text => { setNote?.(restaurant.id, 'restaurant', text) }}
          onClose={() => setShowNote(false)}
        />
      )}

      <hr className={styles.divider} />

      {/* Description */}
      <div className={styles.section}>
        <p className={styles.description}>{expanded ? description : shortDesc}{!expanded && needsExpand ? '…' : ''}</p>
        {needsExpand && !expanded && (
          <button className={styles.readMore} onClick={() => setExpanded(true)}>Lire plus</button>
        )}
      </div>

      <hr className={styles.divider} />

      {/* Tarifs */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tarifs</h2>
        <div className={styles.priceCard}>
          <span className={styles.priceSymbol}>{price}</span>
          {PRICE_RANGE[price] && (
            <span className={styles.priceRange}>{PRICE_RANGE[price]} par personne</span>
          )}
        </div>
      </div>

      <hr className={styles.divider} />

      {/* Road-trip CTA */}
      <div className={styles.section}>
        <button className={styles.roadtripBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 17l4-8 4 4 4-6 4 10"/>
            <path d="M3 21h18"/>
          </svg>
          <span>Préparer un road-trip ?</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <hr className={styles.divider} />

      {/* Adresse & Horaires */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Adresse et Horaires</h2>
        <p className={styles.addressText}>{address}</p>
        <div className={styles.hoursGrid}>
          {FAKE_HOURS.map(({ day, slots }, i) => {
            const isToday = i === TODAY_IDX
            return (
              <div key={day} className={`${styles.hoursCard} ${isToday ? styles.hoursCardToday : ''}`}>
                <span className={styles.hoursCardDay}>{day}</span>
                {slots
                  ? slots.map(s => <span key={s} className={styles.hoursCardSlot}>{s}</span>)
                  : <span className={styles.hoursCardClosed}>Fermé</span>
                }
              </div>
            )
          })}
        </div>
        <div className={styles.mapWrap}>
          <DetailMap
            lat={restaurant.lat}
            lng={restaurant.lng}
            name={name}
            distinctionSlug={restaurant.distinction_slug}
            type="restaurant"
          />
        </div>
      </div>

      <hr className={styles.divider} />

      {/* CTA buttons */}
      <div className={styles.ctaSection}>
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
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

      {/* Hôtels à proximité */}
      {nearbyHotels !== null && (
        <>
          <hr className={styles.divider} />
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Hôtels à proximité</h2>
            {location && <p className={styles.sectionSubtitle}>À {location}</p>}
            {nearbyHotels.length === 0 ? (
              <p className={styles.nearbyEmpty}>Aucun hôtel référencé à {location || 'proximité'}.</p>
            ) : (
              <div className={styles.hotelsScroll}>
                {nearbyHotels.map(h => (
                  <HotelCard
                    key={h.id}
                    hotel={h}
                    onClick={onHotelClick}
                    layout="scroll"
                    onSave={onSaveHotel}
                    isSaved={isAnySaved?.(h.id, 'hotel')}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Équipements et services */}
      <hr className={styles.divider} />
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Équipements et services</h2>
        <div className={styles.amenityGrid}>
          {AMENITIES.map(({ label, icon }) => (
            <div key={label} className={styles.amenityItem}>
              <span className={styles.amenityIcon}>{icon}</span>
              <span className={styles.amenityLabel}>{label}</span>
            </div>
          ))}
        </div>
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
