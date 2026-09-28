import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Info } from 'lucide-react'
import { useSocial } from '../store/SocialStore'
import EventCard from '../components/EventCard'
import { daysUntil } from '../lib/time'

export default function EventsScreen() {
  const navigate = useNavigate()
  const { events } = useSocial()

  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const upcoming = sorted.filter((event) => daysUntil(event.startDate) >= 0)
  const past = sorted.filter((event) => daysUntil(event.startDate) < 0)

  return (
    <div className="screen screen--events">
      <header className="page-head">
        <div className="page-head__left">
          <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Geri">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Karavancı buluşmaları</h1>
            <p className="muted">
              Konvoylar, festivaller ve ortak kamplar — {upcoming.length} yaklaşan etkinlik
            </p>
          </div>
        </div>
      </header>

      <div className="event-list">
        {upcoming.map((event, index) => (
          <EventCard key={event.id} event={event} index={index} />
        ))}
      </div>

      {past.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>
              <CalendarDays size={16} aria-hidden /> Geçmiş buluşmalar
            </h2>
          </div>
          <div className="event-list">
            {past.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </section>
      )}

      <p className="demo-note">
        <Info size={14} aria-hidden />
        <span>
          Buluşmalar <b>örnek veridir</b>; “Katıl” dediğinizde katılımınız bu cihazda kaydedilir ve
          akışta katılımcı olarak görünürsünüz.
        </span>
      </p>
    </div>
  )
}
