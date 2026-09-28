import { Star } from 'lucide-react'

interface RatingProps {
  value: number
  count?: number
  compact?: boolean
}

/** Yıldız puanı — 5 üzerinden, yarım yıldızları doldurarak gösterir. */
export default function Rating({ value, count, compact = false }: RatingProps) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <span className={`rating${compact ? ' rating--compact' : ''}`} aria-label={`Puan ${value.toFixed(1)} / 5`}>
      <span className="rating__stars" aria-hidden>
        {stars.map((star) => {
          const fill = Math.max(0, Math.min(1, value - (star - 1)))
          return (
            <span key={star} className="rating__star">
              <Star size={compact ? 12 : 14} className="rating__bg" />
              <span className="rating__fill" style={{ width: `${fill * 100}%` }}>
                <Star size={compact ? 12 : 14} />
              </span>
            </span>
          )
        })}
      </span>
      <b>{value.toFixed(1).replace('.', ',')}</b>
      {typeof count === 'number' && <em>({count})</em>}
    </span>
  )
}
