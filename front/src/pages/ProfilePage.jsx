import { useNfc, isMobileDevice } from '../hooks/useNfc'
import styles from './ProfilePage.module.css'

const STATIC_ITEMS = [
  'Profil',
  'Newsletter',
  'Programme Plus',
  'Service client',
  'Préférences',
  'Commentaires',
  'Conditions générales et confidentialité',
  'Se déconnecter',
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

export default function ProfilePage({ onOpenCollection }) {
  const { scanning, status, error, startScan } = useNfc()
  const mobile = isMobileDevice()

  function handleScan() {
    startScan((text, serialNumber) => {
      let msg = `Tag NFC scanné !\n\nNuméro de série : ${serialNumber}\n\nContenu : ${text}`
      try {
        const data = JSON.parse(text)
        msg = `Tag NFC scanné !\n\nNuméro de série : ${serialNumber}\n\n${JSON.stringify(data, null, 2)}`
      } catch {
        // text is not JSON — show raw
      }
      alert(msg)
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Compte</h1>

        {mobile ? (
          <div className={styles.nfcSection}>
            <button
              className={`${styles.nfcBtn} ${scanning ? styles.nfcBtnScanning : ''}`}
              onClick={handleScan}
              aria-label={scanning ? 'Arrêter le scan NFC' : 'Scanner un tag NFC'}
            >
              <NfcIcon />
              <span>{scanning ? 'Annuler' : 'Scanner NFC'}</span>
            </button>
            {status && <p className={styles.nfcStatus}>{status}</p>}
            {error && <p className={styles.nfcError}>{error}</p>}
          </div>
        ) : (
          <div className={styles.nfcDesktopBanner}>
            <NfcIcon />
            <p className={styles.nfcDesktopText}>
              Consultez notre site sur téléphone pour scanner directement les plaques Michelin des restaurants.
            </p>
          </div>
        )}

        <ul className={styles.menu}>
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
        </ul>

        <p className={styles.version}>Version build 10.1.3 (7215)</p>

        <footer className={styles.footer}>
          <svg className={styles.bibendum} viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" aria-label="Bibendum">
            <ellipse cx="40" cy="30" rx="18" ry="18" fill="none" stroke="#1a1a1a" strokeWidth="3"/>
            <circle cx="34" cy="26" r="2" fill="#1a1a1a"/>
            <circle cx="46" cy="26" r="2" fill="#1a1a1a"/>
            <path d="M34 35 Q40 40 46 35" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="40" cy="52" rx="16" ry="12" fill="none" stroke="#1a1a1a" strokeWidth="3"/>
            <ellipse cx="40" cy="66" rx="13" ry="9" fill="none" stroke="#1a1a1a" strokeWidth="3"/>
            <ellipse cx="40" cy="78" rx="10" ry="7" fill="none" stroke="#1a1a1a" strokeWidth="3"/>
            <path d="M24 54 Q10 52 12 62 Q14 70 24 66" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
            <path d="M56 54 Q70 52 68 62 Q66 70 56 66" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p className={styles.copyright}>Copyright © 2026 Guide MICHELIN.</p>
        </footer>
      </div>
    </div>
  )
}
