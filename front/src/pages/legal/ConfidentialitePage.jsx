import LegalPage from './LegalPage'
import styles from './LegalPage.module.css'

export default function ConfidentialitePage({ onBack }) {
  return (
    <LegalPage title="Politique de confidentialité" onBack={onBack}>
      <p>
        Michelin s'attache à protéger vos informations personnelles et à adopter une démarche claire
        et transparente quant aux données que nous collectons et à la manière dont nous les utilisons.
      </p>

      <h2>Qui nous sommes</h2>
      <div className={styles.infoBlock}>
        <p><strong>Manufacture Française des Pneumatiques Michelin</strong></p>
        <p>Responsable du traitement</p>
        <p>30, cours de l'Île Seguin — 92105 Boulogne-Billancourt Cedex</p>
        <p>Tél. : +33 (0)4 73 32 20 00</p>
      </div>

      <h2>Champ d'application</h2>
      <p>
        Cette politique s'applique au site web <strong>Guide MICHELIN</strong> et à l'application
        mobile disponible sur les stores. Elle décrit le traitement des données collectées lorsque
        vous utilisez nos services.
      </p>

      <h2>Délégué à la protection des données</h2>
      <p>
        Michelin dispose d'un Délégué à la Protection des Données (DPO) en charge de tous les
        aspects liés aux données personnelles. Vous pouvez le contacter par courrier postal adressé
        au <strong>Compliance Support Group / Données personnelles</strong>, à l'adresse
        ci-dessus.
      </p>

      <h2>Données collectées</h2>
      <p>Nous sommes susceptibles de collecter les catégories de données suivantes :</p>
      <ul>
        <li><strong>Données de compte</strong> : nom, adresse e-mail, préférences</li>
        <li><strong>Données de navigation</strong> : pages consultées, recherches, favoris</li>
        <li><strong>Données marketing</strong> : consentement aux communications, abonnements newsletter</li>
        <li><strong>Données techniques</strong> : adresse IP, type d'appareil, navigateur</li>
        <li><strong>Données de localisation</strong> : position approximative si autorisée</li>
      </ul>

      <h2>Finalités du traitement</h2>
      <ul>
        <li>Fournir et améliorer nos services de découverte gastronomique</li>
        <li>Personnaliser votre expérience et vos recommandations</li>
        <li>Vous envoyer des communications si vous y avez consenti</li>
        <li>Assurer la sécurité et prévenir la fraude</li>
        <li>Respecter nos obligations légales</li>
      </ul>

      <h2>Bases légales</h2>
      <ul>
        <li><strong>Consentement</strong> : communications marketing, cookies non essentiels</li>
        <li><strong>Exécution du contrat</strong> : fonctionnement du compte et des services</li>
        <li><strong>Intérêt légitime</strong> : amélioration des services, sécurité</li>
        <li><strong>Obligation légale</strong> : conservation de certaines données</li>
      </ul>

      <h2>Conservation des données</h2>
      <p>
        Vos données sont conservées le temps nécessaire aux finalités pour lesquelles elles ont été
        collectées, ou conformément aux obligations légales applicables. Les données marketing sont
        conservées <strong>3 ans</strong> après le dernier contact.
      </p>

      <h2>Vos droits</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li>Droit d'accès à vos données personnelles</li>
        <li>Droit de rectification des données inexactes</li>
        <li>Droit à l'effacement (« droit à l'oubli »)</li>
        <li>Droit à la limitation du traitement</li>
        <li>Droit à la portabilité de vos données</li>
        <li>Droit d'opposition au traitement</li>
        <li>Droit de retirer votre consentement à tout moment</li>
      </ul>

      <h2>Transferts internationaux</h2>
      <p>
        Certaines de vos données peuvent être transférées vers des pays hors Union Européenne.
        Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types,
        décisions d'adéquation de la Commission européenne).
      </p>

      <h2>Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
        vos données contre tout accès non autorisé, perte ou divulgation.
      </p>

      <h2>Modifications</h2>
      <p>
        Nous pouvons mettre à jour cette politique à tout moment. La version en vigueur est
        disponible sur le Site. Toute modification substantielle vous sera notifiée.
      </p>

      <p className={styles.meta}>Dernière mise à jour : 2026</p>
    </LegalPage>
  )
}
