import LegalPage from './LegalPage'
import styles from './LegalPage.module.css'

export default function NoticeLegalePage({ onBack }) {
  return (
    <LegalPage title="Notice légale" onBack={onBack}>
      <h2>Éditeur du site</h2>
      <div className={styles.infoBlock}>
        <p><strong>Manufacture Française des Pneumatiques Michelin</strong></p>
        <p>Société par actions simplifiée au capital social de 504 000 004 €</p>
        <p>855 200 507 RCS Clermont-Ferrand</p>
        <p>23, Place des Carmes-Déchaux — 63000 Clermont-Ferrand, France</p>
        <p>Téléphone / Fax : +33 (0)1 55 19 57 00 / 01</p>
        <p>N° TVA intracommunautaire : FR33855200507</p>
      </div>
      <p>
        Les informations disponibles dans cette notice légale sont applicables à l'application mobile
        et au site web Guide MICHELIN.com, accessible via{' '}
        <strong>https://guide.michelin.com</strong>.
      </p>

      <h2>Directeur de la publication</h2>
      <p>
        M. Gwendal Poullennec, Directeur de la Ligne Business Expériences de Mobilités.
      </p>

      <h2>Hébergeur</h2>
      <div className={styles.infoBlock}>
        <p><strong>Amazon Web Services LLC</strong></p>
        <p>PO Box 81226 — Seattle, WA 98108-1226 — États-Unis</p>
        <p>Tél. : +1 206 266 4064 — Fax : +1 206 266 7010</p>
      </div>

      <p className={styles.meta}>Version 2 — Février 2022</p>
    </LegalPage>
  )
}
