import styles from './SearchBar.module.css'

export default function SearchBar({ value, onChange, placeholder = 'Rechercher dans le Guide MICHELIN' }) {
  return (
    <div className={styles.wrap}>
      <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        className={styles.input}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
