/* Michelin rosette / flower icon — SVG reproducing the 6-petal shape */
export function MichelinRosette({ size = 20, color = '#c41230' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 2C10.9 2 10 2.9 10 4c0 .37.1.71.28 1A4 4 0 0 0 8 8.27V8a2 2 0 1 0-4 0c0 .74.4 1.38 1 1.73A4 4 0 0 0 4 12a4 4 0 0 0 1 2.27A2 2 0 0 0 4 16a2 2 0 0 0 4 0v-.27A4 4 0 0 0 10 18.73c-.18.29-.28.63-.28 1A2 2 0 1 0 12 22a2 2 0 0 0 2.28-2.27A4 4 0 0 0 16 18.73V19a2 2 0 1 0 4-1.73A4 4 0 0 0 21 15.27V16a2 2 0 0 0-1-1.73A4 4 0 0 0 20 12a4 4 0 0 0-1-2.27A2 2 0 0 0 20 8a2 2 0 0 0-4 0v.27A4 4 0 0 0 14 5c.18-.29.28-.63.28-1A2 2 0 0 0 12 2z" />
    </svg>
  )
}

/* Simplified 6-petal rosette — closer to Michelin's actual icon */
export function MichelinFlower({ size = 18, color = '#c41230' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill={color} aria-hidden="true">
      <ellipse cx="16" cy="6" rx="4" ry="6" />
      <ellipse cx="16" cy="26" rx="4" ry="6" />
      <ellipse cx="6" cy="11" rx="4" ry="6" transform="rotate(-60 6 11)" />
      <ellipse cx="26" cy="11" rx="4" ry="6" transform="rotate(60 26 11)" />
      <ellipse cx="6" cy="21" rx="4" ry="6" transform="rotate(60 6 21)" />
      <ellipse cx="26" cy="21" rx="4" ry="6" transform="rotate(-60 26 21)" />
      <circle cx="16" cy="16" r="4.5" fill={color} />
    </svg>
  )
}
