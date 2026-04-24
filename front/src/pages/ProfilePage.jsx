import { useState } from 'react'
import { useNfc, isMobileDevice } from '../hooks/useNfc'
import bonhommeSvg from '../assets/svg/bonhomme.svg'
import styles from './ProfilePage.module.css'

const STATIC_ITEMS = [
  'Profil',
  'Newsletter',
  'Programme Plus',
  'Service client',
  'Préférences',
  'Commentaires',
  'Conditions générales et confidentialité',
]

function NfcIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12a8 8 0 0 0-8-8"/>
      <path d="M4 12a8 8 0 0 0 8 8"/>
      <path d="M17 12a5 5 0 0 0-5-5"/>
      <path d="M7 12a5 5 0 0 0 5 5"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
    </svg>
  )
}

export default function ProfilePage({ onOpenCollection, onLogout, user, onOpenItineraries }) {
  const { scanning, status, error, startScan } = useNfc()
  const mobile = isMobileDevice()
  const [scanResult, setScanResult] = useState(null)
  const [scanLoading, setScanLoading] = useState(false)

  async function submitScan(id) {
    setScanResult(null)
    setScanLoading(true)
    try {
      const res = await api.collection.scan({ id })
      setScanResult({ ok: true, message: `"${res.restaurant}" ajouté à votre collection !` })
    } catch (e) {
      setScanResult({ ok: false, message: e.message || 'Erreur lors de l\'ajout.' })
    } finally {
      setScanLoading(false)
    }
  }

  function handleScan() {
    startScan((text) => {
      try {
        const data = JSON.parse(text)
        if (data?.id) submitScan(String(data.id))
        else setScanResult({ ok: false, message: 'Tag invalide : champ "id" manquant.' })
      } catch {
        setScanResult({ ok: false, message: 'Tag invalide : contenu non JSON.' })
      }
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Compte</h1>
        {user?.name && <p className={styles.userName}>Bonjour, {user.name}</p>}

        {mobile ? (
          <div className={styles.nfcSection}>
            <button
              className={`${styles.nfcBtn} ${scanning ? styles.nfcBtnScanning : ''}`}
              onClick={handleScan}
              disabled={scanLoading}
              aria-label={scanning ? 'Arrêter le scan NFC' : 'Scanner un tag NFC'}
            >
              <NfcIcon />
              <span>{scanning ? 'Annuler' : 'Scanner NFC'}</span>
            </button>

            {status && <p className={styles.nfcStatus}>{status}</p>}
            {error   && <p className={styles.nfcError}>{error}</p>}
            {scanResult && (
              <p className={scanResult.ok ? styles.nfcSuccess : styles.nfcError}>
                {scanResult.message}
              </p>
            )}
          </div>
        ) : (
          <div className={styles.nfcSection}>
            <div className={styles.nfcDesktopBanner}>
              <NfcIcon />
              <p className={styles.nfcDesktopText}>
                Consultez notre site sur téléphone pour scanner directement les plaques Michelin des restaurants.
              </p>
            </div>
          </div>
        )}

        <ul className={styles.menu}>
          <li className={`${styles.item} ${styles.itemClickable}`} onClick={onOpenItineraries}>
            <span className={styles.label}>Mes itinéraires</span>
            <svg className={styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </li>
          <li className={`${styles.item} ${styles.itemClickable}`} onClick={onOpenCollection}>
            <span className={styles.label}>Collection</span>
            <svg className={styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </li>
          {STATIC_ITEMS.map((label) => (
            <li key={label} className={styles.item}>
              <span className={styles.label}>{label}</span>
              <svg className={styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </li>
          ))}
          <li className={`${styles.item} ${styles.itemLogout}`} onClick={onLogout}>
            <span className={styles.label}>Se déconnecter</span>
          </li>
        </ul>

        <p className={styles.version}>Version build 10.1.3 (7215)</p>

        <footer className={styles.footer}>
          <img src={bonhommeSvg} className={styles.bibendum} alt="Bibendum" />
          <p className={styles.copyright}>Copyright © 2026 Guide MICHELIN.</p>
        </footer>
      </div>
    </div>
  )
}
