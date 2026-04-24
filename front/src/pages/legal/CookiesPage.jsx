import { useState } from 'react'
import styles from './CookiesPage.module.css'

const PURPOSES = [
  { id: 'scan',        label: 'Analyser les caractéristiques de l\'appareil' },
  { id: 'content_ltd', label: 'Utiliser des données limitées pour la sélection de contenu' },
  { id: 'geo',         label: 'Stocker et accéder à des données de géolocalisation à des fins marketing' },
  { id: 'perf',        label: 'Mesurer la performance du contenu' },
  { id: 'improve',     label: 'Développer et améliorer les services' },
  { id: 'geo_precise', label: 'Utiliser des données de géolocalisation précises' },
  { id: 'profiles',    label: 'Créer des profils pour personnaliser le contenu' },
  { id: 'select',      label: 'Utiliser des profils pour sélectionner du contenu personnalisé' },
  { id: 'store',       label: 'Stocker des informations sur un appareil ou y accéder' },
  { id: 'ab',          label: 'Tests A/B' },
  { id: 'personal',    label: 'Personnalisation' },
  { id: 'ad_perf',     label: 'Mesurer la performance publicitaire' },
  { id: 'ad_profiles', label: 'Créer des profils pour la publicité personnalisée' },
  { id: 'ad_ltd',      label: 'Utiliser des données limitées pour la sélection de publicités' },
  { id: 'audience',    label: 'Comprendre les audiences via des combinaisons de données' },
  { id: 'ad_select',   label: 'Utiliser des profils pour sélectionner des publicités personnalisées' },
]

const PARTNERS = [
  { id: 'branch',   name: 'Branch' },
  { id: 'criteo',   name: 'Criteo SA' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'google',   name: 'Google Advertising Products' },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

export default function CookiesPage({ onBack }) {
  const initPurposes = Object.fromEntries(PURPOSES.map(p => [p.id, true]))
  const initPartners = Object.fromEntries(PARTNERS.map(p => [p.id, true]))

  const [purposes, setPurposes] = useState(initPurposes)
  const [partners, setPartners] = useState(initPartners)
  const [showPartners, setShowPartners] = useState(false)
  const [saved, setSaved] = useState(false)

  const allPurposesOn = PURPOSES.every(p => purposes[p.id])
  const allPartnersOn = PARTNERS.every(p => partners[p.id])

  const toggleAllPurposes = (val) =>
    setPurposes(Object.fromEntries(PURPOSES.map(p => [p.id, val])))

  const toggleAllPartners = (val) =>
    setPartners(Object.fromEntries(PARTNERS.map(p => [p.id, val])))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Retour">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className={styles.title}>Gestion de vos cookies</h1>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <p className={styles.intro}>
          Nous et nos partenaires utilisons des technologies (cookies, stockage local) pour personnaliser
          les contenus et publicités, et améliorer notre site. Activez ou désactivez chaque finalité
          ci-dessous.
        </p>

        {/* Global toggle */}
        <div className={styles.globalRow}>
          <span className={styles.globalLabel}>Tout autoriser</span>
          <Toggle checked={allPurposesOn} onChange={toggleAllPurposes} />
        </div>

        {/* Purpose list */}
        <div className={styles.purposeList}>
          {PURPOSES.map(p => (
            <div key={p.id} className={styles.purposeRow}>
              <span className={styles.purposeLabel}>{p.label}</span>
              <Toggle
                checked={purposes[p.id]}
                onChange={val => setPurposes(prev => ({ ...prev, [p.id]: val }))}
              />
            </div>
          ))}
        </div>

        {/* View partners button */}
        <button className={styles.partnersBtn} onClick={() => setShowPartners(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Voir nos partenaires
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      {/* Sticky save bar */}
      <div className={styles.saveBar}>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`}
          onClick={handleSave}
        >
          {saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              Préférences enregistrées
            </>
          ) : 'Enregistrer mes choix'}
        </button>
        <button className={styles.acceptAllBtn} onClick={() => { toggleAllPurposes(true); handleSave() }}>
          Tout accepter
        </button>
      </div>

      {/* Partners panel */}
      {showPartners && (
        <div className={styles.panelOverlay} onClick={() => setShowPartners(false)}>
          <div className={styles.panel} onClick={e => e.stopPropagation()}>
            <div className={styles.panelHeader}>
              <button className={styles.panelClose} onClick={() => setShowPartners(false)} aria-label="Fermer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <h2 className={styles.panelTitle}>Partenaires Guide MICHELIN</h2>
              <button className={styles.panelX} onClick={() => setShowPartners(false)} aria-label="Fermer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <p className={styles.panelIntro}>
              Cliquez sur le nom d'un partenaire pour en savoir plus sur ses pratiques de collecte
              de données. Activez ou désactivez chacun individuellement.
            </p>

            {/* All partners toggle */}
            <div className={styles.partnerRowAll}>
              <span className={styles.partnerLabel}><strong>Tous les partenaires</strong></span>
              <Toggle checked={allPartnersOn} onChange={toggleAllPartners} />
            </div>

            <div className={styles.partnerList}>
              {PARTNERS.map(p => (
                <div key={p.id} className={styles.partnerRow}>
                  <span className={styles.partnerLabel}>{p.name}</span>
                  <Toggle
                    checked={partners[p.id]}
                    onChange={val => setPartners(prev => ({ ...prev, [p.id]: val }))}
                  />
                </div>
              ))}
            </div>

            <div className={styles.panelFooter}>
              <div className={styles.didomiBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Carl Rémi & Icham security</span>
              </div>
              <button className={styles.panelSave} onClick={() => setShowPartners(false)}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
