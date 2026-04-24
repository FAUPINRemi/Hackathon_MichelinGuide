import styles from './Drawer.module.css'

const MENU_ITEMS = [
  { section: 'Restaurants', items: [
    { icon: '', label: 'Restaurants Étoilés' },
    { icon: '', label: 'Bib Gourmand' },
    { icon: '', label: 'Assiette MICHELIN' },
    { icon: '', label: 'Étoile Verte' },
  ]},
  { section: 'Hôtels', items: [
    { icon: '', label: 'Clés MICHELIN' },
    { icon: '', label: 'Hôtels d\'exception' },
  ]},
  { section: 'Découvrir', items: [
    { icon: '', label: 'Explorer les villes' },
    { icon: '', label: 'Voyages gastronomiques' },
    { icon: '', label: 'Actualités & Événements' },
    { icon: '', label: 'Offrir une expérience' },
  ]},
]

export default function Drawer({ open, onClose }) {
  return (
    <>
      <div className={`${styles.overlay} ${open ? styles.open : ''}`} onClick={onClose} />
      <aside className={`${styles.drawer} ${open ? styles.open : ''}`}>
        <div className={styles.header}>
          <span className={styles.logo}>Michelin Guide</span>
          <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {MENU_ITEMS.map(({ section, items }) => (
          <div key={section} className={styles.section}>
            <p className={styles.sectionTitle}>{section}</p>
            {items.map(({ icon, label }) => (
              <a key={label} href="#" className={styles.item}>
                <span className={styles.itemIcon}>{icon}</span>
                <span>{label}</span>
                <span className={styles.arrow}>›</span>
              </a>
            ))}
          </div>
        ))}
      </aside>
    </>
  )
}
