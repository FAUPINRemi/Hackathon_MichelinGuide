import { useState, useCallback, useMemo } from 'react'

const KEY = 'michelin_favorites'
const uid = () => Math.random().toString(36).slice(2, 9)
const noteKey = (type, id) => `${type}-${id}`
const matchesItem = (i, id, type) => i.id === id && i.type === type

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { lists: [], items: {}, notes: {} }
    const data = JSON.parse(raw)
    return { lists: data.lists ?? [], items: data.items ?? {}, notes: data.notes ?? {} }
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
    setState(prev => {
      const next = fn(prev)
      if (next !== prev) persist(next)
      return next
    })
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
      const { [listId]: removed, ...restItems } = s.items
      const deletedKeys = new Set((removed || []).map(i => noteKey(i.type, i.id)))
      const notes = Object.fromEntries(
        Object.entries(s.notes).filter(([k]) => !deletedKeys.has(k))
      )
      return { lists: s.lists.filter(l => l.id !== listId), items: restItems, notes }
    })
  , [mutate])

  const addToList = useCallback((listId, item, type) =>
    mutate(s => {
      const arr = s.items[listId] || []
      if (arr.some(i => matchesItem(i, item.id, type))) return s
      return { ...s, items: { ...s.items, [listId]: [...arr, { id: item.id, type, data: item }] } }
    })
  , [mutate])

  const removeFromList = useCallback((listId, itemId, type) =>
    mutate(s => ({
      ...s,
      items: {
        ...s.items,
        [listId]: (s.items[listId] || []).filter(i => !matchesItem(i, itemId, type)),
      },
    }))
  , [mutate])

  const savedSet = useMemo(() => {
    const set = new Set()
    Object.values(state.items).forEach(arr =>
      arr.forEach(i => set.add(noteKey(i.type, i.id)))
    )
    return set
  }, [state.items])

  const isInList = useCallback((listId, itemId, type) =>
    (state.items[listId] || []).some(i => matchesItem(i, itemId, type))
  , [state.items])

  const isAnySaved = useCallback((itemId, type) =>
    savedSet.has(noteKey(type, itemId))
  , [savedSet])

  const setNote = useCallback((itemId, type, text) => {
    const key = noteKey(type, itemId)
    mutate(s => {
      const { [key]: _, ...rest } = s.notes
      return { ...s, notes: text.trim() ? { ...s.notes, [key]: text.trim() } : rest }
    })
  }, [mutate])

  const getNote = useCallback((itemId, type) =>
    state.notes[noteKey(type, itemId)] ?? ''
  , [state.notes])

  return {
    lists: state.lists,
    items: state.items,
    notes: state.notes,
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
