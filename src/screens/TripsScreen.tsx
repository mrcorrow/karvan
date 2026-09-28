import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Fuel, Gauge, MapPin, Plus, Route, Trash2, Wallet } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useToast } from '../components/Toast'
import { summarizeTrip } from '../lib/trip'
import { formatDate, formatPrice } from '../lib/format'
import EmptyState from '../components/EmptyState'
import type { Trip } from '../types'

export default function TripsScreen() {
  const { trips, deleteTrip, profile } = useApp()
  const { show } = useToast()
  const navigate = useNavigate()

  const summaries = useMemo(
    () =>
      trips.map((trip) => ({
        trip,
        summary: summarizeTrip(trip, profile),
      })),
    [trips, profile],
  )

  const totals = summaries.reduce(
    (acc, item) => {
      acc.km += item.summary.distanceKm
      acc.nights += item.summary.totalNights
      acc.cost += item.summary.totalCost
      acc.stops += item.summary.campCount
      return acc
    },
    { km: 0, nights: 0, cost: 0, stops: 0 },
  )

  const remove = (trip: Trip) => {
    if (!window.confirm(`"${trip.name}" gezisi silinsin mi?`)) return
    deleteTrip(trip.id)
    show('Gezi silindi')
  }

  return (
    <div className="screen screen--trips">
      <header className="page-head">
        <div>
          <h1>Gezilerim</h1>
          <p className="muted">Durakları planla, mesafe ve maliyeti önceden gör.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/geziler/yeni')}>
          <Plus size={16} aria-hidden /> Yeni
        </button>
      </header>

      {trips.length === 0 ? (
        <EmptyState
          Icon={Route}
          title="Henüz gezi planınız yok"
          description="Kamp alanlarını seçip duraklar oluşturun; Karvan mesafeyi, sürüş süresini ve tahmini masrafı hesaplasın."
          action={{ label: 'İlk geziyi planla', onClick: () => navigate('/geziler/yeni') }}
        />
      ) : (
        <>
          <section className="card stats-card">
            <div className="fact">
              <span>Toplam mesafe</span>
              <b>
                <Gauge size={14} aria-hidden /> {Math.round(totals.km)} km
              </b>
            </div>
            <div className="fact">
              <span>Gece</span>
              <b>
                <CalendarDays size={14} aria-hidden /> {totals.nights}
              </b>
            </div>
            <div className="fact">
              <span>Durak</span>
              <b>
                <MapPin size={14} aria-hidden /> {totals.stops}
              </b>
            </div>
            <div className="fact">
              <span>Tahmini masraf</span>
              <b>{formatPrice(totals.cost)}</b>
            </div>
          </section>

          <div className="trip-list">
            {summaries.map(({ trip, summary }) => (
              <article key={trip.id} className="trip-card">
                <Link to={`/geziler/${trip.id}`} className="trip-card__main">
                  <div className="trip-card__head">
                    <h3>{trip.name}</h3>
                    <span className="chip chip--ghost">{summary.totalNights} gece</span>
                  </div>
                  <p className="trip-card__meta">
                    <CalendarDays size={13} aria-hidden />
                    {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                    <span className="dot" />
                    {summary.campCount} durak
                  </p>
                  <ul className="trip-card__facts">
                    <li>
                      <Gauge size={13} aria-hidden /> {Math.round(summary.distanceKm)} km
                    </li>
                    <li>
                      <Fuel size={13} aria-hidden /> {formatPrice(summary.fuelCost)}
                    </li>
                    <li>
                      <Wallet size={13} aria-hidden /> {formatPrice(summary.totalCost)}
                    </li>
                  </ul>
                </Link>
                <div className="trip-card__actions">
                  <Link to={`/geziler/${trip.id}/duzenle`} className="btn btn--ghost btn--sm">
                    Düzenle
                  </Link>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm btn--danger"
                    onClick={() => remove(trip)}
                    aria-label={`${trip.name} gezisini sil`}
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
