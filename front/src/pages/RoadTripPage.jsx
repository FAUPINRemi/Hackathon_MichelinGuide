import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import RoadtripForm from '../components/roadtrip/RoadtripForm'
import RoadtripPromptBox from '../components/roadtrip/RoadtripPromptBox'
import RoadtripPlaceCard from '../components/roadtrip/RoadtripPlaceCard'
import styles from './RoadTripPage.module.css'

const RoadtripMapLeaflet = lazy(() => import('../components/roadtrip/RoadtripMapLeaflet'))

function decodePolyline(encoded) {
  if (!encoded) return []
  let index = 0, lat = 0, lng = 0
  const points = []
  while (index < encoded.length) {
    let shift = 0, result = 0, byte = 0
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : result >> 1
    shift = 0; result = 0
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : result >> 1
    points.push([lat / 1e5, lng / 1e5])
  }
  return points
}

const FORM_INIT = {
  originLabel: 'Paris',
  destLabel: 'Lyon',
  category: 'both',
  cuisines: '',
  budget: '',
  distinctionSlugs: [],
  greenStar: false,
}

function buildPayload(mode, form, freeText) {
  if (mode === 'free_text') {
    return { input_mode: 'free_text', freeText }
  }
  const categories = form.category === 'both' ? ['restaurant', 'hotel'] : [form.category]
  return {
    input_mode: 'form',
    form: {
      origin: { label: form.originLabel || null, lat: null, lng: null },
      destination: { label: form.destLabel || null, lat: null, lng: null },
      categories,
      cuisines: form.cuisines.split(',').map((s) => s.trim()).filter(Boolean),
      budget: form.budget ? [form.budget] : [],
      distinction_slugs: form.distinctionSlugs,
      green_star: form.greenStar || null,
    },
  }
}

function isFormValid(mode, form, freeText) {
  if (mode === 'free_text') return freeText.trim().length > 0
  return (form.originLabel?.trim().length > 0) && (form.destLabel?.trim().length > 0)
}

function buildGoogleMapsUrl(origin, destination, stops) {
  if (!origin?.lat || !destination?.lat) return null
  const wps = stops.filter((s) => s.lat != null).map((s) => `${s.lat},${s.lng}`).join('|')
  return (
    'https://www.google.com/maps/dir/?api=1' +
    `&origin=${origin.lat},${origin.lng}` +
    `&destination=${destination.lat},${destination.lng}` +
    (wps ? `&waypoints=${encodeURIComponent(wps)}` : '')
  )
}

