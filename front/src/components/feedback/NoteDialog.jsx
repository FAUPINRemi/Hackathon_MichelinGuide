import { useState } from 'react'
import styles from './NoteDialog.module.css'

export default function NoteDialog({ itemName, initialNote = '', onSave, onClose }) {
  const [text, setText] = useState(initialNote)

  const handleSave = () => {
    onSave(text)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.bubble} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span className={styles.title}>Ma note personnelle</span>
          </div>
          <p className={styles.itemName}>{itemName}</p>
        </div>

        <textarea
          className={styles.textarea}
          autoFocus
          placeholder="Rédigez votre avis personnel, vos impressions, ce que vous souhaitez retenir…"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={1000}
          rows={5}
        />

        <div className={styles.footer}>
          <span className={styles.charCount}>{text.length}/1000</span>
          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={onClose}>Annuler</button>
            <button className={styles.saveBtn} onClick={handleSave}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
