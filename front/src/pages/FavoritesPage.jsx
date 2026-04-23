import { useState, useEffect } from 'react'
import NoteDialog from '../components/feedback/NoteDialog'
import ListNameDialog from '../components/feedback/ListNameDialog'
import FavoriteItemCard from '../components/cards/FavoriteItemCard'
import ListCard from '../components/cards/ListCard'
import styles from './FavoritesPage.module.css'

function HeartIcon({ size = 22 }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 22 20" fill="none" aria-hidden="true">
      <path d="M0 6.357C0 10.881 3.954 15.327 9.917 19.189c.194.12.466.246.664.246.198 0 .47-.125.668-.246C17.208 15.327 21.162 10.881 21.162 6.357 21.162 2.64 18.604 0 15.183 0c-1.962 0-3.668 1.006-4.602 2.563C9.661 1.013 7.941 0 5.979 0 2.558 0 0 2.64 0 6.357Z" stroke="#ccc" strokeWidth="1.2" fill="none"/>
    </svg>
  )
}

export default function FavoritesPage({ lists, items, createList, renameList, deleteList, removeFromList, getNote, setNote, onItemClick }) {
  const [selectedList, setSelectedList] = useState(null)
  const [activeTab, setActiveTab] = useState('restaurants')
  const [showCreate, setShowCreate] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [noteEntry, setNoteEntry] = useState(null)

  useEffect(() => {
    if (selectedList && !lists.find(l => l.id === selectedList.id)) {
      setSelectedList(null)
    }
  }, [lists, selectedList])

  if (selectedList) {
    const list = lists.find(l => l.id === selectedList.id)
    if (!list) return null

    const listItems = items[list.id] || []
    const restaurants = listItems.filter(i => i.type === 'restaurant')
    const hotels = listItems.filter(i => i.type === 'hotel')
    const current = activeTab === 'restaurants' ? restaurants : hotels
    const entityLabel = activeTab === 'restaurants' ? 'restaurant' : 'séjour'

    return (
      <div className={styles.page}>
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={() => { setSelectedList(null); setShowMenu(false) }} aria-label="Retour">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <h1 className={styles.detailTitle}>{list.name}</h1>
          <div className={styles.menuWrap}>
            <button className={styles.menuBtn} onClick={() => setShowMenu(s => !s)} aria-label="Options">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {showMenu && (
              <div className={styles.menuDropdown}>
                <button onClick={() => { setShowRename(true); setShowMenu(false) }}>Renommer</button>
                <button className={styles.menuDelete} onClick={() => { deleteList(list.id); setSelectedList(null); setShowMenu(false) }}>
                  Supprimer la liste
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'restaurants' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('restaurants')}
          >
            Restaurants
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'hotels' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('hotels')}
          >
            Séjours
          </button>
        </div>

        <div className={styles.detailContent}>
          <p className={styles.countText}>
            {current.length} {entityLabel}{current.length > 1 ? 's' : ''}
          </p>

          {current.length === 0 ? (
            <p className={styles.emptyDetail}>
              Aucun {entityLabel} ajouté pour l'instant.
            </p>
          ) : (
            current.map(entry => (
              <FavoriteItemCard
                key={`${entry.type}-${entry.id}`}
                entry={entry}
                note={getNote(entry.id, entry.type)}
                onRemove={() => removeFromList(list.id, entry.id, entry.type)}
                onNoteOpen={() => setNoteEntry(entry)}
                onItemClick={onItemClick}
              />
            ))
          )}
        </div>

        {showRename && (
          <ListNameDialog
            title="Renommer la liste"
            initialValue={list.name}
            confirmLabel="Renommer"
            onConfirm={name => { renameList(list.id, name); setShowRename(false) }}
            onClose={() => setShowRename(false)}
          />
        )}
        {noteEntry && (
          <NoteDialog
            itemName={noteEntry.data.name}
            initialNote={getNote(noteEntry.id, noteEntry.type)}
            onSave={text => { setNote(noteEntry.id, noteEntry.type, text); setNoteEntry(null) }}
            onClose={() => setNoteEntry(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mes listes</h1>
      </div>

      {lists.length === 0 ? (
        <div className={styles.emptyPage}>
          <HeartIcon size={40} />
          <p>Aucune liste créée.</p>
          <p className={styles.emptyHint}>Appuyez sur&nbsp;<strong>+</strong>&nbsp;pour commencer.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {lists.map(list => (
            <ListCard
              key={list.id}
              list={list}
              listItems={items[list.id] || []}
              onClick={() => { setSelectedList(list); setActiveTab('restaurants') }}
            />
          ))}
        </div>
      )}

      <button className={styles.fab} onClick={() => setShowCreate(true)} aria-label="Créer une liste">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--white)" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {showCreate && (
        <ListNameDialog
          title="Nouvelle liste"
          confirmLabel="Créer"
          onConfirm={name => { createList(name); setShowCreate(false) }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
