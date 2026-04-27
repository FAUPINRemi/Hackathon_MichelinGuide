import bonhommeSvg from '../../assets/svg/bonhomme.svg'
import styles from './Footer.module.css'

const LEGAL_LINKS = [
  { id: 'conditions',      label: "Conditions d'utilisation" },
  { id: 'cookies',         label: 'Gestion de vos cookies' },
  { id: 'confidentialite', label: 'Politique de confidentialité' },
  { id: 'notice',          label: 'Notice légale' },
  { id: 'accessibilite',   label: 'Accessibilité' },
]

export default function Footer({ onLegalPage }) {
  return (
    <footer className={styles.footer}>
      <img src={bonhommeSvg} className={styles.mascot} alt="" aria-hidden="true" />
      <p className={styles.copyright}>
        Copyright © 2026 MICHELIN Guide. Tous droits réservés
      </p>
      <nav className={styles.links} aria-label="Liens légaux">
        {LEGAL_LINKS.map(({ id, label }) => (
          <button key={id} className={styles.link} onClick={() => onLegalPage?.(id)}>
            {label}
          </button>
        ))}
      </nav>
    </footer>
  )
}
