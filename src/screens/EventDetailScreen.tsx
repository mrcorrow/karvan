import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  ExternalLink,
  Info,
  MapPin,
  Navigation,
  Share2,
  Users,
  Wallet,
} from 'lucide-react'
import { useSocial } from '../store/SocialStore'
import { useToast } from '../components/Toast'
import { getCamp } from '../data/camps'
import { formatDate } from '../lib/format'
import { daysUntil, relativeDay } from '../lib/time'
import { useCountUp } from '../hooks/animations'
import MapView from '../components/MapView'
import AvatarStack from '../components/AvatarStack'
import Avatar from '../components/Avatar'
import Confetti from '../components/Confetti'
import EmptyState from '../components/EmptyState'

export default function EventDetailScreen() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { show } = useToast()
  const { getEvent, attendeesOf, attendeeCount, isJoined, toggleJoin, getUser, isFollowing, toggleFollow } =
    useSocial()
  const [celebrate, setCelebrate] = useState(false)

  const event = getEvent(eventId ?? '')
  const joined = event ? isJoined(event.id) : false
  const count = useCountUp(event ? attendeeCount(event) : 0, 800)

  if (!event) {
    return (
      <div className="screen">
        <header className="page-head">
          <button type="button" className="icon-btn" onClick={() => navigate('/etkinlikler')} aria-label="Geri">
            <ArrowLeft size={20} />
          </button>
          <h1>Buluşma bulunamadı</h1>
        </header>
        <EmptyState
          Icon={CalendarDays}
          title="Bu buluşma kaldırılmış"
          description="Diğer karavancı buluşmalarına göz atabilirsin."
          action={{ label: 'Buluşmaları gör', onClick: () => navigate('/etkinlikler') }}
        />
      </div>
    )
  }

  const host = getUser(event.hostId)
  const attendees = attendeesOf(event)
  const remaining = daysUntil(event.startDate)
  const fill = Math.min(100, Math.round((attendeeCount(event) / event.capacity) * 100))
  const camp = event.campId ? getCamp(event.campId) : undefined
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lon}`

  const join = () => {
    toggleJoin(event.id)
    if (!joined) {
      setCelebrate(true)
      window.setTimeout(() => setCelebrate(false), 1600)
      if (navigator.vibrate) navigator.vibrate([14, 40, 14])
      show(`${event.title} — yeriniz ayrıldı 🎉`)
    } else {
      show('Katılımınız iptal edildi')
    }
  }

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/etkinlik/${event.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.description, url })
        return
      }
      await navigator.clipboard.writeText(`${event.title} · ${url}`)
      show('Bağlantı kopyalandı')
    } catch {
      show('Paylaşım iptal edildi')
    }
  }

  return (
    <div className="screen screen--event">
      {celebrate && <Confetti count={30} />}

      <div className="hero hero--event">
        <img src={event.image} alt="" />
        <div className="hero__scrim" />
        <div className="hero__bar">
          <button type="button" className="icon-btn icon-btn--onimage" onClick={() => navigate(-1)} aria-label="Geri">
            <ArrowLeft size={20} />
          </button>
          <button type="button" className="icon-btn icon-btn--onimage" onClick={share} aria-label="Paylaş">
            <Share2 size={18} />
          </button>
        </div>
        <div className="hero__info">
          <span className="camp-card__type">
            {remaining > 1 ? `${remaining} gün kaldı` : relativeDay(event.startDate)}
          </span>
          <span className="camp-card__badge">Buluşma</span>
        </div>
      </div>

      <header className="detail-head">
        <h1>{event.title}</h1>
        <p className="detail-head__meta">
          <MapPin size={14} aria-hidden />
          {event.city}
          <span className="dot" />
          <CalendarDays size={14} aria-hidden />
          {formatDate(event.startDate)} – {formatDate(event.endDate)}
        </p>
        <div className="chip-row chip-row--wrap">
          {event.tags.map((tag) => (
            <span key={tag} className="chip chip--ghost">
              #{tag}
            </span>
          ))}
          <span className="chip chip--ghost">
            <Wallet size={12} aria-hidden />
            {event.fee === 0 ? 'Ücretsiz' : `${event.fee} ₺ / kişi`}
          </span>
        </div>
      </header>

      <section className="card">
        <div className="event-join">
          <div>
            <b>{Math.round(count)}</b> <span>/ {event.capacity} karavan</span>
            <em>kontenjan doluluk {fill}%</em>
          </div>
          <button
            type="button"
            className={`btn${joined ? ' btn--ghost is-joined' : ' btn--primary'}`}
            onClick={join}
            aria-pressed={joined}
          >
            {joined ? (
              <>
                <Check size={16} aria-hidden /> Katıldın
              </>
            ) : (
              'Katıl'
            )}
          </button>
        </div>
        <div className="capacity-bar capacity-bar--lg" role="presentation">
          <i style={{ width: `${fill}%` }} />
        </div>
        <div className="event-people">
          <AvatarStack users={attendees} max={6} size="md" />
          <span className="muted">
            <Users size={13} aria-hidden /> {attendees.length} karavancı katılıyor
          </span>
        </div>
      </section>

      <section className="card">
        <h2>Program</h2>
        <p className="prose">{event.description}</p>
      </section>

      {host && (
        <section className="card">
          <h2>
            <BadgeCheck size={16} aria-hidden /> Düzenleyen
          </h2>
          <div className="host-row">
            <Link to={`/karavanci/${host.id}`} className="host-row__person">
              <Avatar user={host} />
              <span>
                <b>{host.name}</b>
                <em>
                  {host.city} · {host.followers.toLocaleString('tr-TR')} takipçi
                </em>
              </span>
            </Link>
            <button
              type="button"
              className={`btn btn--sm${isFollowing(host.id) ? ' btn--ghost is-joined' : ' btn--primary'}`}
              onClick={() => toggleFollow(host.id)}
            >
              {isFollowing(host.id) ? 'Takiptesin' : 'Takip et'}
            </button>
          </div>
        </section>
      )}

      {attendees.length > 0 && (
        <section className="card">
          <h2>
            <Users size={16} aria-hidden /> Katılımcılar
          </h2>
          <ul className="attendee-list">
            {attendees.map((user, index) => (
              <li key={user.id} className="anim-rise" style={{ animationDelay: `${index * 45}ms` }}>
                <Link to={`/karavanci/${user.id}`}>
                  <Avatar user={user} size="sm" />
                  <span>
                    <b>{user.name}</b>
                    <em>
                      {user.city} · {user.plate || '—'}
                    </em>
                  </span>
                </Link>
                {user.id !== 'me' && (
                  <button
                    type="button"
                    className={`btn btn--sm${isFollowing(user.id) ? ' btn--ghost is-joined' : ' btn--ghost'}`}
                    onClick={() => toggleFollow(user.id)}
                  >
                    {isFollowing(user.id) ? 'Takiptesin' : 'Takip et'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card card--map">
        <h2>Buluşma noktası</h2>
        <MapView
          markers={[
            { id: event.id, lat: event.lat, lon: event.lon, label: event.title, highlight: true, kind: 'stop' },
          ]}
          fitToMarkers
          zoom={11}
          className="map-view--card"
        />
        <div className="map-links">
          <a className="btn btn--ghost btn--sm" href={mapsUrl} target="_blank" rel="noreferrer">
            <Navigation size={15} aria-hidden /> Yol tarifi
          </a>
          {camp && (
            <Link className="btn btn--ghost btn--sm" to={`/kamp/${camp.id}`}>
              <ExternalLink size={15} aria-hidden /> {camp.name}
            </Link>
          )}
        </div>
      </section>

      <p className="demo-note">
        <Info size={14} aria-hidden />
        <span>
          Katılım bilgisi bu cihazda saklanır. Gerçek sürümde kontenjan, ödeme ve katılımcı listesi
          sunucudan yönetilir.
        </span>
      </p>
    </div>
  )
}
