import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../api/client'
import SearchBar from '../components/filters/SearchBar'
import styles from './RoadTripPage.module.css'

function decodeGooglePolyline(encoded) {
  if (!encoded) return []

  let index = 0
  let lat = 0
  let lng = 0
  const points = []

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1)
    lat += deltaLat

    shift = 0
    result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1)
    lng += deltaLng

    points.push([lat / 1e5, lng / 1e5])
  }

  return points
}

function AutoFitBounds({ points }) {
  const map = useMap()

  useEffect(() => {
    if (!points.length) return
    map.fitBounds(points, { padding: [24, 24] })
  }, [map, points])

  return null
}

export default function RoadTripPage() {
  const [mode, setMode] = useState('form')
  const [freeText, setFreeText] = useState('')

  const [originLabel, setOriginLabel] = useState('Paris')
  const [destLabel, setDestLabel] = useState('Lyon')

  const [category, setCategory] = useState('both')
  const [cuisines, setCuisines] = useState('')
  const [budget, setBudget] = useState('€€')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const selectedStops = result?.selected?.selected?.stops ?? []
  const stopDetours = result?.route?.stop_detours ?? []
  const candidateIndex = useMemo(() => {
    const map = new Map()
    ;(result?.candidates ?? []).forEach((c) => map.set(`${c.category}:${c.id}`, c))
    return map
  }, [result])

  const selectedMarkers = useMemo(() => {
    const points = []
    selectedStops.forEach((stop) => {
      const c = candidateIndex.get(`${stop.category}:${stop.id}`)
      if (c) points.push({ lat: c.lat, lng: c.lng })
    })
    return points
  }, [selectedStops, candidateIndex])

  const routePolyline = useMemo(() => {
    const encoded = result?.route?.polyline_with_stops || result?.route?.polyline_direct || ''
    return decodeGooglePolyline(encoded)
  }, [result])

  const fitPoints = useMemo(() => {
    if (routePolyline.length) return routePolyline
    return selectedMarkers.map((p) => [p.lat, p.lng])
  }, [routePolyline, selectedMarkers])

  const handleBuild = async () => {
    setLoading(true)
    setError('')
    try {
      const categories = category === 'both' ? ['restaurant', 'hotel'] : [category]
      const payload = mode === 'free_text'
        ? {
            input_mode: 'free_text',
            freeText,
          }
        : {
            input_mode: 'form',
            form: {
              origin: { label: originLabel || null, lat: null, lng: null },
              destination: { label: destLabel || null, lat: null, lng: null },
              categories,
              cuisines: cuisines.split(',').map((s) => s.trim()).filter(Boolean),
              budget: budget ? [budget] : [],
            },
          }

      const data = await api.roadtrip.build(payload)
      setResult(data)
    } catch (err) {
      setError(err?.message || 'Erreur serveur roadtrip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.mapPanel}>
        <MapContainer center={[46.6, 2.2]} zoom={6} className={styles.mapFrame}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {routePolyline.length > 1 && (
            <Polyline positions={routePolyline} pathOptions={{ color: '#d71920', weight: 4 }} />
          )}
          {selectedStops.map((stop) => {
            const candidate = candidateIndex.get(`${stop.category}:${stop.id}`)
            if (!candidate) return null
            const detour = stopDetours.find((d) => d.category === stop.category && d.id === stop.id)
            return (
              <CircleMarker
                key={`${stop.category}-${stop.id}`}
                center={[candidate.lat, candidate.lng]}
                radius={8}
                pathOptions={{
                  color: stop.category === 'restaurant' ? '#d71920' : '#1f2937',
                  fillColor: stop.category === 'restaurant' ? '#f87171' : '#4b5563',
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <strong>{candidate.name}</strong>
                  <br />
                  {candidate.city || 'Ville inconnue'}
                  <br />
                  {stop.category} - priorite {stop.priority}
                  <br />
                  +{detour?.detour_minutes ?? '-'} min
                </Popup>
              </CircleMarker>
            )
          })}
          {!!fitPoints.length && <AutoFitBounds points={fitPoints} />}
        </MapContainer>
        <div className={styles.metricsRow}>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Direct</p>
            <p className={styles.metricValue}>{result?.route?.direct_duration_minutes ?? '-'} min</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Avec arrets</p>
            <p className={styles.metricValue}>{result?.route?.with_stops_duration_minutes ?? '-'} min</p>
          </article>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>Detour total</p>
            <p className={styles.metricValue}>+{result?.route?.total_detour_minutes ?? '-'} min</p>
          </article>
        </div>
      </section>

      <section className={styles.detailsPanel}>
        <div className={styles.modeTabs}>
          <button className={`${styles.modeBtn} ${mode === 'form' ? styles.modeBtnActive : ''}`} onClick={() => setMode('form')}>
            Formulaire
          </button>
          <button className={`${styles.modeBtn} ${mode === 'free_text' ? styles.modeBtnActive : ''}`} onClick={() => setMode('free_text')}>
            Prompt
          </button>
        </div>

        {mode === 'free_text' ? (
          <div className={styles.formGrid}>
            <label className={styles.fieldLabel}>Prompt libre</label>
            <textarea
              className={styles.textarea}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Ex: De Paris a Lyon avec 2 restaurants italiens budget €€€, max 20 min de detour"
            />
          </div>
        ) : (
          <div className={styles.formGrid}>
            <label className={styles.fieldLabel}>Depart</label>
            <SearchBar value={originLabel} onChange={setOriginLabel} placeholder="Ville de depart" />

            <label className={styles.fieldLabel}>Arrivee</label>
            <SearchBar value={destLabel} onChange={setDestLabel} placeholder="Ville d'arrivee" />

            <label className={styles.fieldLabel}>Categories</label>
            <div className={styles.pills}>
              {[
                { id: 'restaurant', label: 'Restaurants' },
                { id: 'hotel', label: 'Hotels' },
                { id: 'both', label: 'Les deux' },
              ].map((item) => (
                <button
                  key={item.id}
                  className={`${styles.pillBtn} ${category === item.id ? styles.pillBtnActive : ''}`}
                  onClick={() => setCategory(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className={styles.fieldLabel}>Cuisines (virgules)</label>
            <input className={styles.input} value={cuisines} onChange={(e) => setCuisines(e.target.value)} placeholder="italian, seafood, japanese" />

            <label className={styles.fieldLabel}>Budget</label>
            <select className={styles.select} value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option value="€">€</option>
              <option value="€€">€€</option>
              <option value="€€€">€€€</option>
              <option value="€€€€">€€€€</option>
            </select>

          </div>
        )}

        <button className={styles.submitBtn} onClick={handleBuild} disabled={loading}>
          {loading ? 'Generation...' : 'Generer le road trip'}
        </button>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {!!result && (
          <>
            <div className={styles.cardList}>
              {selectedStops.map((stop) => {
                const candidate = candidateIndex.get(`${stop.category}:${stop.id}`)
                const detour = stopDetours.find((d) => d.category === stop.category && d.id === stop.id)
                return (
                  <article className={styles.stopCard} key={`${stop.category}-${stop.id}`}>
                    <div className={styles.stopTop}>
                      <p className={styles.stopType}>{stop.category}</p>
                      <p className={styles.stopPriority}>Priorite {stop.priority}</p>
                    </div>
                    <h3 className={styles.stopTitle}>{candidate?.name || `Stop #${stop.id}`}</h3>
                    <p className={styles.stopMeta}>{candidate?.city || 'Localisation inconnue'}</p>
                    <p className={styles.stopReason}>{stop.reason}</p>
                    <p className={styles.stopDetour}>+{detour?.detour_minutes ?? '-'} min</p>
                  </article>
                )
              })}
            </div>

            <div className={styles.notesBox}>
              <p className={styles.notesTitle}>Notes LLM</p>
              {(result?.parse?.notes || []).map((n, idx) => (
                <p className={styles.noteItem} key={`p-${idx}`}>{n}</p>
              ))}
              {(result?.selected?.notes || []).map((n, idx) => (
                <p className={styles.noteItem} key={`s-${idx}`}>{n}</p>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
