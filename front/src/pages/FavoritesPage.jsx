import { useState } from 'react'
import etoileSvg from '../assets/svg/etoile_michelin.svg'
import NoteDialog from '../components/feedback/NoteDialog'
import styles from './FavoritesPage.module.css'

// ─── Icônes ──────────────────────────────────────────────────────────────────

function HeartIcon({ size = 22 }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 22 20" fill="none" aria-hidden="true">
      <path d="M0 6.357C0 10.881 3.954 15.327 9.917 19.189c.194.12.466.246.664.246.198 0 .47-.125.668-.246C17.208 15.327 21.162 10.881 21.162 6.357 21.162 2.64 18.604 0 15.183 0c-1.962 0-3.668 1.006-4.602 2.563C9.661 1.013 7.941 0 5.979 0 2.558 0 0 2.64 0 6.357Z" stroke="#ccc" strokeWidth="1.2" fill="none"/>
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── CreateListDialog ────────────────────────────────────────────────────────

function CreateListDialog({ onConfirm, onClose }) {
  const [name, setName] = useState('')
  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialogBox} onClick={e => e.stopPropagation()}>
        <p className={styles.dialogTitle}>Nouvelle liste</p>
        <input
          className={styles.dialogInput}
          autoFocus
          placeholder="Nom de la liste"
          value={name}
          maxLength={50}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && name.trim()) onConfirm(name.trim())
            if (e.key === 'Escape') onClose()
          }}
        />
        <div className={styles.dialogActions}>
          <button className={styles.dialogCancel} onClick={onClose}>Annuler</button>
          <button className={styles.dialogConfirm} disabled={!name.trim()} onClick={() => onConfirm(name.trim())}>Créer</button>
        </div>
      </div>
    </div>
  )
}

// ─── ListCard ─────────────────────────────────────────────────────────────────

function ListCard({ list, listItems, onClick }) {
  const count = listItems.length
  const previewImg = count > 0 ? listItems[0].data?.img : null

  return (
    <button className={styles.listCard} onClick={onClick}>
      <div className={styles.listCardThumb}>
        {previewImg ? (
          <img src={previewImg} alt="" className={styles.listCardImg} />
        ) : (
          <div className={styles.listCardEmpty}>
            <HeartIcon size={28} />
            <span className={styles.listCardEmptyText}>Cette liste est vide.</span>
          </div>
        )}
        {count > 0 && <span className={styles.listCardCount}>{count}</span>}
      </div>
      <div className={styles.listCardLabel}>{list.name}</div>
    </button>
  )
}

// ─── FavoriteItemCard ─────────────────────────────────────────────────────────

