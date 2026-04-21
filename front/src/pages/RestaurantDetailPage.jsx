import { useState } from 'react'
import { MichelinFlower } from '../components/common/MichelinIcon'
import styles from './RestaurantDetailPage.module.css'

const ACTION_TILES = [
  {
    id: 'notes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M8 9h8M8 13h5"/>
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

const FAKE_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80&auto=format',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&q=80&auto=format',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=60&q=80&auto=format',
]

export default function RestaurantDetailPage({ restaurant }) {
  const [activeActions, setActiveActions] = useState({})
  const [expanded, setExpanded] = useState(false)

  if (!restaurant) return null

  const { name, cuisine, address, price, stars, bib, img, likes, phone, website, description } = restaurant

  const toggleAction = (id) => setActiveActions((prev) => ({ ...prev, [id]: !prev[id] }))

  const shortDesc = description?.slice(0, 220)
  const needsExpand = description?.length > 220

  return (
    <div className={styles.page}>

      {/* Hero image */}
      <div className={styles.hero}>
        <img src={img} alt={name} className={styles.heroImg} />
        <div className={styles.heroGrid}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="1" y="6" width="4" height="16" rx="1"/><rect x="9" y="1" width="4" height="21" rx="1"/><rect x="17" y="4" width="4" height="18" rx="1"/></svg>
        </div>
      </div>

      {/* Main info */}
      <div className={styles.info}>
        <div className={styles.distinctions}>
          {bib ? (
            <span className={styles.bibBig}>😊</span>
          ) : (
            Array.from({ length: stars }).map((_, i) => <MichelinFlower key={i} size={22} color="#c41230" />)
          )}
        </div>
        <h1 className={styles.name}>{name}</h1>
        <p className={styles.addressLine}>{address}</p>
        <p className={styles.cuisineLine}>{cuisine}</p>
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

      {/* Likes */}
      <div className={styles.likes}>
        <div className={styles.avatars}>
          {FAKE_AVATARS.map((src, i) => (
            <img key={i} src={src} alt="" className={styles.avatar} style={{ zIndex: 3 - i }} />
          ))}
        </div>
        <p className={styles.likesText}>
          <span className={styles.likesCount}>{likes?.toLocaleString('fr-FR')} personnes</span> aiment cette adresse
        </p>
      </div>

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
        <p className={styles.price}>{price}</p>
      </div>

      <hr className={styles.divider} />

      {/* Address & Hours */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Adresse et Horaires</h2>
        <p className={styles.addressText}>{address}</p>
        <div className={styles.mapWrap}>
          <iframe
            title={`Carte ${name}`}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(restaurant.lng || 2.35) - 0.03}%2C${(restaurant.lat || 48.85) - 0.015}%2C${(restaurant.lng || 2.35) + 0.03}%2C${(restaurant.lat || 48.85) + 0.015}&layer=mapnik&marker=${restaurant.lat || 48.85}%2C${restaurant.lng || 2.35}`}
            className={styles.mapFrame}
            loading="lazy"
          />
        </div>
      </div>

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
    </div>
  )
}
