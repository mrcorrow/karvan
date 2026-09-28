import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Banknote,
  Caravan,
  CircleHelp,
  ExternalLink,
  Download,
  Gauge,
  Heart,
  Info,
  LocateFixed,
  MapPin,
  MonitorSmartphone,
  Moon,
  RotateCcw,
  Route,
  Sun,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useSocial } from '../store/SocialStore'
import { useToast } from '../components/Toast'
import Avatar from '../components/Avatar'
import { VEHICLES } from '../data/taxonomy'
import { formatPrice, num } from '../lib/format'
import { normalizePlate } from '../lib/plate'
import { DEMO_LOCATION } from '../lib/demo'
import { plateCity } from '../lib/plate'
import { useCountUp } from '../hooks/animations'
import { KEYS, removeKey } from '../lib/storage'

/** Boş değer, isimden türetilen baş harflerin kullanılacağı anlamına gelir. */
const AVATARS = ['', '🚐', '🏕️', '🧭', '🌊', '🔥', '⛰️', '🐕']

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function ProfileScreen() {
  const { profile, updateProfile, theme, setTheme, location, locationLabel, setLocation, favorites, trips, visited } =
    useApp()
  const { posts: communityPosts, me, followerCount } = useSocial()
  const myPosts = communityPosts.filter((post) => post.mine)
  const followers = useCountUp(followerCount('me'), 900)
  const { show } = useToast()
  const [kmInput, setKmInput] = useState('400')
  const [roundTrip, setRoundTrip] = useState(true)
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const calculator = useMemo(() => {
    const distance = Number(kmInput.replace(',', '.')) || 0
    const totalDistance = roundTrip ? distance * 2 : distance
    const liters = (totalDistance / 100) * profile.consumption
    return {
      distance: totalDistance,
      liters,
      fuel: liters * profile.fuelPrice,
      hours: totalDistance / 80,
    }
  }, [kmInput, roundTrip, profile.consumption, profile.fuelPrice])

  const install = async () => {
    if (!installEvent) {
      show('Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullanın')
      return
    }
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    show(choice.outcome === 'accepted' ? 'Karvan ana ekrana eklendi' : 'Kurulum iptal edildi')
    setInstallEvent(null)
  }

  const resetAll = () => {
    if (!window.confirm('Favoriler, geziler ve profil bilgileri silinsin mi?')) return
    removeKey(KEYS.favorites)
    removeKey(KEYS.trips)
    removeKey(KEYS.profile)
    removeKey(KEYS.filters)
    removeKey(KEYS.location)
    removeKey(KEYS.reviews)
    removeKey(KEYS.visited)
    window.location.reload()
  }

  return (
    <div className="screen screen--profile">
      <header className="page-head">
        <div>
          <h1>Profil</h1>
          <p className="muted">Karavan bilgilerinizi girin; hesaplamalar size göre yapılsın.</p>
        </div>
      </header>

      <section className="card profile-card">
        <div className="profile-card__top">
          <Avatar user={me} size="xl" />
          <label className="field-input field-input--inline">
            <span>Adınız</span>
            <input
              value={profile.name}
              onChange={(event) => updateProfile({ name: event.target.value })}
              maxLength={30}
              placeholder="Adınız"
            />
          </label>
        </div>
        <div className="avatar-row">
          {AVATARS.map((choice) => (
            <button
              key={choice || 'harf'}
              type="button"
              className={`avatar-choice${profile.avatar === choice ? ' is-active' : ''}`}
              onClick={() => updateProfile({ avatar: choice })}
              aria-label={choice ? `Avatar ${choice}` : 'Baş harfleri kullan'}
            >
              {choice || <Avatar user={{ ...me, avatar: '' }} />}
            </button>
          ))}
        </div>
      </section>

      <section className="card form">
        <h2>
          <Caravan size={16} aria-hidden /> Aracınız
        </h2>
        <div className="choice-grid">
          {VEHICLES.map((vehicle) => (
            <button
              key={vehicle.key}
              type="button"
              className={`choice${profile.vehicle === vehicle.key ? ' is-active' : ''}`}
              onClick={() => updateProfile({ vehicle: vehicle.key })}
            >
              <vehicle.Icon size={18} aria-hidden />
              <span>
                <b>{vehicle.label}</b>
                <em>{vehicle.hint}</em>
              </span>
            </button>
          ))}
        </div>

        <label className="field-input">
          <span>Plaka (isteğe bağlı)</span>
          <input
            value={profile.plate}
            onChange={(event) => updateProfile({ plate: normalizePlate(event.target.value) })}
            placeholder="07 ABC 123"
            maxLength={12}
          />
          <em className="field-input__hint">
            {plateCity(profile.plate)
              ? `Plakadan şehir: ${plateCity(profile.plate)} — topluluk profilinde görünür`
              : 'Plaka girerseniz şehriniz otomatik belirlenir'}
          </em>
        </label>

        <div className="form-row">
          <label className="field-input">
            <span>Ortalama tüketim (L/100 km)</span>
            <input
              type="number"
              min={4}
              max={40}
              step={0.5}
              value={profile.consumption}
              onChange={(event) => updateProfile({ consumption: Number(event.target.value) || 0 })}
            />
          </label>
          <label className="field-input">
            <span>Yakıt fiyatı (₺/L)</span>
            <input
              type="number"
              min={1}
              step={0.5}
              value={profile.fuelPrice}
              onChange={(event) => updateProfile({ fuelPrice: Number(event.target.value) || 0 })}
            />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>
          <ExternalLink size={16} aria-hidden /> Topluluk profilim
        </h2>
        <div className="profile-top">
          <Avatar user={me} size="lg" />
          <div className="profile-top__lines">
            <b>{me.name}</b>
            <em>
              {me.city} · {me.plate || 'plaka yok'}
            </em>
          </div>
          <Link to="/karavanci/me" className="btn btn--ghost btn--sm">
            Görüntüle
          </Link>
        </div>
        <div className="form-row">
          <label className="field-input">
            <span>Şehir</span>
            <input
              value={profile.city}
              onChange={(event) => updateProfile({ city: event.target.value })}
              placeholder="Antalya"
              maxLength={24}
            />
          </label>
          <label className="field-input">
            <span>Hakkımda</span>
            <input
              value={profile.bio}
              onChange={(event) => updateProfile({ bio: event.target.value })}
              placeholder="Yollarda görüşürüz"
              maxLength={90}
            />
          </label>
        </div>
        <ul className="member-stats member-stats--inline">
          <li>
            <b>{myPosts.length}</b>
            <span>paylaşım</span>
          </li>
          <li>
            <b>{Math.round(followers)}</b>
            <span>takipçi</span>
          </li>
          <li>
            <b>{me.following}</b>
            <span>takip</span>
          </li>
        </ul>
      </section>

      <section className="card estimate">
        <h2>
          <Wallet size={16} aria-hidden /> Hızlı yol maliyeti
        </h2>
        <div className="form-row">
          <label className="field-input">
            <span>Mesafe (km)</span>
            <input
              type="number"
              min={0}
              value={kmInput}
              onChange={(event) => setKmInput(event.target.value)}
            />
          </label>
          <label className="switch switch--inline">
            <input
              type="checkbox"
              checked={roundTrip}
              onChange={(event) => setRoundTrip(event.target.checked)}
            />
            <span className="switch__track" aria-hidden>
              <span className="switch__thumb" />
            </span>
            <span className="switch__label">Gidiş-dönüş</span>
          </label>
        </div>
        <ul>
          <li>
            <span>
              <Gauge size={13} aria-hidden /> Toplam mesafe
            </span>
            <b>{Math.round(calculator.distance)} km</b>
          </li>
          <li>
            <span>Tahmini sürüş</span>
            <b>{calculator.hours.toFixed(1).replace('.', ',')} saat</b>
          </li>
          <li>
            <span>Tüketilecek yakıt</span>
            <b>{calculator.liters.toFixed(1).replace('.', ',')} L</b>
          </li>
          <li className="estimate__total">
            <span>
              <Banknote size={14} aria-hidden /> Yakıt masrafı
            </span>
            <b>{formatPrice(calculator.fuel)}</b>
          </li>
        </ul>
        <p className="estimate__note">
          <Info size={13} aria-hidden /> {num(profile.consumption)} L/100 km · {num(profile.fuelPrice)}{' '}
          ₺/L değerleriyle, ortalama 80 km/sa hız varsayımıyla hesaplanır; otoban/mola masrafları dahil
          değildir.
        </p>
      </section>

      <section className="card">
        <h2>
          <MonitorSmartphone size={16} aria-hidden /> Görünüm
        </h2>
        <div className="segmented">
          <button type="button" className={theme === 'system' ? 'is-active' : ''} onClick={() => setTheme('system')}>
            Sistem
          </button>
          <button type="button" className={theme === 'light' ? 'is-active' : ''} onClick={() => setTheme('light')}>
            <Sun size={14} aria-hidden /> Açık
          </button>
          <button type="button" className={theme === 'dark' ? 'is-active' : ''} onClick={() => setTheme('dark')}>
            <Moon size={14} aria-hidden /> Koyu
          </button>
        </div>
      </section>

      <section className="card">
        <h2>
          <MapPin size={16} aria-hidden /> Konum
        </h2>
        <p className="muted">
          {location
            ? `${locationLabel ?? 'Seçili konum'} · ${location.lat.toFixed(3)}, ${location.lon.toFixed(3)}`
            : 'Konum seçilmedi. Mesafeler ve yakıt hesapları için konum gerekir.'}
        </p>
        <div className="map-links">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setLocation(DEMO_LOCATION, 'Antalya (demo)')
              show('Antalya demo konumu ayarlandı')
            }}
          >
            <LocateFixed size={15} aria-hidden /> Demo konum kullan
          </button>
          {location && (
            <button
              type="button"
              className="btn btn--ghost btn--sm btn--danger"
              onClick={() => {
                setLocation(null, null)
                show('Konum temizlendi')
              }}
            >
              <Trash2 size={15} aria-hidden /> Temizle
            </button>
          )}
        </div>
      </section>

      <section className="card stats-card">
        <div className="fact">
          <span>Favori</span>
          <b>
            <Heart size={14} aria-hidden /> {favorites.length}
          </b>
        </div>
        <div className="fact">
          <span>Gezi</span>
          <b>
            <Route size={14} aria-hidden /> {trips.length}
          </b>
        </div>
        <div className="fact">
          <span>İncelenen</span>
          <b>{visited.length}</b>
        </div>
        <div className="fact">
          <span>Veri kaydı</span>
          <b>Bu cihazda</b>
        </div>
      </section>

      <section className="card">
        <h2>
          <Download size={16} aria-hidden /> Uygulama
        </h2>
        <p className="muted">
          Karvan çevrimdışı çalışabilen bir PWA'dır. Telefonunuzda tam ekran kullanmak için ana ekrana
          ekleyin.
        </p>
        <div className="map-links">
          <button type="button" className="btn btn--primary btn--sm" onClick={install}>
            <Download size={15} aria-hidden /> Ana ekrana ekle
          </button>
          <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={resetAll}>
            <RotateCcw size={15} aria-hidden /> Tüm verileri sıfırla
          </button>
        </div>
        <ul className="info-list">
          <li>
            <CircleHelp size={14} aria-hidden /> iPhone'da Safari → Paylaş → “Ana Ekrana Ekle”
          </li>
          <li>
            <CircleHelp size={14} aria-hidden /> Android'de Chrome → Menü → “Uygulamayı yükle”
          </li>
          <li>
            <Info size={14} aria-hidden /> Veriler yalnızca bu cihazda saklanır; hesap gerekmez.
          </li>
        </ul>
      </section>

      <p className="demo-note">
        <Info size={14} aria-hidden />
        <span>
          Karvan sürüm 0.1.0 — kamp listesi, fiyatlar ve yorumlar örnek veridir. Gerçek tesis verisi
          bağlandığında arayüz aynı kalır.
        </span>
      </p>
    </div>
  )
}
