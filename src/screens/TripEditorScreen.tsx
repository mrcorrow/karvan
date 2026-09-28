import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  Fuel,
  Gauge,
  MapPin,
  Minus,
  Plus,
  Route,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useToast } from '../components/Toast'
import { camps, getCamp } from '../data/camps'
import { places } from '../data/places'
import { summarizeTrip, endDateFrom } from '../lib/trip'
import { formatDate, formatPrice, normalize, num, todayISO } from '../lib/format'
import type { GeoPoint, Trip } from '../types'

export default function TripEditorScreen() {
  const { tripId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { show } = useToast()
  const { trips, addTrip, updateTrip, deleteTrip, profile, location, setLocation } = useApp()

  const existing = useMemo(() => trips.find((trip) => trip.id === tripId), [trips, tripId])
  const prefillCampId = params.get('kamp')

  const [name, setName] = useState(existing?.name ?? 'Hafta sonu kaçamağı')
  const [startDate, setStartDate] = useState(existing?.startDate ?? todayISO(3))
  const [startPlaceId, setStartPlaceId] = useState<string | null>(
    existing?.startPlaceId ?? (location ? 'konumum' : null),
  )
  const [stops, setStops] = useState(
    existing?.stops ?? (prefillCampId ? [{ campId: prefillCampId, nights: 2 }] : []),
  )
  const [dailyExtras, setDailyExtras] = useState(existing?.dailyExtras ?? 450)
  const [note, setNote] = useState(existing?.note ?? '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setStartDate(existing.startDate)
      setStartPlaceId(existing.startPlaceId)
      setStops(existing.stops)
      setDailyExtras(existing.dailyExtras)
      setNote(existing.note)
    }
  }, [existing])

  const startPoint: GeoPoint | null =
    startPlaceId === 'konumum'
      ? location
      : (places.find((place) => place.id === startPlaceId) ?? null)

  const draft: Trip = {
    id: existing?.id ?? 'taslak',
    name,
    startDate,
    endDate: '',
    startPlaceId: startPlaceId === 'konumum' ? null : startPlaceId,
    stops,
    dailyExtras,
    note,
    createdAt: existing?.createdAt ?? Date.now(),
  }

  const nights = stops.reduce((sum, stop) => sum + stop.nights, 0)
  const endDate = endDateFrom(startDate, nights)
  const summary = useMemo(
    () => summarizeTrip({ ...draft, endDate }, profile, startPoint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stops, dailyExtras, startPlaceId, startDate, profile, location],
  )

  const pickerResults = useMemo(() => {
    const query = normalize(pickerQuery)
    const available = camps.filter((camp) => !stops.some((stop) => stop.campId === camp.id))
    if (!query) return available.slice(0, 12)
    return available
      .filter((camp) =>
        normalize(`${camp.name} ${camp.city} ${camp.district} ${camp.summary}`).includes(query),
      )
      .slice(0, 20)
  }, [pickerQuery, stops])

  const move = (index: number, direction: -1 | 1) => {
    const next = [...stops]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setStops(next)
  }

  const save = () => {
    if (!name.trim()) {
      show('Gezinize bir isim verin')
      return
    }
    if (stops.length === 0) {
      show('En az bir durak ekleyin')
      return
    }
    const payload = {
      name: name.trim(),
      startDate,
      endDate,
      startPlaceId: startPlaceId === 'konumum' ? null : startPlaceId,
      stops,
      dailyExtras,
      note,
    }
    if (existing) {
      updateTrip(existing.id, payload)
      show('Gezi güncellendi')
      navigate(`/geziler/${existing.id}`)
      return
    }
    const created = addTrip(payload)
    show('Gezi oluşturuldu')
    navigate(`/geziler/${created.id}`)
  }

  const remove = () => {
    if (!existing) return
    if (!window.confirm(`"${existing.name}" gezisi silinsin mi?`)) return
    deleteTrip(existing.id)
    show('Gezi silindi')
    navigate('/geziler')
  }

  return (
    <div className="screen screen--editor">
      <header className="page-head">
        <div>
          <h1>{existing ? 'Geziyi düzenle' : 'Yeni gezi planla'}</h1>
          <p className="muted">Durakları sıralayın; km, sürüş süresi ve masraf otomatik hesaplanır.</p>
        </div>
      </header>

      <section className="card form">
        <label className="field-input">
          <span>Gezi adı</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn. Ege kıyı turu" maxLength={60} />
        </label>

        <div className="form-row">
          <label className="field-input">
            <span>Başlangıç tarihi</span>
            <input
              type="date"
              className="field-input__date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <em className="field-input__hint">{formatDate(startDate)}</em>
          </label>
          <label className="field-input">
            <span>Bitiş (otomatik)</span>
            <input type="text" value={formatDate(endDate)} readOnly />
            <em className="field-input__hint">{nights + 1} gün · {nights} gece</em>
          </label>
        </div>

        <label className="field-input">
          <span>Başlangıç noktası</span>
          <select
            value={startPlaceId ?? ''}
            onChange={(event) => {
              const value = event.target.value
              if (value === 'konumum' && !location) {
                setLocation({ lat: 36.8969, lon: 30.7133 }, 'Antalya (demo)')
                show('Konum Antalya demo noktası olarak ayarlandı')
              }
              setStartPlaceId(value === '' ? null : value)
            }}
          >
            <option value="">Belirtme (rota ilk duraktan başlar)</option>
            <option value="konumum">
              {location ? 'Konumum (bu cihaz)' : 'Konumum — Antalya demo noktası'}
            </option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field-input">
          <span>Günlük ek masraf (yemek, giriş, aktivite)</span>
          <input
            type="number"
            min={0}
            step={50}
            value={dailyExtras}
            onChange={(event) => setDailyExtras(Number(event.target.value))}
          />
        </label>
      </section>

      <section className="card">
        <div className="reviews-head">
          <h2>
            <Route size={16} aria-hidden /> Duraklar ({stops.length})
          </h2>
          <button type="button" className="btn btn--sm btn--primary" onClick={() => setPickerOpen(true)}>
            <Plus size={15} aria-hidden /> Durak ekle
          </button>
        </div>

        {stops.length === 0 ? (
          <p className="muted">
            Henüz durak eklemediniz. Kampları arayarak rotanıza ekleyin; sıralamayı oklarla
            değiştirebilirsiniz.
          </p>
        ) : (
          <ol className="stop-list">
            {stops.map((stop, index) => {
              const camp = getCamp(stop.campId)
              if (!camp) return null
              const leg = summary.stops[index]?.legKm ?? 0
              return (
                <li key={`${stop.campId}-${index}`} className="stop-item">
                  <div className="stop-item__index">{index + 1}</div>
                  <div className="stop-item__main">
                    <b>{camp.name}</b>
                    <em>
                      {camp.district}, {camp.city}
                      {index > 0 || startPoint ? ` · ${Math.round(leg)} km` : ''}
                    </em>
                    <div className="stop-item__controls">
                      <div className="stepper">
                        <button
                          type="button"
                          onClick={() =>
                            setStops(
                              stops.map((item, i) =>
                                i === index ? { ...item, nights: Math.max(1, item.nights - 1) } : item,
                              ),
                            )
                          }
                          aria-label="Gece azalt"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{stop.nights} gece</span>
                        <button
                          type="button"
                          onClick={() =>
                            setStops(
                              stops.map((item, i) =>
                                i === index ? { ...item, nights: Math.min(30, item.nights + 1) } : item,
                              ),
                            )
                          }
                          aria-label="Gece artır"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="stop-item__cost">{formatPrice(camp.price * stop.nights)}</span>
                    </div>
                  </div>
                  <div className="stop-item__tools">
                    <button type="button" className="icon-btn" onClick={() => move(index, -1)} aria-label="Yukarı taşı">
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => move(index, 1)} aria-label="Aşağı taşı">
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => setStops(stops.filter((_, i) => i !== index))}
                      aria-label="Durağı kaldır"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section className="card estimate">
        <h2>
          <Gauge size={16} aria-hidden /> Gezi özeti
        </h2>
        <ul>
          <li>
            <span>Toplam mesafe</span>
            <b>{Math.round(summary.distanceKm)} km</b>
          </li>
          <li>
            <span>Tahmini sürüş</span>
            <b>{summary.drivingHours.toFixed(1).replace('.', ',')} saat</b>
          </li>
          <li>
            <span>
              <CalendarDays size={13} aria-hidden /> Gece / gün
            </span>
            <b>
              {nights} gece · {nights + 1} gün
            </b>
          </li>
          <li>
            <span>
              <MapPin size={13} aria-hidden /> Konaklama
            </span>
            <b>{formatPrice(summary.campCost)}</b>
          </li>
          <li>
            <span>
              <Fuel size={13} aria-hidden /> Yakıt
            </span>
            <b>{formatPrice(summary.fuelCost)}</b>
          </li>
          <li>
            <span>Ek masraflar</span>
            <b>{formatPrice(summary.extrasCost)}</b>
          </li>
          <li className="estimate__total">
            <span>
              <Wallet size={14} aria-hidden /> Tahmini toplam
            </span>
            <b>{formatPrice(summary.totalCost)}</b>
          </li>
        </ul>
        <p className="estimate__note">
          Yakıt, profilinizdeki {num(profile.consumption)} L/100 km tüketim ve{' '}
          {num(profile.fuelPrice)} ₺/L fiyata göre hesaplanır. Profil ekranından güncelleyebilirsiniz.
        </p>
      </section>

      <section className="card form">
        <label className="field-input">
          <span>Notlar</span>
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Rezervasyon numarası, gidilecek yerler, hatırlatmalar…"
            maxLength={500}
          />
        </label>
      </section>

      <div className="editor-actions">
        {existing && (
          <button type="button" className="btn btn--ghost btn--danger" onClick={remove}>
            <Trash2 size={16} aria-hidden /> Sil
          </button>
        )}
        <button type="button" className="btn btn--primary btn--block" onClick={save}>
          <Check size={16} aria-hidden />
          {existing ? 'Değişiklikleri kaydet' : 'Geziyi oluştur'}
        </button>
      </div>

      {pickerOpen && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Durak ekle">
          <button type="button" className="sheet__backdrop" onClick={() => setPickerOpen(false)} aria-label="Kapat" />
          <div className="sheet__panel">
            <header className="sheet__head">
              <h2>Durak ekle</h2>
              <button type="button" className="icon-btn" onClick={() => setPickerOpen(false)} aria-label="Kapat">
                <X size={20} />
              </button>
            </header>
            <div className="sheet__body">
              <div className="search-input search-input--sheet">
                <Search size={17} aria-hidden />
                <input
                  type="search"
                  value={pickerQuery}
                  onChange={(event) => setPickerQuery(event.target.value)}
                  placeholder="Kamp ara…"
                  aria-label="Kamp ara"
                />
              </div>
              <ul className="picker-list">
                {pickerResults.map((camp) => (
                  <li key={camp.id}>
                    <img src={camp.image} alt="" loading="lazy" />
                    <div>
                      <b>{camp.name}</b>
                      <em>
                        {camp.district}, {camp.city} · {formatPrice(camp.price)}/gece
                      </em>
                    </div>
                    <button
                      type="button"
                      className="btn btn--sm btn--primary"
                      onClick={() => {
                        setStops([...stops, { campId: camp.id, nights: 1 }])
                        setPickerOpen(false)
                        setPickerQuery('')
                      }}
                    >
                      <Plus size={14} aria-hidden />
                    </button>
                  </li>
                ))}
                {pickerResults.length === 0 && <li className="muted">Sonuç bulunamadı.</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

