import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.logo}>Guide <span>MICHELIN</span></div>

      <div className={styles.links}>
        <div className={styles.col}>
          <p className={styles.colTitle}>Restaurants</p>
          <a href="#">Restaurants étoilés</a>
          <a href="#">Bib Gourmand</a>
          <a href="#">Assiette MICHELIN</a>
          <a href="#">Étoile verte</a>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Hôtels</p>
          <a href="#">Clés MICHELIN</a>
          <a href="#">Hébergements</a>
          <a href="#">Tourisme durable</a>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Destinations</p>
          <a href="#">Paris</a>
          <a href="#">Lyon</a>
          <a href="#">Bordeaux</a>
          <a href="#">Toutes les villes</a>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>MICHELIN</p>
          <a href="#">À propos</a>
          <a href="#">Presse</a>
          <a href="#">Recrutement</a>
        </div>
      </div>

      <div className={styles.social}>
        {['f', '📷', '𝕏', '▶'].map((icon, i) => (
          <a key={i} href="#" className={styles.socialLink}>{icon}</a>
        ))}
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomLinks}>
          <a href="#">Mentions légales</a>
          <a href="#">Confidentialité</a>
          <a href="#">Cookies</a>
          <a href="#">CGU</a>
        </div>
        <p>© 2025 Michelin. Tous droits réservés.</p>
      </div>
    </footer>
  )
}
