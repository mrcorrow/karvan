import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import type { CommunityEvent } from '../types'
import { useSocial } from '../store/SocialStore'
import { daysUntil, relativeDay } from '../lib/time'
import { formatDate } from '../lib/format'
import AvatarStack from './AvatarStack'

interface EventCardProps {
  event: CommunityEvent
  variant?: 'vertical' | 'rail'
  index?: number
}

export default function EventCard({ event, variant = 'vertical', index = 0 }: EventCardProps) {
  const { attendeesOf, attendeeCount, isJoined, toggleJoin } = useSocial()
  const attendees = attendeesOf(event)
  const count = attendeeCount(event)
  const joined = isJoined(event.id)
  const remaining = daysUntil(event.startDate)
  const fill = Math.min(100, Math.round((count / event.capacity) * 100))

  return (
    <article
      className={`event-card${variant === 'rail' ? ' event-card--rail' : ''} anim-rise`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <Link to={`/etkinlik/${event.id}`} className="event-card__media">
        <img src={event.image} alt="" loading="lazy" decoding="async" />
        <span className="event-card__countdown">
          {remaining > 1 ? `${remaining} gün kaldı` : relativeDay(event.startDate)}
        </span>
      </Link>
      <div className="event-card__body">
        <Link to={`/etkinlik/${event.id}`}>
          <h3>{event.title}</h3>
        </Link>
        <p className="event-card__meta">
          <CalendarDays size={13} aria-hidden />
          {formatDate(event.startDate)} – {formatDate(event.endDate)}
        </p>
        <p className="event-card__meta">
          <MapPin size={13} aria-hidden />
          {event.city} · {event.campId ? 'Tesis içinde' : 'Serbest kamp'}
        </p>

        <div className="event-card__people">
          <AvatarStack users={attendees} />
          <span className="event-card__capacity">
            <Users size={13} aria-hidden />
            {count}/{event.capacity}
          </span>
        </div>

        <div className="capacity-bar" role="presentation">
          <i style={{ width: `${fill}%` }} />
        </div>

        <div className="event-card__foot">
          <span className="event-card__fee">{event.fee === 0 ? 'Ücretsiz' : `${event.fee} ₺ / kişi`}</span>
          <button
            type="button"
            className={`btn btn--sm${joined ? ' btn--ghost is-joined' : ' btn--primary'}`}
            onClick={() => toggleJoin(event.id)}
            aria-pressed={joined}
          >
            {joined ? 'Katıldın ✓' : 'Katıl'}
          </button>
        </div>
      </div>
    </article>
  )
}
