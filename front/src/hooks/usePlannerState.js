import { useCallback, useRef, useState } from 'react'
import { api } from '../api/client'

const SETUP_INIT = {
  origin: '',
  destination: '',
  waypoints: [],  
  radiusKm: 10,
  category: 'both',
  budget: '',
  cuisines: '',
  distinctionSlugs: [],
  greenStar: false,
}

function buildPrefs(setup) {
  const categories = setup.category === 'both'
    ? ['restaurant', 'hotel']
    : [setup.category]
  return {
    categories,
    cuisines: setup.cuisines.split(',').map((s) => s.trim()).filter(Boolean),
    budget: setup.budget ? [setup.budget] : [],
    distinctionSlugs: setup.distinctionSlugs,
    greenStar: setup.greenStar || null,
    radiusKm: setup.radiusKm,
    limit: 40,
  }
}

export function usePlannerState() {
  const [step, setStep] = useState('setup')          // 'setup' | 'browsing'
  const [setup, setSetup] = useState(SETUP_INIT)
  const [routeData, setRouteData] = useState(null)   // { origin, destination, polyline, durationMinutes, samplePoints }
  const [suggestions, setSuggestions] = useState([]) // Candidate[]
  const [selectedStops, setSelectedStops] = useState([]) // enriched Candidate[]
  const [routeResult, setRouteResult] = useState(null)   // RoadtripRouteResult
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [error, setError] = useState('')

  // Ref to always read latest selectedStops inside async callbacks
  const selectedStopsRef = useRef(selectedStops)
  selectedStopsRef.current = selectedStops

  const fetchSuggestions = useCallback(async (samplePoints, excludeStops, currentSetup) => {
    setLoadingNearby(true)
    try {
      const prefs = buildPrefs(currentSetup ?? setup)
      const excludeIds = excludeStops.map((s) => ({ category: s.category, id: s.id }))
      const data = await api.roadtrip.nearby({ routePoints: samplePoints, excludeIds, preferences: prefs })
      setSuggestions(data.candidates ?? [])
    } catch {
      // Non-blocking — suggestions just won't update
    } finally {
      setLoadingNearby(false)
    }
  }, [setup])

  const planRoute = useCallback(async () => {
    if (!setup.origin.trim() || !setup.destination.trim()) return
    setError('')
    setLoadingRoute(true)
    try {
      const data = await api.roadtrip.plan({
        origin: setup.origin,
        destination: setup.destination,
        waypoints: setup.waypoints,
      })
      setRouteData(data)
      setSelectedStops([])
      setRouteResult(null)
      await fetchSuggestions(data.samplePoints, [], setup)
      setStep('browsing')
    } catch (err) {
      setError(err?.message || 'Impossible de calculer le trajet')
    } finally {
      setLoadingRoute(false)
    }
  }, [setup, fetchSuggestions])

  const addStop = useCallback(async (candidate) => {
    const current = selectedStopsRef.current
    if (current.some((s) => s.category === candidate.category && s.id === candidate.id)) return

    const next = [...current, candidate]
    setSelectedStops(next)

    // Recompute route with new stop
    setLoadingRoute(true)
    try {
      const result = await api.roadtrip.compute({
        origin: routeData.origin,
        destination: routeData.destination,
        waypoints: (routeData.waypoints ?? []).map((w) => ({ lat: w.lat, lng: w.lng })),
        stops: next.map((s) => ({ lat: s.lat, lng: s.lng, category: s.category, id: s.id })),
      })
      setRouteResult(result)
    } catch {
      // Route compute failed — stop still shows in list
    } finally {
      setLoadingRoute(false)
    }

    // Refresh suggestions excluding all selected stops
    await fetchSuggestions(routeData.samplePoints, next, setup)
  }, [routeData, setup, fetchSuggestions])

  const removeStop = useCallback(async (category, id) => {
    const next = selectedStopsRef.current.filter(
      (s) => !(s.category === category && s.id === id),
    )
    setSelectedStops(next)

    if (next.length === 0) {
      setRouteResult(null)
    } else {
      setLoadingRoute(true)
      try {
        const result = await api.roadtrip.compute({
          origin: routeData.origin,
          destination: routeData.destination,
          waypoints: (routeData.waypoints ?? []).map((w) => ({ lat: w.lat, lng: w.lng })),
          stops: next.map((s) => ({ lat: s.lat, lng: s.lng, category: s.category, id: s.id })),
        })
        setRouteResult(result)
      } catch {
        // silently ignore
      } finally {
        setLoadingRoute(false)
      }
    }

    // Re-add removed stop back to suggestions
    await fetchSuggestions(routeData.samplePoints, next, setup)
  }, [routeData, setup, fetchSuggestions])

  const refreshSuggestions = useCallback(async (newSetup) => {
    if (!routeData) return
    setSetup(newSetup)
    await fetchSuggestions(routeData.samplePoints, selectedStopsRef.current, newSetup)
  }, [routeData, fetchSuggestions])

  const reset = useCallback(() => {
    setStep('setup')
    setRouteData(null)
    setSuggestions([])
    setSelectedStops([])
    setRouteResult(null)
    setError('')
  }, [])

  return {
    step,
    setup, setSetup,
    routeData,
    suggestions,
    selectedStops,
    routeResult,
    loadingRoute,
    loadingNearby,
    error,
    planRoute,
    addStop,
    removeStop,
    refreshSuggestions,
    reset,
  }
}
