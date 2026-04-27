import { useState } from 'react'
import styles from './ListNameDialog.module.css'

export default function ListNameDialog({ title, initialValue = '', confirmLabel, onConfirm, onClose }) {
  const [name, setName] = useState(initialValue)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={e => e.stopPropagation()}>
        <p className={styles.title}>{title}</p>
        <input
          className={styles.input}
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
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose}>Annuler</button>
          <button className={styles.confirm} disabled={!name.trim()} onClick={() => onConfirm(name.trim())}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
