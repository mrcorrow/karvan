import { Link } from 'react-router-dom'
import { Heart, MapPin, Navigation } from 'lucide-react'
import type { Camp } from '../types'
import { formatDistance, distanceKm } from '../lib/geo'
import { formatPrice } from '../lib/format'
import { TYPE_LABEL, sceneryTerm, amenityTerm } from '../data/taxonomy'
import Rating from './Rating'

interface CampCardProps {
  camp: Camp
  favorite: boolean
  onToggleFavorite: (id: string) => void
  /** Kullanıcı konumu varsa kart üzerinde mesafe gösterilir. */
  userLocation?: { lat: number; lon: number } | null
  /** Yatay kaydırılan şerit görünümü. */
  variant?: 'vertical' | 'rail'
}

export default function CampCard({
  camp,
  favorite,
  onToggleFavorite,
  userLocation = null,
  variant = 'vertical',
}: CampCardProps) {
  const distance = userLocation ? distanceKm(userLocation, camp) : null
  const topScenery = camp.scenery.slice(0, 2).map((key) => sceneryTerm(key).label)
  const topAmenities = camp.amenities.slice(0, 3).map((key) => amenityTerm(key))

  return (
    <article className={`camp-card${variant === 'rail' ? ' camp-card--rail' : ''}`}>
      <Link to={`/kamp/${camp.id}`} className="camp-card__media">
        <img src={camp.image} alt={camp.name} loading="lazy" decoding="async" />
        <span className="camp-card__type">{TYPE_LABEL[camp.type]}</span>
        {camp.featured && <span className="camp-card__badge">Editör seçimi</span>}
      </Link>
      <button
        type="button"
        className={`camp-card__fav${favorite ? ' is-active' : ''}`}
        onClick={() => onToggleFavorite(camp.id)}
        aria-pressed={favorite}
        aria-label={favorite ? `${camp.name} favorilerden çıkar` : `${camp.name} favorilere ekle`}
      >
        <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
      </button>

      <div className="camp-card__body">
        <div className="camp-card__head">
          <Link to={`/kamp/${camp.id}`} className="camp-card__title">
            <h3>{camp.name}</h3>
          </Link>
          <Rating value={camp.rating} count={camp.reviewCount} compact />
        </div>

        <p className="camp-card__meta">
          <MapPin size={13} aria-hidden />
          {camp.district}, {camp.city}
          {distance !== null && (
            <>
              <span className="dot" />
              <Navigation size={13} aria-hidden />
              {formatDistance(distance)}
            </>
          )}
        </p>

        <p className="camp-card__summary">{camp.summary}</p>

        <ul className="camp-card__chips">
          {topScenery.map((label) => (
            <li key={label} className="chip chip--ghost">
              {label}
            </li>
          ))}
          {topAmenities.map((term) => (
            <li key={term.key} className="chip chip--ghost">
              <term.Icon size={12} aria-hidden />
              {term.label}
            </li>
          ))}
          {camp.amenities.length > 3 && (
            <li className="chip chip--ghost">+{camp.amenities.length - 3}</li>
          )}
        </ul>

        <div className="camp-card__foot">
          <span className="camp-card__price">
            {formatPrice(camp.price)}
            <em>/ gece</em>
          </span>
          <Link to={`/kamp/${camp.id}`} className="btn btn--sm btn--primary">
            Detay
          </Link>
        </div>
      </div>
    </article>
  )
}
