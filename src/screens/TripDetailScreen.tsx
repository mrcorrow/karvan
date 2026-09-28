import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Copy,
  ExternalLink,
  Fuel,
  Gauge,
  MapPin,
  Milestone,
  Pencil,
  Plus,
  Route,
  Share2,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useToast } from '../components/Toast'
import { camps } from '../data/camps'
import { nearestCamps } from '../lib/geo'
import { summarizeTrip, tripStartName, tripToText } from '../lib/trip'
import { formatDate, formatPrice, num } from '../lib/format'
import MapView, { type MapMarker } from '../components/MapView'
import CampCard from '../components/CampCard'
import EmptyState from '../components/EmptyState'

export default function TripDetailScreen() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { show } = useToast()
  const { trips, updateTrip, deleteTrip, profile, location, favorites, toggleFavorite } = useApp()

  const trip = trips.find((item) => item.id === tripId)

  const summary = useMemo(() => (trip ? summarizeTrip(trip, profile) : null), [trip, profile])

  const suggestions = useMemo(() => {
    if (!summary || summary.stops.length === 0) return []
    const last = summary.stops[summary.stops.length - 1].camp
    return nearestCamps(camps, last, 4, undefined).filter(
      (camp) => !trip?.stops.some((stop) => stop.campId === camp.id),
    )
  }, [summary, trip])

  if (!trip || !summary) {
    return (
      <div className="screen screen--trip-detail">
        <header className="page-head">
          <button type="button" className="icon-btn" onClick={() => navigate('/geziler')} aria-label="Geri">
            <ArrowLeft size={20} />
          </button>
          <h1>Gezi bulunamadı</h1>
        </header>
        <EmptyState
          Icon={Route}
          title="Bu gezi artık yok"
          description="Silinmiş olabilir. Yeni bir gezi planlayarak devam edebilirsiniz."
          action={{ label: 'Gezilerime dön', onClick: () => navigate('/geziler') }}
        />
      </div>
    )
  }

  const startName = tripStartName(trip)
  const markers: MapMarker[] = summary.stops.map((stop, index) => ({
    id: stop.camp.id,
    lat: stop.camp.lat,
    lon: stop.camp.lon,
    label: `${index + 1}. ${stop.camp.name}`,
    highlight: index === 0,
    kind: 'stop',
  }))

  if (startName && summary.points.length > summary.stops.length) {
    markers.unshift({
      id: 'start',
      lat: summary.points[0].lat,
      lon: summary.points[0].lon,
      label: `Başlangıç: ${startName}`,
      kind: 'place',
    })
  }

  const polyline = summary.points.map((point) => [point.lat, point.lon] as [number, number])

  const mapsUrl = (() => {
    if (summary.points.length < 2) return null
    const origin = summary.points[0]
    const destination = summary.points[summary.points.length - 1]
    const waypoints = summary.points.slice(1, -1).map((point) => `${point.lat},${point.lon}`)
    const query = new URLSearchParams({
      api: '1',
      origin: `${origin.lat},${origin.lon}`,
      destination: `${destination.lat},${destination.lon}`,
      travelmode: 'driving',
    })
    if (waypoints.length > 0) query.set('waypoints', waypoints.join('|'))
    return `https://www.google.com/maps/dir/?${query.toString()}`
  })()

  const copyPlan = async () => {
    const text = tripToText(trip, summary, profile)
    try {
      await navigator.clipboard.writeText(text)
      show('Gezi planı panoya kopyalandı')
    } catch {
      show('Kopyalama başarısız oldu')
    }
  }

  const sharePlan = async () => {
    const text = tripToText(trip, summary, profile)
    try {
      if (navigator.share) {
        await navigator.share({ title: trip.name, text })
        return
      }
      await navigator.clipboard.writeText(text)
      show('Plan kopyalandı')
    } catch {
      show('Paylaşım iptal edildi')
    }
  }

  const addStop = (campId: string) => {
    updateTrip(trip.id, { stops: [...trip.stops, { campId, nights: 1 }] })
    show('Durak rotaya eklendi')
  }

  const remove = () => {
    if (!window.confirm(`"${trip.name}" gezisi silinsin mi?`)) return
    deleteTrip(trip.id)
    show('Gezi silindi')
    navigate('/geziler')
  }

  return (
    <div className="screen screen--trip-detail">
      <header className="detail-topbar detail-topbar--solid">
        <button type="button" className="icon-btn" onClick={() => navigate('/geziler')} aria-label="Geri">
          <ArrowLeft size={20} />
        </button>
        <div className="detail-topbar__actions">
          <Link to={`/geziler/${trip.id}/duzenle`} className="icon-btn" aria-label="Düzenle">
            <Pencil size={18} />
          </Link>
          <button type="button" className="icon-btn icon-btn--danger" onClick={remove} aria-label="Sil">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <header className="page-head page-head--tight">
        <div>
          <h1>{trip.name}</h1>
          <p className="trip-card__meta">
            <CalendarDays size={13} aria-hidden />
            {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
            {startName && (
              <>
                <span className="dot" />
                <MapPin size={13} aria-hidden /> {startName}
              </>
            )}
          </p>
        </div>
      </header>

      <section className="card stats-card">
        <div className="fact">
          <span>Mesafe</span>
          <b>
            <Gauge size={14} aria-hidden /> {Math.round(summary.distanceKm)} km
          </b>
        </div>
        <div className="fact">
          <span>Sürüş</span>
          <b>
            <Clock size={14} aria-hidden /> {summary.drivingHours.toFixed(1).replace('.', ',')} sa
          </b>
        </div>
        <div className="fact">
          <span>Gece</span>
          <b>
            <CalendarDays size={14} aria-hidden /> {summary.totalNights}
          </b>
        </div>
        <div className="fact">
          <span>Durak</span>
          <b>
            <Milestone size={14} aria-hidden /> {summary.campCount}
          </b>
        </div>
      </section>

      <section className="card card--map">
        <h2>Rota</h2>
        <MapView
          markers={markers}
          polyline={polyline}
          userLocation={location}
          fitToMarkers
          fullscreenAllowed
          className="map-view--card"
        />
        <div className="map-links">
          {mapsUrl && (
            <a className="btn btn--ghost btn--sm" href={mapsUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={15} aria-hidden /> Google Maps'te aç
            </a>
          )}
            <button type="button" className="btn btn--ghost btn--sm" onClick={sharePlan}>
              <Share2 size={15} aria-hidden /> Paylaş
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={copyPlan}>
              <Copy size={15} aria-hidden /> Planı kopyala
            </button>
          <Link className="btn btn--primary btn--sm" to={`/akis/yeni?gezi=${trip.id}`}>
            <Share2 size={15} aria-hidden /> Topluluğa paylaş
          </Link>
        </div>
      </section>

      <section className="card">
        <h2>
          <Route size={16} aria-hidden /> Duraklar
        </h2>
        <ol className="stop-list stop-list--readonly">
          {summary.stops.map((stop, index) => (
            <li key={stop.camp.id} className="stop-item">
              <div className="stop-item__index">{index + 1}</div>
              <div className="stop-item__main">
                <Link to={`/kamp/${stop.camp.id}`} className="stop-item__link">
                  <b>{stop.camp.name}</b>
                </Link>
                <em>
                  {stop.camp.district}, {stop.camp.city} · {stop.nights} gece
                  {stop.legKm > 0 && ` · ${Math.round(stop.legKm)} km`}
                </em>
                <span className="stop-item__cost">
                  {formatPrice(stop.cost)} <em>({formatPrice(stop.camp.price)}/gece)</em>
                </span>
              </div>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                onClick={() =>
                  updateTrip(trip.id, {
                    stops: trip.stops.filter((item) => item.campId !== stop.camp.id),
                  })
                }
                aria-label={`${stop.camp.name} durağını kaldır`}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="card estimate">
        <h2>
          <Wallet size={16} aria-hidden /> Maliyet dökümü
        </h2>
        <ul>
          <li>
            <span>
              <Fuel size={13} aria-hidden /> Yakıt ({num(profile.consumption)} L/100 km)
            </span>
            <b>{formatPrice(summary.fuelCost)}</b>
          </li>
          <li>
            <span>Konaklama ({summary.totalNights} gece)</span>
            <b>{formatPrice(summary.campCost)}</b>
          </li>
          <li>
            <span>Ek masraflar ({formatPrice(trip.dailyExtras)}/gün)</span>
            <b>{formatPrice(summary.extrasCost)}</b>
          </li>
          <li className="estimate__total">
            <span>Toplam</span>
            <b>{formatPrice(summary.totalCost)}</b>
          </li>
          <li className="estimate__perday">
            <span>Kişi başı günlük (2 kişi varsayımı)</span>
            <b>
              {formatPrice(
                summary.totalCost / Math.max(1, summary.totalNights + 1) / 2,
              )}
            </b>
          </li>
        </ul>
      </section>

      {trip.note.trim() && (
        <section className="card card--muted">
          <h2>Notlar</h2>
          <p className="prose">{trip.note}</p>
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>Son durağa yakın kamplar</h2>
          </div>
          <p className="muted section__note">
            Rotayı uzatmak isterseniz son durağa yakın şu tesisleri ekleyebilirsiniz.
          </p>
          <div className="suggestion-list">
            {suggestions.map((camp) => (
              <div key={camp.id} className="suggestion">
                <img src={camp.image} alt="" loading="lazy" />
                <div>
                  <b>{camp.name}</b>
                  <em>
                    {camp.district}, {camp.city} · {formatPrice(camp.price)}/gece
                  </em>
                </div>
                <button type="button" className="btn btn--sm btn--primary" onClick={() => addStop(camp.id)}>
                  <Plus size={14} aria-hidden /> Ekle
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section__head">
          <h2>Duraklardaki kamplar</h2>
        </div>
        <div className="rail">
          {summary.stops.map((stop) => (
            <CampCard
              key={stop.camp.id}
              camp={stop.camp}
              variant="rail"
              favorite={favorites.includes(stop.camp.id)}
              onToggleFavorite={toggleFavorite}
              userLocation={location}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
