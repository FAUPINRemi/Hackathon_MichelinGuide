import { useState } from 'react'
import styles from './AddToListDialog.module.css'

export default function AddToListDialog({ item, type, lists, items, onAddToList, onRemoveFromList, onCreateList, onClose }) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const isInList = (listId) =>
    (items[listId] || []).some(i => i.id === item.id && i.type === type)

  const toggle = (listId) => {
    if (isInList(listId)) onRemoveFromList(listId, item.id, type)
    else onAddToList(listId, item, type)
  }

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    const id = onCreateList(name)
    onAddToList(id, item, type)
    setCreating(false)
    setNewName('')
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <span className={styles.title}>Enregistrer dans…</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className={styles.lists}>
          {lists.length === 0 && !creating && (
            <p className={styles.empty}>Aucune liste créée. Commencez par en créer une.</p>
          )}
          {lists.map(list => {
            const checked = isInList(list.id)
            return (
              <button key={list.id} className={`${styles.listRow} ${checked ? styles.active : ''}`} onClick={() => toggle(list.id)}>
                <span className={styles.listName}>{list.name}</span>
                {checked ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="11" fill="#c41230"/>
                    <path d="M7 12l3.5 3.5L17 8.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="11"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        <div className={styles.footer}>
          {creating ? (
            <div className={styles.createForm}>
              <input
                className={styles.input}
                autoFocus
                placeholder="Nom de la liste"
                value={newName}
                maxLength={50}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') { setCreating(false); setNewName('') }
                }}
              />
              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={() => { setCreating(false); setNewName('') }}>Annuler</button>
                <button className={styles.confirmBtn} onClick={handleCreate} disabled={!newName.trim()}>Créer</button>
              </div>
            </div>
          ) : (
            <button className={styles.newListBtn} onClick={() => setCreating(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c41230" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Nouvelle liste
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
