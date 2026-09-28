import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Camera,
  Check,
  ImagePlus,
  MapPin,
  Search,
  Send,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useSocial } from '../store/SocialStore'
import { useToast } from '../components/Toast'
import { camps, getCamp } from '../data/camps'
import { PHOTO_LIBRARY, TOPICS } from '../data/community'
import { summarizeTrip } from '../lib/trip'
import { normalize } from '../lib/format'
import Confetti from '../components/Confetti'

const MAX_UPLOAD_BYTES = 800_000

export default function ComposerScreen() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { show } = useToast()
  const { trips, profile } = useApp()
  const { createPost, me } = useSocial()

  const tripParam = params.get('gezi')
  const campParam = params.get('kamp')
  const trip = trips.find((item) => item.id === tripParam)

  const [text, setText] = useState(() => {
    if (trip) {
      return `${trip.name} rotamızı tamamladık. Durakların hepsi denenmiş, yorumlarımı profilde bulabilirsiniz.`
    }
    return ''
  })
  const [image, setImage] = useState<string | undefined>(() => (trip ? '/images/social/road.jpg' : undefined))
  const [campId, setCampId] = useState<string | undefined>(
    campParam ?? trip?.stops[trip.stops.length - 1]?.campId,
  )
  const [place, setPlace] = useState('')
  const [topic, setTopic] = useState<string | undefined>(trip ? '#rota' : undefined)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [published, setPublished] = useState(false)

  const route = useMemo(() => {
    if (!trip) return undefined
    const summary = summarizeTrip(trip, profile)
    return {
      distanceKm: summary.distanceKm,
      nights: summary.totalNights,
      totalCost: summary.totalCost,
      stops: summary.campCount,
      tripId: trip.id,
    }
  }, [trip, profile])

  const selectedCamp = getCamp(campId)
  const results = useMemo(() => {
    const q = normalize(query)
    if (!q) return camps.slice(0, 10)
    return camps.filter((camp) => normalize(`${camp.name} ${camp.city} ${camp.district}`).includes(q)).slice(0, 20)
  }, [query])

  const canPublish = Boolean(text.trim() || image)

  const publish = () => {
    if (!canPublish) {
      show('Bir şeyler yazın ya da fotoğraf seçin')
      return
    }
    setPublished(true)
    createPost({ text, image, campId, place: place.trim() || undefined, topic, route })
    if (navigator.vibrate) navigator.vibrate([12, 40, 18])
    window.setTimeout(() => {
      show('Paylaşımın topluluğa gönderildi 🎉')
      navigate('/akis')
    }, 950)
  }

  const upload = (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) {
      show('Fotoğraf en fazla 800 KB olabilir (demo sınırı)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="screen screen--composer">
      {published && <Confetti count={34} />}

      <header className="composer-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Geri">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Yeni paylaşım</h1>
          <p className="muted">
            <Users size={12} aria-hidden /> Tüm karavancılar görecek
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={publish}
          disabled={!canPublish || published}
        >
          <Send size={15} aria-hidden />
          Paylaş
        </button>
      </header>

      <section className="card composer-card">
        <div className="composer-row">
          <span className={`avatar avatar--${me.tint}`}>{me.avatar}</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Bugün nerede konakladın? Yol durumu, parsel notu, tarif… deneyimini paylaş."
            rows={4}
            maxLength={600}
            aria-label="Paylaşım metni"
          />
        </div>
        <span className="composer-count">{text.length}/600</span>
      </section>

      <section className="card">
        <h2>
          <Camera size={16} aria-hidden /> Fotoğraf
        </h2>
        <div className="photo-grid">
          <button
            type="button"
            className={`photo-tile photo-tile--none${!image ? ' is-active' : ''}`}
            onClick={() => setImage(undefined)}
          >
            <X size={18} aria-hidden />
            <span>Fotoğrafsız</span>
          </button>
          {PHOTO_LIBRARY.map((photo) => (
            <button
              key={photo.src}
              type="button"
              className={`photo-tile${image === photo.src ? ' is-active' : ''}`}
              onClick={() => {
                setImage(photo.src)
                if (navigator.vibrate) navigator.vibrate(8)
              }}
              aria-label={photo.label}
            >
              <img src={photo.src} alt="" loading="lazy" />
              <span>{photo.label}</span>
            </button>
          ))}
        </div>

        <label className="upload-btn">
          <Upload size={16} aria-hidden />
          Kendi fotoğrafını yükle
          <input
            type="file"
            accept="image/*"
            onChange={(event) => upload(event.target.files?.[0])}
            hidden
          />
        </label>
        <p className="field__hint">
          Yüklenen fotoğraflar yalnızca bu cihazda saklanır (demo sınırı: 800 KB).
        </p>
      </section>

      <section className="card">
        <h2>
          <MapPin size={16} aria-hidden /> Tesis ve yer
        </h2>
        <button type="button" className="picker-trigger" onClick={() => setPickerOpen(true)}>
          {selectedCamp ? (
            <>
              <img src={selectedCamp.image} alt="" />
              <span>
                <b>{selectedCamp.name}</b>
                <em>
                  {selectedCamp.district}, {selectedCamp.city}
                </em>
              </span>
              <Check size={17} aria-hidden />
            </>
          ) : (
            <>
              <span className="picker-trigger__icon">
                <ImagePlus size={18} aria-hidden />
              </span>
              <span>
                <b>Kamp alanı etiketle</b>
                <em>Paylaşımın tesis sayfasında da görünür</em>
              </span>
            </>
          )}
        </button>

        <label className="field-input">
          <span>Yer notu (isteğe bağlı)</span>
          <input
            value={place}
            onChange={(event) => setPlace(event.target.value)}
            placeholder="Örn. Çıralı, 3. parsel"
            maxLength={60}
          />
        </label>

        <h3 className="field__title">
          <Sparkles size={15} aria-hidden /> Konu etiketi
        </h3>
        <div className="chip-row chip-row--wrap">
          {TOPICS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`chip${topic === tag ? ' is-active' : ''}`}
              onClick={() => setTopic(topic === tag ? undefined : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className="card card--muted">
        <h2>Önizleme</h2>
        <div className="composer-preview">
          <span className={`avatar avatar--${me.tint}`}>{me.avatar}</span>
          <div>
            <b>{me.name}</b>
            <em>şimdi</em>
            <p>{text.trim() || 'Paylaşım metniniz burada görünecek…'}</p>
            {image && <img src={image} alt="" />}
            {selectedCamp && (
              <span className="chip chip--camp">
                <MapPin size={12} aria-hidden />
                {selectedCamp.name}
              </span>
            )}
            {route && (
              <span className="chip chip--ghost">
                <Sparkles size={12} aria-hidden /> {Math.round(route.distanceKm)} km · {route.nights} gece
              </span>
            )}
          </div>
        </div>
      </section>

      <button type="button" className="btn btn--primary btn--block composer-submit" onClick={publish} disabled={!canPublish || published}>
        <Send size={17} aria-hidden />
        Topluluğa paylaş
      </button>

      {pickerOpen && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Tesis seç">
          <button type="button" className="sheet__backdrop" onClick={() => setPickerOpen(false)} aria-label="Kapat" />
          <div className="sheet__panel">
            <header className="sheet__head">
              <h2>Kamp alanı etiketle</h2>
              <button type="button" className="icon-btn" onClick={() => setPickerOpen(false)} aria-label="Kapat">
                <X size={20} />
              </button>
            </header>
            <div className="sheet__body">
              <div className="search-input search-input--sheet">
                <Search size={17} aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tesis ara…"
                  aria-label="Tesis ara"
                />
              </div>
              <ul className="picker-list">
                <li>
                  <button
                    type="button"
                    className="picker-clear"
                    onClick={() => {
                      setCampId(undefined)
                      setPickerOpen(false)
                    }}
                  >
                    <X size={16} aria-hidden /> Etiketi kaldır
                  </button>
                </li>
                {results.map((camp) => (
                  <li key={camp.id}>
                    <img src={camp.image} alt="" loading="lazy" />
                    <div>
                      <b>{camp.name}</b>
                      <em>
                        {camp.district}, {camp.city}
                      </em>
                    </div>
                    <button
                      type="button"
                      className="btn btn--sm btn--primary"
                      onClick={() => {
                        setCampId(camp.id)
                        setPickerOpen(false)
                      }}
                    >
                      <Check size={14} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
