import LegalPage from './LegalPage'
import styles from './LegalPage.module.css'

export default function ConditionsPage({ onBack }) {
  return (
    <LegalPage title="Conditions d'utilisation" onBack={onBack}>
      <h2>À propos</h2>
      <p>
        Bienvenue sur le site internet (le «&nbsp;Site&nbsp;») ou sur l'application mobile
        (l'«&nbsp;Application&nbsp;») Guide.michelin.com, exploités par la société{' '}
        <strong>Manufacture Française des Pneumatiques Michelin</strong>, filiale à 100 % du Groupe
        Michelin, SAS au capital de 504&nbsp;000&nbsp;004 €, immatriculée au RCS de
        Clermont-Ferrand sous le n° 855&nbsp;200&nbsp;507.
      </p>
      <p>
        Nous fournissons également un service de réservation de table de restaurant (le
        «&nbsp;Service de Réservation&nbsp;») via un fournisseur tiers (le «&nbsp;Partenaire de
        Réservation&nbsp;»).
      </p>

      <h2>Acceptation des conditions</h2>
      <p>
        En vous connectant au Site, vous vous engagez à respecter les présentes Conditions Générales
        d'Utilisation. Si vous n'acceptez pas ces conditions, vous devez renoncer à tout usage du
        Site ou de l'Application.
      </p>

      <h2>Accès au site ou à l'application</h2>
      <p>
        L'accès est autorisé sur une base temporaire. Nous nous réservons le droit de modifier,
        suspendre ou supprimer tout ou partie du Site sans préavis, notamment pour maintenance ou en
        cas d'urgence.
      </p>
      <p>
        Vous êtes responsable de veiller à ce que toutes les personnes accédant au Site via votre
        connexion aient connaissance des présentes conditions et s'y conforment.
      </p>

      <h2>Politique d'utilisation</h2>
      <p>Vous vous engagez à ne pas :</p>
      <ul>
        <li>utiliser le Site de manière illégale, frauduleuse ou pour collecter des données d'identification ;</li>
        <li>falsifier, dénaturer ou saper l'intégrité des avis, descriptions ou évaluations ;</li>
        <li>transmettre des messages publicitaires non sollicités ;</li>
        <li>introduire des virus, chevaux de Troie, logiciels espions ou tout programme malveillant ;</li>
        <li>décompiler ou procéder à la rétro-ingénierie de toute partie du Site ;</li>
        <li>utiliser des robots d'indexation ou tout autre moyen automatisé non autorisé.</li>
      </ul>

      <h2>Propriété intellectuelle</h2>
      <p>
        Tous les éléments du Site (textes, images, logos, base de données, etc.) sont protégés par
        le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation
        non autorisée est strictement interdite.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Nous déclinons toute responsabilité pour les dommages résultant d'une interruption du Site,
        de l'utilisation de données incorrectes, ou des contenus publiés par des tiers. Les
        informations fournies le sont à titre indicatif et ne constituent pas des conseils
        professionnels.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement de vos données personnelles est régi par notre Politique de confidentialité,
        disponible dans les mentions légales de l'application. Nous collectons uniquement les données
        nécessaires à la fourniture de nos services.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. Tout litige sera soumis à la
        compétence exclusive des tribunaux de Paris, sauf disposition légale contraire applicable aux
        consommateurs.
      </p>

      <h2>Contact</h2>
      <div className={styles.infoBlock}>
        <p><strong>Manufacture Française des Pneumatiques Michelin</strong></p>
        <p>23, Place des Carmes-Déchaux — 63000 Clermont-Ferrand, France</p>
      </div>

      <p className={styles.meta}>Dernière mise à jour : 2024</p>
    </LegalPage>
  )
}
