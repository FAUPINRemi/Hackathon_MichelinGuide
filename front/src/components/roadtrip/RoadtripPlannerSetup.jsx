import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import styles from './RoadtripPlannerSetup.module.css'

const DISTINCTION_OPTIONS = [
  { label: '3 étoiles', value: '3-stars-michelin' },
  { label: '2 étoiles', value: '2-stars-michelin' },
  { label: '1 étoile',  value: '1-star-michelin'  },
  { label: 'Bib',       value: 'bib-gourmand'      },
]

const BUDGET_OPTIONS = ['€', '€€', '€€€', '€€€€']

function WaypointInput({ waypoints, onChange }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const debounceRef = useRef(null)
  const wrapRef     = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    if (val.length < 2) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.roadtrip.geocode(val)
        setResults(data)
        setOpen(data.length > 0)
      } catch {
        setResults([])
        setOpen(false)
      }
    }, 400)
  }

  function addWaypoint(result) {
    if (!waypoints.some((w) => w.lat === result.lat && w.lng === result.lng)) {
      onChange([...waypoints, result])
    }
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function removeWaypoint(idx) {
    onChange(waypoints.filter((_, i) => i !== idx))
  }

  return (
    <div ref={wrapRef} className={styles.waypointWrap}>
      <div className={styles.waypointInputRow}>
        <input
          className={styles.input}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Rechercher une étape…"
          autoComplete="off"
        />
      </div>

      {open && results.length > 0 && (
        <ul className={styles.waypointDropdown}>
          {results.map((r, i) => (
            <li
              key={i}
              className={styles.waypointResult}
              onMouseDown={(e) => { e.preventDefault(); addWaypoint(r) }}
            >
              <span className={styles.waypointResultLabel}>{r.label}</span>
              <span className={styles.waypointResultSub}>{r.displayName.split(',').slice(1, 3).join(',').trim()}</span>
            </li>
          ))}
        </ul>
      )}

      {waypoints.length > 0 && (
        <div className={styles.waypointChips}>
          {waypoints.map((w, i) => (
            <span key={i} className={styles.waypointChip}>
              {w.label}
              <button
                className={styles.waypointChipRemove}
                onClick={() => removeWaypoint(i)}
                type="button"
                aria-label={`Retirer ${w.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RoadtripPlannerSetup({ setup, onChange, onSubmit, loading }) {
  function patch(key, value) {
    onChange({ ...setup, [key]: value })
  }

  function toggleDistinction(slug) {
    const slugs = setup.distinctionSlugs
    patch(
      'distinctionSlugs',
      slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug],
    )
  }

  const canSubmit = !loading && setup.origin.trim() && setup.destination.trim()

  return (
    <div className={styles.form}>
      <div className={styles.routeRow}>
        <div className={styles.field}>
          <label className={styles.label}>Départ</label>
          <input
            className={styles.input}
            type="text"
            value={setup.origin}
            onChange={(e) => patch('origin', e.target.value)}
            placeholder="Paris"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Arrivée</label>
          <input
            className={styles.input}
            type="text"
            value={setup.destination}
            onChange={(e) => patch('destination', e.target.value)}
            placeholder="Lyon"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Étapes intermédiaires</label>
        <WaypointInput
          waypoints={setup.waypoints}
          onChange={(wps) => patch('waypoints', wps)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Établissements</label>
        <div className={styles.pills}>
          {[
            { value: 'both',       label: 'Tout' },
            { value: 'restaurant', label: 'Restaurants' },
            { value: 'hotel',      label: 'Hôtels' },
          ].map(({ value, label }) => (
            <button
              key={value}
              className={`${styles.pill} ${setup.category === value ? styles.pillActive : ''}`}
              onClick={() => patch('category', value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Rayon autour du trajet — <strong>{setup.radiusKm} km</strong>
        </label>
        <input
          className={styles.range}
          type="range"
          min={5}
          max={50}
          step={5}
          value={setup.radiusKm}
          onChange={(e) => patch('radiusKm', Number(e.target.value))}
        />
        <div className={styles.rangeLabels}>
          <span>5 km</span>
          <span>50 km</span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Distinction Michelin</label>
        <div className={styles.pills}>
          {DISTINCTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.pill} ${setup.distinctionSlugs.includes(opt.value) ? styles.pillActive : ''}`}
              onClick={() => toggleDistinction(opt.value)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label}>Budget</label>
          <div className={styles.pills}>
            {BUDGET_OPTIONS.map((b) => (
              <button
                key={b}
                className={`${styles.pill} ${setup.budget === b ? styles.pillActive : ''}`}
                onClick={() => patch('budget', setup.budget === b ? '' : b)}
                type="button"
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Étoile Verte</label>
          <button
            className={`${styles.pill} ${setup.greenStar ? styles.pillGreenActive : ''}`}
            onClick={() => patch('greenStar', !setup.greenStar)}
            type="button"
          >
            {setup.greenStar ? 'Oui' : 'Non'}
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Cuisines (séparées par virgules)</label>
        <input
          className={styles.input}
          type="text"
          value={setup.cuisines}
          onChange={(e) => patch('cuisines', e.target.value)}
          placeholder="française, japonaise…"
        />
      </div>

      <button
        className={styles.submitBtn}
        onClick={onSubmit}
        disabled={!canSubmit}
        type="button"
      >
        {loading ? (
          <span className={styles.submitLoading}>
            <span className={styles.spinner} />
            Calcul du trajet…
          </span>
        ) : (
          'Planifier le trajet'
        )}
      </button>
    </div>
  )
}
