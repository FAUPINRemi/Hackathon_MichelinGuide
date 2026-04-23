import LegalPage from './LegalPage'
import styles from './LegalPage.module.css'

export default function AccessibilitePage({ onBack }) {
  return (
    <LegalPage title="Accessibilité" onBack={onBack}>
      <h2>État de conformité</h2>
      <p>
        Le Guide MICHELIN s'engage à rendre son site accessible conformément à l'article 47 de la loi
        n° 2005-102 du 11 février 2005. Cette déclaration s'applique au site{' '}
        <strong>https://guide.michelin.com/fr/fr/</strong>.
      </p>
      <p>
        Le site du Guide MICHELIN est <strong>non conforme</strong> avec le RGAA en raison des
        non-conformités listées ci-dessous.
      </p>

      <h2>Résultats de l'audit</h2>
      <p>L'audit de conformité RGAA 4.1.2 réalisé en interne révèle que :</p>
      <div className={styles.infoBlock}>
        <p><strong>34,55 %</strong> des critères RGAA sont respectés</p>
        <p>Critères conformes : <strong>19</strong></p>
        <p>Critères non conformes : <strong>36</strong></p>
        <p>Critères non applicables : <strong>51</strong></p>
      </div>

      <h2>Contenus non accessibles</h2>
      <p>Les principaux critères non conformes identifiés :</p>
      <ul>
        <li>Alternatives textuelles manquantes sur certaines images porteuses d'information</li>
        <li>Contrastes insuffisants pour certains textes et composants d'interface</li>
        <li>Cadres (<code>iframe</code>) sans titre pertinent</li>
        <li>Information transmise uniquement par la couleur dans certains cas</li>
        <li>Liens dont l'intitulé n'est pas explicite hors contexte</li>
        <li>Certains scripts non compatibles avec les technologies d'assistance</li>
        <li>Structure de titres incohérente sur certaines pages</li>
        <li>Absence de lien d'évitement vers la zone de contenu principal</li>
        <li>Messages de statut non restitués par les technologies d'assistance</li>
        <li>Champs de formulaire sans étiquette associée</li>
      </ul>

      <h2>Établissement de la déclaration</h2>
      <div className={styles.infoBlock}>
        <p>Déclaration établie le : <strong>10 décembre 2024</strong></p>
        <p>Technologies : HTML, CSS, JavaScript</p>
        <p>Environnement de test : Windows 10, Firefox 133, NVDA 2024.4.1</p>
      </div>

      <h3>Outils utilisés</h3>
      <ul>
        <li>Inspecteurs de code et d'accessibilité Firefox</li>
        <li>Extensions : WCAG Color Contrast Checker, HeadingsMap, Web Developer, RGAA Assistant</li>
        <li>Loupe Windows</li>
        <li>Validateur HTML du W3C</li>
      </ul>

      <h2>Retour d'information et contact</h2>
      <p>
        Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le
        responsable du site pour être orienté vers une alternative accessible ou obtenir le contenu
        sous une autre forme.
      </p>

      <h2>Voies de recours</h2>
      <p>
        Si vous avez signalé un défaut d'accessibilité et n'avez pas obtenu de réponse satisfaisante,
        vous pouvez :
      </p>
      <ul>
        <li>Écrire un message au Défenseur des droits</li>
        <li>Contacter le délégué du Défenseur des droits dans votre région</li>
        <li>Envoyer un courrier au Défenseur des droits (réponse libre, sans affranchissement)</li>
      </ul>

      <p className={styles.meta}>Déclaration établie le 10 décembre 2024</p>
    </LegalPage>
  )
}
