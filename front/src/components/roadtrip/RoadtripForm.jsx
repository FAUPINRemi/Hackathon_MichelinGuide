import styles from './RoadtripForm.module.css'

const DISTINCTIONS = [
  { slug: '1-star', label: '⭐ 1 Étoile' },
  { slug: '2-stars', label: '⭐⭐ 2 Étoiles' },
  { slug: '3-stars', label: '⭐⭐⭐ 3 Étoiles' },
  { slug: 'bib-gourmand', label: '😊 Bib Gourmand' },
]

const DISTRIBUTIONS = [
  { value: 'near_route', label: 'Près de la route' },
  { value: 'balanced', label: 'Équilibré' },
  { value: 'near_cities', label: 'Près des villes' },
]

export default function RoadtripForm({ form, onChange }) {
  const {
    originLabel, destLabel, category,
    cuisines, budget,
    distinctionSlugs, greenStar,
    maxDetourPerStop, maxTotalDetour,
    distributionStrategy,
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
            🌿 Étoile Verte
          </button>
        </div>
      </div>

      <div className={styles.inlineRow}>
        <div className={styles.row}>
          <label className={styles.label}>Budget</label>
          <select
            className={styles.select}
            value={budget}
            onChange={(e) => onChange({ budget: e.target.value })}
          >
            <option value="">Tous</option>
            <option value="€">€</option>
            <option value="€€">€€</option>
            <option value="€€€">€€€</option>
            <option value="€€€€">€€€€</option>
          </select>
        </div>

        <div className={styles.row}>
          <label className={styles.label}>Stratégie</label>
          <select
            className={styles.select}
            value={distributionStrategy}
            onChange={(e) => onChange({ distributionStrategy: e.target.value })}
          >
            {DISTRIBUTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Cuisines (virgule-séparées)</label>
        <input
          className={styles.input}
          value={cuisines}
          onChange={(e) => onChange({ cuisines: e.target.value })}
          placeholder="italienne, fruits de mer, japonaise…"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Contraintes de détour</label>
        <div className={styles.inlineRow}>
          <div className={styles.detourField}>
            <span className={styles.hint}>Max / arrêt (min)</span>
            <input
              type="number"
              className={styles.input}
              value={maxDetourPerStop ?? ''}
              onChange={(e) => onChange({ maxDetourPerStop: e.target.value ? Number(e.target.value) : null })}
              placeholder="20"
              min="1"
            />
          </div>
          <div className={styles.detourField}>
            <span className={styles.hint}>Max total (min)</span>
            <input
              type="number"
              className={styles.input}
              value={maxTotalDetour ?? ''}
              onChange={(e) => onChange({ maxTotalDetour: e.target.value ? Number(e.target.value) : null })}
              placeholder="60"
              min="1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
