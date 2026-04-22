import { useState, useCallback } from 'react'

const KEY = 'michelin_favorites'
const uid = () => Math.random().toString(36).slice(2, 9)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : { lists: [], items: {}, notes: {} }
  } catch {
    return { lists: [], items: {}, notes: {} }
  }
}

function persist(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function useFavorites() {
  const [state, setState] = useState(load)

  const mutate = useCallback((fn) => {
    setState(prev => { const next = fn(prev); persist(next); return next })
  }, [])

  const createList = useCallback((name) => {
    const id = uid()
    mutate(s => ({ ...s, lists: [...s.lists, { id, name }], items: { ...s.items, [id]: [] } }))
    return id
  }, [mutate])

  const renameList = useCallback((listId, name) =>
    mutate(s => ({ ...s, lists: s.lists.map(l => l.id === listId ? { ...l, name } : l) }))
  , [mutate])

  const deleteList = useCallback((listId) =>
    mutate(s => {
      const { [listId]: _, ...rest } = s.items
      return { lists: s.lists.filter(l => l.id !== listId), items: rest }
    })
  , [mutate])

  const addToList = useCallback((listId, item, type) =>
    mutate(s => {
      const arr = s.items[listId] || []
      if (arr.some(i => i.id === item.id && i.type === type)) return s
      return { ...s, items: { ...s.items, [listId]: [...arr, { id: item.id, type, data: item }] } }
    })
  , [mutate])

  const removeFromList = useCallback((listId, itemId, type) =>
    mutate(s => ({
      ...s,
      items: {
        ...s.items,
        [listId]: (s.items[listId] || []).filter(i => !(i.id === itemId && i.type === type)),
      },
    }))
  , [mutate])

  const isInList = useCallback((listId, itemId, type) =>
    (state.items[listId] || []).some(i => i.id === itemId && i.type === type)
  , [state])

  const isAnySaved = useCallback((itemId, type) =>
    Object.values(state.items).some(arr => arr.some(i => i.id === itemId && i.type === type))
  , [state])

  const setNote = useCallback((itemId, type, text) => {
    const key = `${type}-${itemId}`
    mutate(s => ({
      ...s,
      notes: text.trim() ? { ...s.notes, [key]: text.trim() } : Object.fromEntries(Object.entries(s.notes ?? {}).filter(([k]) => k !== key)),
    }))
  }, [mutate])

  const getNote = useCallback((itemId, type) =>
    (state.notes ?? {})[`${type}-${itemId}`] ?? ''
  , [state])

  return {
    lists: state.lists,
    items: state.items,
    notes: state.notes ?? {},
    createList,
    renameList,
    deleteList,
    addToList,
    removeFromList,
    isInList,
    isAnySaved,
    setNote,
    getNote,
  }
}
