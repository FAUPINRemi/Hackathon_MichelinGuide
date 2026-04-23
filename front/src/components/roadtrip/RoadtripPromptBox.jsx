import styles from './RoadtripPromptBox.module.css'

export default function RoadtripPromptBox({ value, onChange }) {
  return (
    <div className={styles.wrap}>
      <label className={styles.label}>Décrivez votre road trip</label>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex : De Paris à Marseille avec 2 restaurants étoilés et 1 hôtel, cuisine méditerranéenne, budget €€€, max 20 min de détour par arrêt."
        rows={6}
      />
      <p className={styles.hint}>
        Mentionnez l&apos;origine, la destination, vos préférences (cuisine, budget, distinction) et vos contraintes de détour.
      </p>
    </div>
  )
}
