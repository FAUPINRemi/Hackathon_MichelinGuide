import { useState, useCallback } from 'react'

const KEY = 'michelin_itineraries'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { itineraries: [] }
    const data = JSON.parse(raw)
    return { itineraries: data.itineraries ?? [] }
  } catch {
    return { itineraries: [] }
  }
}

function persist(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function useItineraries() {
  const [state, setState] = useState(load)

  const mutate = useCallback((fn) => {
    setState(prev => {
      const next = fn(prev)
      persist(next)
      return next
    })
  }, [])

  const saveItinerary = useCallback(({ name, origin, destination, stops, googleMapsUrl }) => {
    const itinerary = {
      id: Date.now().toString(),
      name: name || `${origin?.label ?? '?'} → ${destination?.label ?? '?'}`,
      origin,
      destination,
      stops,
      googleMapsUrl,
      createdAt: new Date().toISOString(),
    }
    mutate(s => ({ itineraries: [itinerary, ...s.itineraries] }))
    return itinerary
  }, [mutate])

  const deleteItinerary = useCallback((id) => {
    mutate(s => ({ itineraries: s.itineraries.filter(i => i.id !== id) }))
  }, [mutate])

  return {
    itineraries: state.itineraries,
    saveItinerary,
    deleteItinerary,
  }
}
