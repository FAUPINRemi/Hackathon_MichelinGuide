import styles from './InstallBanner.module.css'

export default function InstallBanner({ visible, onInstall, onDismiss }) {
  return (
    <div className={`${styles.banner} ${visible ? styles.visible : ''}`} role="dialog" aria-label="Installer l'application">
      <span className={styles.icon}>⭐</span>
      <div className={styles.text}>
        <div className={styles.title}>Installer l'app</div>
        <div className={styles.sub}>Accès rapide &amp; hors ligne</div>
      </div>
      <button className={styles.installBtn} onClick={onInstall}>Installer</button>
      <button className={styles.closeBtn} onClick={onDismiss} aria-label="Fermer">✕</button>
    </div>
  )
}
