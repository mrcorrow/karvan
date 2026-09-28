import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Caravan,
  Check,
  Compass,
  Fuel,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Plus,
  Quote,
  Route,
  Share2,
  Star,
  Users,
  X,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useSocial } from '../store/SocialStore'
import { useToast } from '../components/Toast'
import { camps, getCamp } from '../data/camps'
import { amenityTerm, campTypeTerm, sceneryTerm, TYPE_LABEL } from '../data/taxonomy'
import { distanceKm, formatDistance, nearestCamps, roadDistanceKm } from '../lib/geo'
import { formatDate, formatPrice, num, todayISO, uid } from '../lib/format'
import { KEYS, loadJSON, saveJSON } from '../lib/storage'
import Rating from '../components/Rating'
import MapView from '../components/MapView'
import CampCard from '../components/CampCard'
import PostCard from '../components/PostCard'
import AvatarStack from '../components/AvatarStack'
import { campVisitors } from '../data/community'
import type { Review } from '../types'

export default function CampDetailScreen() {
  const { campId } = useParams()
  const camp = getCamp(campId)
  const navigate = useNavigate()
  const { show } = useToast()
  const { favorites, toggleFavorite, location, profile, trips, updateTrip, markVisited } = useApp()
  const [tripSheet, setTripSheet] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [draftRating, setDraftRating] = useState(5)
  const [draftText, setDraftText] = useState('')
  const [myReviews, setMyReviews] = useState<Record<string, Review[]>>(() =>
    loadJSON<Record<string, Review[]>>(KEYS.reviews, {}),
  )

  const nearby = useMemo(
    () => (camp ? nearestCamps(camps, camp, 3, camp.id) : []),
    [camp],
  )

  const { posts: communityPosts, getUser } = useSocial()
  const campPosts = useMemo(
    () => (camp ? communityPosts.filter((post) => post.campId === camp.id).slice(0, 3) : []),
    [communityPosts, camp],
  )
  const visitors = useMemo(
    () =>
      (camp ? (campVisitors[camp.id] ?? []) : [])
        .map((id) => getUser(id))
        .filter((user): user is NonNullable<typeof user> => Boolean(user)),
    [camp, getUser],
  )

  // Son görüntülenenler listesine ekle
  useEffect(() => {
    if (camp) markVisited(camp.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camp?.id])

  if (!camp) {
    return (
      <div className="screen screen--detail">
        <div className="detail-topbar">
          <button type="button" className="icon-btn icon-btn--onimage" onClick={() => navigate(-1)} aria-label="Geri">
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="empty-state">
          <h3>Tesis bulunamadı</h3>
          <p>Aradığınız kamp alanı kaldırılmış olabilir.</p>
          <Link to="/ara" className="btn btn--primary">
            Keşfetmeye dön
          </Link>
        </div>
      </div>
    )
  }

  const favorite = favorites.includes(camp.id)
  const distance = location ? distanceKm(location, camp) : null
  const driveHours = location ? roadDistanceKm(location, camp) / 80 : null
  const mine = myReviews[camp.id] ?? []
  const reviews = [...mine, ...camp.reviews]
  const panoramaUrl = `https://www.google.com/maps/dir/?api=1&destination=${camp.lat},${camp.lon}`
  const amapUrl = `https://maps.apple.com/?daddr=${camp.lat},${camp.lon}&dirflg=d`
  const tripDistance = location ? roadDistanceKm(location, camp) : null
  const tripFuel = tripDistance ? (tripDistance / 100) * profile.consumption * profile.fuelPrice : null

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/kamp/${camp.id}`
    const payload = { title: camp.name, text: `${camp.name} — ${camp.district}, ${camp.city}`, url }
    try {
      if (navigator.share) {
        await navigator.share(payload)
        return
      }
      await navigator.clipboard.writeText(`${payload.text} ${url}`)
      show('Bağlantı kopyalandı')
    } catch {
      show('Paylaşım iptal edildi')
    }
  }

  const saveReview = () => {
    if (!draftText.trim()) {
      show('Lütfen birkaç cümle yazın')
      return
    }
    const review: Review = {
      id: uid('yorum'),
      author: profile.name,
      rating: draftRating,
      date: todayISO(),
      text: draftText.trim(),
    }
    const next = { ...myReviews, [camp.id]: [review, ...mine] }
    setMyReviews(next)
    saveJSON(KEYS.reviews, next)
    setDraftText('')
    setReviewOpen(false)
    show('Değerlendirmeniz kaydedildi')
  }

  const addToTrip = (tripId: string) => {
    const trip = trips.find((item) => item.id === tripId)
    if (!trip) return
    updateTrip(tripId, {
      stops: [...trip.stops, { campId: camp.id, nights: 1 }],
    })
    setTripSheet(false)
    show(`${trip.name} gezisine eklendi`)
  }

  const reviewStats = reviews.reduce(
    (acc, review) => {
      acc.total += review.rating
      acc.count += 1
      acc.distribution[Math.round(review.rating)] =
        (acc.distribution[Math.round(review.rating)] ?? 0) + 1
      return acc
    },
    { total: 0, count: 0, distribution: {} as Record<number, number> },
  )
  const myRatingAvg = reviewStats.count ? reviewStats.total / reviewStats.count : camp.rating

  return (
    <div className="screen screen--detail">
      <div className="hero">
        <img src={camp.image} alt={camp.name} />
        <div className="hero__scrim" />
        <div className="hero__bar">
          <button type="button" className="icon-btn icon-btn--onimage" onClick={() => navigate(-1)} aria-label="Geri">
            <ArrowLeft size={20} />
          </button>
          <div className="hero__actions">
            <button type="button" className="icon-btn icon-btn--onimage" onClick={share} aria-label="Paylaş">
              <Share2 size={18} />
            </button>
            <button
              type="button"
              className={`icon-btn icon-btn--onimage${favorite ? ' is-active' : ''}`}
              onClick={() => {
                toggleFavorite(camp.id)
                show(favorite ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi')
              }}
              aria-label="Favori"
            >
              <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        <div className="hero__info">
          <span className="camp-card__type">{TYPE_LABEL[camp.type]}</span>
          {camp.featured && <span className="camp-card__badge">Editör seçimi</span>}
        </div>
      </div>

      <header className="detail-head">
        <h1>{camp.name}</h1>
        <p className="detail-head__meta">
          <MapPin size={14} aria-hidden />
          {camp.district}, {camp.city}
          {distance !== null && (
            <>
              <span className="dot" />
              <Navigation size={14} aria-hidden /> {formatDistance(distance)}
            </>
          )}
        </p>
        <div className="detail-head__rating">
          <Rating value={myRatingAvg} count={reviews.length} />
          <span className="detail-head__divider" />
          <span className="muted">{camp.priceNote}</span>
        </div>
      </header>

      <div className="action-row">
        <a className="action" href={panoramaUrl} target="_blank" rel="noreferrer">
          <span>
            <Navigation size={19} aria-hidden />
          </span>
          Yol tarifi
        </a>
        <a className="action" href={`tel:${camp.phone.replace(/\s/g, '')}`}>
          <span>
            <Phone size={19} aria-hidden />
          </span>
          Ara
        </a>
        <button type="button" className="action" onClick={() => setTripSheet(true)}>
          <span>
            <Route size={19} aria-hidden />
          </span>
          Gezime ekle
        </button>
        <a className="action" href={amapUrl} target="_blank" rel="noreferrer">
          <span>
            <Compass size={19} aria-hidden />
          </span>
          Apple Harita
        </a>
      </div>

      <section className="card">
        <div className="facts">
          <div className="fact">
            <span>Gecelik</span>
            <b>{formatPrice(camp.price)}</b>
          </div>
          <div className="fact">
            <span>Kapasite</span>
            <b className="fact__inline">
              <Users size={14} aria-hidden /> {camp.capacity}
            </b>
          </div>
          <div className="fact">
            <span>Sezon</span>
            <b className="fact__inline">
              <CalendarDays size={14} aria-hidden /> {camp.season}
            </b>
          </div>
          <div className="fact">
            <span>Rakım</span>
            <b>{camp.altitude} m</b>
          </div>
        </div>
      </section>

      {location && tripDistance && tripFuel ? (
        <section className="card estimate">
          <h2>
            <Fuel size={16} aria-hidden /> Konumundan tahmini varış
          </h2>
          <ul>
            <li>
              <span>Mesafe</span>
              <b>{formatDistance(tripDistance)}</b>
            </li>
            <li>
              <span>Tahmini sürüş</span>
              <b>
                {driveHours && driveHours >= 1
                  ? `${Math.floor(driveHours)} sa ${Math.round((driveHours % 1) * 60)} dk`
                  : `${Math.round((driveHours ?? 0) * 60)} dk`}
              </b>
            </li>
            <li>
              <span>
                Yakıt ({num(profile.consumption)} L/100 km · {num(profile.fuelPrice)} ₺/L)
              </span>
              <b>{formatPrice(tripFuel)}</b>
            </li>
          </ul>
          <p className="estimate__note">
            <Info size={13} aria-hidden />
            Karayolu tahmini, kuş uçuşu mesafenin 1,28 katı alınarak hesaplanır. Kesin rota için yol
            tarifi kullanın.
          </p>
        </section>
      ) : (
        <section className="card estimate estimate--cta">
          <h2>
            <Fuel size={16} aria-hidden /> Yol maliyetini hesapla
          </h2>
          <p>
            Konumunu paylaş ya da profilinden ortalama tüketimini gir; bu tesise varış mesafesi, süresi
            ve yakıt maliyeti otomatik hesaplansın.
          </p>
          <Link to="/profil" className="btn btn--sm btn--primary">
            Tüketim bilgilerini gir
          </Link>
        </section>
      )}

      <section className="card">
        <h2>Hakkında</h2>
        <p className="prose">{camp.about}</p>
        <div className="chip-row chip-row--wrap">
          {camp.scenery.map((key) => {
            const term = sceneryTerm(key)
            return (
              <span key={key} className="chip chip--ghost">
                <term.Icon size={13} aria-hidden />
                {term.label}
              </span>
            )
          })}
          <span className="chip chip--ghost">
            <Caravan size={13} aria-hidden />
            {campTypeTerm(camp.type).label}
          </span>
        </div>
      </section>

      <section className="card">
        <h2>Tesis olanakları</h2>
        <ul className="amenity-grid">
          {camp.amenities.map((key) => {
            const term = amenityTerm(key)
            return (
              <li key={key}>
                <span className="amenity-grid__icon">
                  <term.Icon size={17} aria-hidden />
                </span>
                {term.label}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card card--map">
        <h2>Konum</h2>
        <MapView
          markers={[
            { id: camp.id, lat: camp.lat, lon: camp.lon, label: camp.name, highlight: true, kind: 'stop' },
            ...nearby.map((item) => ({
              id: item.id,
              lat: item.lat,
              lon: item.lon,
              label: item.name,
              price: item.price,
              kind: 'camp' as const,
            })),
          ]}
          userLocation={location}
          fitToMarkers
          className="map-view--card"
        />
        <div className="map-links">
          <a href={panoramaUrl} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
            Google Maps
          </a>
          <a href={amapUrl} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
            Apple Haritalar
          </a>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>
            <MessageSquare size={16} aria-hidden /> Karavancılar burada ne diyor?
          </h2>
          <Link to="/akis" className="section__link">
            Akış
          </Link>
        </div>

        {visitors.length > 0 && (
          <div className="camp-visitors">
            <AvatarStack users={visitors} />
            <span className="muted">
              {visitors.map((user) => user.name.split(' ')[0]).join(', ')} son dönemde burada konakladı
            </span>
          </div>
        )}

        {campPosts.length > 0 ? (
          <div className="post-list post-list--compact">
            {campPosts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} showRouteCard={false} />
            ))}
          </div>
        ) : (
          <p className="muted">Bu tesis için henüz paylaşım yok. İlk notu sen bırak.</p>
        )}

        <Link to={`/akis/yeni?kamp=${camp.id}`} className="btn btn--ghost btn--block">
          <Plus size={16} aria-hidden /> Burada konakladım, paylaşmak istiyorum
        </Link>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Yakın çevredeki kamplar</h2>
          <Link to="/harita" className="section__link">
            Haritada gör
          </Link>
        </div>
        <div className="rail">
          {nearby.map((item) => (
            <CampCard
              key={item.id}
              camp={item}
              variant="rail"
              favorite={favorites.includes(item.id)}
              onToggleFavorite={toggleFavorite}
              userLocation={location}
            />
          ))}
        </div>
      </section>

      <section className="card">
        <div className="reviews-head">
          <h2>
            <MessageSquare size={16} aria-hidden /> Değerlendirmeler
          </h2>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setReviewOpen((prev) => !prev)}>
            <Plus size={14} aria-hidden />
            Yorum yaz
          </button>
        </div>

        <div className="rating-summary">
          <div className="rating-summary__score">
            <b>{myRatingAvg.toFixed(1).replace('.', ',')}</b>
            <Rating value={myRatingAvg} />
            <em>{reviews.length} değerlendirme</em>
          </div>
          <ul className="rating-bars">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviewStats.distribution[star] ?? 0
              const percent = reviewStats.count ? (count / reviewStats.count) * 100 : 0
              return (
                <li key={star}>
                  <span>
                    {star} <Star size={11} aria-hidden />
                  </span>
                  <i>
                    <b style={{ width: `${percent}%` }} />
                  </i>
                  <em>{count}</em>
                </li>
              )
            })}
          </ul>
        </div>

        {reviewOpen && (
          <div className="review-form">
            <div className="review-form__stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setDraftRating(star)}
                  aria-label={`${star} yıldız`}
                  className={star <= draftRating ? 'is-active' : ''}
                >
                  <Star size={22} fill={star <= draftRating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            <textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              placeholder="Parsel düzeni, duşlar, manzara, ulaşım… deneyimini paylaş"
              rows={3}
              maxLength={400}
            />
            <div className="review-form__foot">
              <span className="muted">{draftText.length}/400</span>
              <div>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setReviewOpen(false)}>
                  Vazgeç
                </button>
                <button type="button" className="btn btn--primary btn--sm" onClick={saveReview}>
                  <Check size={15} aria-hidden /> Gönder
                </button>
              </div>
            </div>
          </div>
        )}

        <ul className="review-list">
          {reviews.map((review) => (
            <li key={review.id}>
              <div className="review-list__head">
                <span className="review-avatar">{review.author.slice(0, 1).toUpperCase()}</span>
                <div>
                  <b>{review.author}</b>
                  <em>{formatDate(review.date)}</em>
                </div>
                <Rating value={review.rating} compact />
              </div>
              <p>{review.text}</p>
              {review.id.startsWith('yorum') && <span className="review-badge">Sizin yorumunuz</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card card--muted">
        <h2>
          <Quote size={15} aria-hidden /> Karavancı notu
        </h2>
        <p className="prose">
          Karavanınızla gelmeden önce tesisle telefonla teyit etmeniz önerilir: sezonda parseller
          dolabiliyor ve fiyatlar dönemsel olarak değişebiliyor. Fiyatlar bu demoda karavan + 2 kişi
          varsayımıyla gösterilir.
        </p>
      </section>

      {tripSheet && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Gezime ekle">
          <button type="button" className="sheet__backdrop" onClick={() => setTripSheet(false)} aria-label="Kapat" />
          <div className="sheet__panel sheet__panel--short">
            <header className="sheet__head">
              <h2>Gezime ekle</h2>
              <button type="button" className="icon-btn" onClick={() => setTripSheet(false)} aria-label="Kapat">
                <X size={20} />
              </button>
            </header>
            <div className="sheet__body">
              {trips.length === 0 ? (
                <p className="muted">Henüz bir geziniz yok. Yeni bir gezi planlayarak başlayın.</p>
              ) : (
                <ul className="trip-picker">
                  {trips.map((trip) => (
                    <li key={trip.id}>
                      <div>
                        <b>{trip.name}</b>
                        <em>
                          {trip.stops.length} durak · {formatDate(trip.startDate)}
                        </em>
                      </div>
                      <button type="button" className="btn btn--sm btn--primary" onClick={() => addToTrip(trip.id)}>
                        Ekle
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={() => navigate(`/geziler/yeni?kamp=${camp.id}`)}
              >
                <Plus size={16} aria-hidden /> Yeni gezi oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
