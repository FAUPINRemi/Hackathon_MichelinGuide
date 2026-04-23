import styles from './RoadtripForm.module.css'

// Slugs must match DB values exactly (distinction->>'slug')
const DISTINCTIONS = [
  { slug: '1-star-michelin', label: '1 Étoile' },
  { slug: '2-stars-michelin', label: '2 Étoiles' },
  { slug: '3-stars-michelin', label: '3 Étoiles' },
  { slug: 'bib-gourmand', label: 'Bib Gourmand' },
]

export default function RoadtripForm({ form, onChange }) {
  const {
    originLabel, destLabel, category,
    cuisines, budget,
    distinctionSlugs, greenStar,
  } = form

  const toggleDistinction = (slug) => {
    const next = distinctionSlugs.includes(slug)
      ? distinctionSlugs.filter((s) => s !== slug)
      : [...distinctionSlugs, slug]
    onChange({ distinctionSlugs: next })
  }

  return (
    <div className={styles.grid}>
      <div className={styles.row}>
        <label className={styles.label}>Départ</label>
        <input
          className={styles.input}
          value={originLabel}
          onChange={(e) => onChange({ originLabel: e.target.value })}
          placeholder="Paris, France"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Arrivée</label>
        <input
          className={styles.input}
          value={destLabel}
          onChange={(e) => onChange({ destLabel: e.target.value })}
          placeholder="Lyon, France"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Catégories</label>
        <div className={styles.pills}>
          {[
            { id: 'restaurant', label: 'Restaurants' },
            { id: 'hotel', label: 'Hôtels' },
            { id: 'both', label: 'Les deux' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.pill} ${category === item.id ? styles.pillActive : ''}`}
              onClick={() => onChange({ category: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Distinction</label>
        <div className={styles.pills}>
          {DISTINCTIONS.map((d) => (
            <button
              key={d.slug}
              type="button"
              className={`${styles.pill} ${distinctionSlugs.includes(d.slug) ? styles.pillActive : ''}`}
              onClick={() => toggleDistinction(d.slug)}
            >
              {d.label}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.pill} ${styles.pillGreen} ${greenStar ? styles.pillGreenActive : ''}`}
            onClick={() => onChange({ greenStar: !greenStar })}
          >
            Étoile Verte
          </button>
        </div>
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Budget</label>
        <div className={styles.pills}>
          {['€', '€€', '€€€', '€€€€'].map((b) => (
            <button
              key={b}
              type="button"
              className={`${styles.pill} ${budget === b ? styles.pillActive : ''}`}
              onClick={() => onChange({ budget: budget === b ? '' : b })}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Cuisines (séparées par virgule)</label>
        <input
          className={styles.input}
          value={cuisines}
          onChange={(e) => onChange({ cuisines: e.target.value })}
          placeholder="italienne, fruits de mer, japonaise…"
        />
      </div>
    </div>
  )
}
