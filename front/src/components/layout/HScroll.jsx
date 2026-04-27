import styles from './HScroll.module.css'

export default function HScroll({ children }) {
  return <div className={styles.hscroll}>{children}</div>
}