function FavoriteItemCard({ entry, note, onRemove, onNoteOpen, onItemClick }) {
  const { data, type } = entry
  const isRestaurant = type === 'restaurant'

  const stars = isRestaurant ? (data.stars ?? 0) : 0
  const label = isRestaurant
    ? [data.price, data.cuisine].filter(Boolean).join(' · ')
    : [data.location, data.numRooms ? `${data.numRooms} chambres` : ''].filter(Boolean).join(' · ')

  return (
    <div className={styles.itemCard}>
      <button className={styles.itemCardTop} onClick={() => onItemClick?.(data, type)} aria-label={`Voir ${data.name}`}>
        <div className={styles.itemCardInfo}>
          {isRestaurant && stars > 0 && (
            <div className={styles.itemStars}>
              {Array.from({ length: stars }).map((_, i) => (
                <img key={i} src={etoileSvg} width={14} height={14} alt="" aria-hidden="true" />
              ))}
            </div>
          )}
          {!isRestaurant && (
            <p className={styles.itemType}>Hébergement MICHELIN</p>
          )}
          <h3 className={styles.itemName}>{data.name}</h3>
          <p className={styles.itemMeta}>{data.location}</p>
          {label ? <p className={styles.itemSub}>{label}</p> : null}
          {note && <p className={styles.notePreview}>📝 {note}</p>}
        </div>
        {data.img ? (
          <img src={data.img} alt={data.name} className={styles.itemThumb} />
        ) : (
          <div className={styles.itemThumbPlaceholder} />
        )}
      </button>

      <div className={styles.itemCardActions}>
        <button className={`${styles.actionBtn} ${note ? styles.actionActive : ''}`} onClick={e => { e.stopPropagation(); onNoteOpen?.() }} aria-label="Note personnelle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={note ? '#1a1a1a' : '#aaa'} strokeWidth="1.5" strokeLinecap="round">
            <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className={styles.actionBtn} aria-label="Déjà visité" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12l3 3 5-5"/>
          </svg>
        </button>
        <button className={styles.actionBtn} onClick={e => { e.stopPropagation(); onRemove?.() }} aria-label="Retirer des favoris">
          <svg width="18" height="16" viewBox="0 0 22 20" fill="#c41230" aria-hidden="true">
            <path d="M0 6.357C0 10.881 3.954 15.327 9.917 19.189c.194.12.466.246.664.246.198 0 .47-.125.668-.246C17.208 15.327 21.162 10.881 21.162 6.357 21.162 2.64 18.604 0 15.183 0c-1.962 0-3.668 1.006-4.602 2.563C9.661 1.013 7.941 0 5.979 0 2.558 0 0 2.64 0 6.357Z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── RenameDialog ─────────────────────────────────────────────────────────────

function RenameDialog({ currentName, onConfirm, onClose }) {
  const [name, setName] = useState(currentName)
  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialogBox} onClick={e => e.stopPropagation()}>
        <p className={styles.dialogTitle}>Renommer la liste</p>
        <input
          className={styles.dialogInput}
          autoFocus
          value={name}
          maxLength={50}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && name.trim()) onConfirm(name.trim())
            if (e.key === 'Escape') onClose()
          }}
        />
        <div className={styles.dialogActions}>
          <button className={styles.dialogCancel} onClick={onClose}>Annuler</button>
          <button className={styles.dialogConfirm} disabled={!name.trim()} onClick={() => onConfirm(name.trim())}>Renommer</button>
        </div>
      </div>
    </div>
  )
}

// ─── FavoritesPage ────────────────────────────────────────────────────────────

export default function FavoritesPage({ lists, items, createList, renameList, deleteList, removeFromList, getNote, setNote, onItemClick }) {
  const [selectedList, setSelectedList] = useState(null)
  const [activeTab, setActiveTab] = useState('restaurants')
  const [showCreate, setShowCreate] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [noteEntry, setNoteEntry] = useState(null)

  const handleCreate = (name) => {
    createList(name)
    setShowCreate(false)
  }

  // ── Vue détail liste ──────────────────────────────────────────────────────
  if (selectedList) {
    const list = lists.find(l => l.id === selectedList.id)
    if (!list) { setSelectedList(null); return null }

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
                note={getNote?.(entry.id, entry.type)}
                onRemove={() => removeFromList(list.id, entry.id, entry.type)}
                onNoteOpen={() => setNoteEntry(entry)}
                onItemClick={onItemClick}
              />
            ))
          )}
        </div>

        {showRename && (
          <RenameDialog
            currentName={list.name}
            onConfirm={name => { renameList(list.id, name); setShowRename(false) }}
            onClose={() => setShowRename(false)}
          />
        )}
        {noteEntry && (
          <NoteDialog
            itemName={noteEntry.data.name}
            initialNote={getNote?.(noteEntry.id, noteEntry.type) ?? ''}
            onSave={text => { setNote?.(noteEntry.id, noteEntry.type, text); setNoteEntry(null) }}
            onClose={() => setNoteEntry(null)}
          />
        )}
      </div>
    )
  }

  // ── Vue grille des listes ─────────────────────────────────────────────────
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {showCreate && <CreateListDialog onConfirm={handleCreate} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