function buildWazeUrl(destination) {
  if (!destination?.lat) return null
  return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`
}

export default function RoadTripPage() {
  const [mode, setMode] = useState('form')
  const [freeText, setFreeText] = useState('')
  const [form, setForm] = useState(FORM_INIT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [highlightedId, setHighlightedId] = useState(null)
  const highlightTimer = useRef(null)

  const patchForm = useCallback((patch) => setForm((prev) => ({ ...prev, ...patch })), [])

  const enrichedStops = useMemo(() => {
    if (!result) return []
    const candidateMap = new Map()
    ;(result.candidates ?? []).forEach((c) => candidateMap.set(`${c.category}:${c.id}`, c))
    const detourMap = new Map()
    ;(result.route?.stop_detours ?? []).forEach((d) => detourMap.set(`${d.category}:${d.id}`, d.detour_minutes))

    return (result.selected?.selected?.stops ?? []).map((stop) => {
      const c = candidateMap.get(`${stop.category}:${stop.id}`) ?? {}
      return {
        ...c,
        ...stop,
        detour_minutes: detourMap.get(`${stop.category}:${stop.id}`) ?? null,
      }
    })
  }, [result])

  const routePolyline = useMemo(() => {
    const encoded = result?.route?.polyline_with_stops || result?.route?.polyline_direct || ''
    return decodePolyline(encoded)
  }, [result])

  const origin = result?.parse?.route?.origin ?? null
  const destination = result?.parse?.route?.destination ?? null
  const googleMapsUrl = buildGoogleMapsUrl(origin, destination, enrichedStops)
  const wazeUrl = buildWazeUrl(destination)

  const handleBuild = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const payload = buildPayload(mode, form, freeText)
      const data = await api.roadtrip.build(payload)
      setResult(data)
    } catch (err) {
      setError(err?.message || 'Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  const scrollToCard = useCallback((stopId) => {
    const el = document.getElementById(`stop-${stopId}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    clearTimeout(highlightTimer.current)
    setHighlightedId(stopId)
    highlightTimer.current = setTimeout(() => setHighlightedId(null), 1800)
  }, [])

  const valid = isFormValid(mode, form, freeText)

  return (
    <div className={styles.page}>
      <section className={styles.mapPanel}>
        <div className={styles.mapFrame}>
          <Suspense fallback={<div className={styles.mapSkeleton} />}>
            <RoadtripMapLeaflet
              origin={origin}
              destination={destination}
              stops={enrichedStops.filter((s) => s.lat != null)}
              polyline={routePolyline}
              onScrollToCard={scrollToCard}
            />
          </Suspense>
        </div>

        {result && (
          <div className={styles.metricsRow}>
            <article className={styles.metricCard}>
              <p className={styles.metricLabel}>Trajet direct</p>
              <p className={styles.metricValue}>{result.route?.direct_duration_minutes ?? '–'} min</p>
            </article>
            <article className={styles.metricCard}>
              <p className={styles.metricLabel}>Avec arrêts</p>
              <p className={styles.metricValue}>{result.route?.with_stops_duration_minutes ?? '–'} min</p>
            </article>
            <article className={`${styles.metricCard} ${styles.metricDetour}`}>
              <p className={styles.metricLabel}>Détour total</p>
              <p className={styles.metricValue}>+{result.route?.total_detour_minutes ?? '–'} min</p>
            </article>
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.modeTabs}>
          <button
            className={`${styles.modeBtn} ${mode === 'form' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('form')}
          >
            Formulaire
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'free_text' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('free_text')}
          >
            Prompt IA
          </button>
        </div>

        {mode === 'free_text' ? (
          <RoadtripPromptBox value={freeText} onChange={setFreeText} />
        ) : (
          <RoadtripForm form={form} onChange={patchForm} />
        )}

        <button
          className={styles.submitBtn}
          onClick={handleBuild}
          disabled={loading || !valid}
        >
          {loading ? (
            <span className={styles.submitLoading}>
              <span className={styles.spinner} />
              Génération en cours…
            </span>
          ) : (
            '🗺️ Générer mon road trip'
          )}
        </button>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {result && enrichedStops.length > 0 && (
          <div className={styles.results}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>
                {enrichedStops.length} arrêt{enrichedStops.length > 1 ? 's' : ''} sélectionné{enrichedStops.length > 1 ? 's' : ''}
              </h2>

              {(googleMapsUrl || wazeUrl) && (
                <div className={styles.navBtns}>
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.navBtn} ${styles.navBtnGmaps}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Google Maps
                    </a>
                  )}
                  {wazeUrl && (
                    <a
                      href={wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.navBtn} ${styles.navBtnWaze}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20.54 6.63C19.08 3.93 16.2 2 13 2 8.03 2 4 6.03 4 11c0 1.5.38 2.91 1.04 4.15L4 20l5.02-1.33C10.27 19.53 11.6 20 13 20c4.97 0 9-4.03 9-9 0-1.63-.44-3.16-1.21-4.47l-.25.1z"/>
                      </svg>
                      Waze
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className={styles.cardList}>
              {enrichedStops.map((stop) => (
                <RoadtripPlaceCard
                  key={`${stop.category}-${stop.id}`}
                  stop={stop}
                  isHighlighted={highlightedId === `${stop.category}-${stop.id}`}
                />
              ))}
            </div>

            {(result.selected?.notes?.length > 0 || result.parse?.notes?.length > 0) && (
              <details className={styles.notesBox}>
                <summary className={styles.notesTitle}>Notes de l&apos;IA</summary>
                <div className={styles.notesList}>
                  {[...(result.parse?.notes ?? []), ...(result.selected?.notes ?? [])].map((n, i) => (
                    <p key={i} className={styles.noteItem}>{n}</p>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {result && enrichedStops.length === 0 && (
          <p className={styles.emptyMsg}>Aucun arrêt trouvé pour ce trajet. Essayez d&apos;élargir vos critères.</p>
        )}
      </section>
    </div>
  )
}
