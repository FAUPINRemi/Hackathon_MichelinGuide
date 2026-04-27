import { lazy, Suspense } from 'react'
import styles from './RestaurantMap.module.css'

const LeafletDetailMap = lazy(() => import('./LeafletDetailMap'))

export default function DetailMap({ lat, lng, name, distinctionSlug, distinctionScore, type }) {
  if (!lat || !lng) return null
  return (
    <div className={styles.map} style={{ minHeight: '100%' }}>
      <Suspense fallback={<div style={{ width: '100%', height: '100%', background: 'var(--green-bg-alt)' }} />}>
        <LeafletDetailMap lat={lat} lng={lng} name={name} distinctionSlug={distinctionSlug} distinctionScore={distinctionScore} type={type} />
      </Suspense>
    </div>
  )
}
