import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Clock,
  Info,
  LocateFixed,
  MapPin,
  Search,
  Sparkle,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { DEFAULT_FILTERS, useApp } from '../store/AppStore'
import { useToast } from '../components/Toast'
import { camps, getCamp } from '../data/camps'
import { CAMP_TYPES, SCENERY } from '../data/taxonomy'
import { searchCamps, cityStats } from '../lib/search'
import { DEMO_LOCATION } from '../lib/demo'
import CampCard from '../components/CampCard'

export default function DiscoverScreen() {
  const { profile, location, locationLabel, setLocation, favorites, toggleFavorite, setFilters, visited } =
    useApp()
  const { show } = useToast()
  const navigate = useNavigate()
  const [locating, setLocating] = useState(false)

  const featured = useMemo(() => camps.filter((camp) => camp.featured), [])
  const nearby = useMemo(() => {
    if (!location) return []
    return searchCamps(camps, { ...DEFAULT_FILTERS, sort: 'mesafe' }, { location }).slice(0, 6)
  }, [location])
  const cities = useMemo(() => cityStats(camps).slice(0, 8), [])
  const recent = useMemo(
    () => visited.map((id) => getCamp(id)).filter((camp): camp is NonNullable<typeof camp> => Boolean(camp)),
    [visited],
  )

  const useDemoLocation = (silent = false) => {
    setLocation(DEMO_LOCATION, 'Antalya (demo)')
    if (!silent) show('Konum Antalya olarak ayarlandı')
  }

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      useDemoLocation()
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        setLocation(
          { lat: position.coords.latitude, lon: position.coords.longitude },
          'Geçerli konumunuz',
        )
        show('Yakınınızdaki kamplar listelendi')
      },
      () => {
        setLocating(false)
        setLocation(DEMO_LOCATION, 'Antalya (demo)')
        show('Konum izni yok — Antalya demo konumu kullanıldı')
      },
      { timeout: 6000 },
    )
  }

  const quickFilter = (patch: Partial<typeof DEFAULT_FILTERS>) => {
    setFilters(patch)
    navigate('/ara')
  }

  return (
    <div className="screen screen--home">
      <header className="home-head">
        <div className="home-head__row">
          <div>
            <p className="home-head__hi">
              Merhaba <b>{profile.name}</b> {profile.avatar}
            </p>
            <h1>Nereye gidiyoruz?</h1>
          </div>
          <Link to="/profil" className="avatar-btn" aria-label="Profil">
            {profile.avatar}
          </Link>
        </div>

        <button type="button" className="search-pill" onClick={() => navigate('/ara')}>
          <Search size={18} aria-hidden />
          <span>Kamp alanı, şehir ya da bölge ara</span>
          <SlidersHorizontal size={16} aria-hidden className="search-pill__filter" />
        </button>
      </header>

      <section className="loc-banner">
        {location ? (
          <>
            <span className="loc-banner__icon">
              <MapPin size={17} aria-hidden />
            </span>
            <div>
              <b>{locationLabel ?? 'Seçili konum'}</b>
              <em>Mesafeler bu noktaya göre hesaplanıyor</em>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setLocation(null, null)
                show('Konum temizlendi')
              }}
              aria-label="Konumu temizle"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <span className="loc-banner__icon">
              <LocateFixed size={17} aria-hidden />
            </span>
            <div>
              <b>Yakınındaki kampları gör</b>
              <em>Konum izni verilmezse Antalya demo konumu kullanılır</em>
            </div>
            <button type="button" className="btn btn--sm btn--primary" onClick={requestLocation}>
              {locating ? 'Aranıyor…' : 'Aç'}
            </button>
          </>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2>
            <Sparkle size={16} aria-hidden /> Hızlı keşif
          </h2>
        </div>
        <div className="chip-row chip-row--wrap">
          {CAMP_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              className="chip"
              onClick={() => quickFilter({ types: [type.key] })}
            >
              <type.Icon size={14} aria-hidden />
              {type.label}
            </button>
          ))}
          {SCENERY.slice(0, 4).map((term) => (
            <button
              key={term.key}
              type="button"
              className="chip"
              onClick={() => quickFilter({ scenery: [term.key] })}
            >
              <term.Icon size={14} aria-hidden />
              {term.label}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Editörün seçtiği kamplar</h2>
          <Link to="/ara" className="section__link">
            Tümü <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        <div className="rail">
          {featured.map((camp) => (
            <CampCard
              key={camp.id}
              camp={camp}
              variant="rail"
              favorite={favorites.includes(camp.id)}
              onToggleFavorite={toggleFavorite}
              userLocation={location}
            />
          ))}
        </div>
      </section>

      {nearby.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>Yakınındaki kamplar</h2>
            <Link to="/harita" className="section__link">
              Haritada <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          <div className="rail">
            {nearby.map((camp) => (
              <CampCard
                key={camp.id}
                camp={camp}
                variant="rail"
                favorite={favorites.includes(camp.id)}
                onToggleFavorite={toggleFavorite}
                userLocation={location}
              />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section__head">
          <h2>Bölgeye göre keşfet</h2>
        </div>
        <div className="city-grid">
          {cities.map((city) => (
            <button
              key={city.city}
              type="button"
              className="city-card"
              onClick={() => quickFilter({ q: city.city })}
            >
              <b>{city.city}</b>
              <em>{city.count} tesis</em>
              <span>ort. {city.avgPrice} ₺</span>
            </button>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>
              <Clock size={16} aria-hidden /> Son baktıkların
            </h2>
          </div>
          <div className="rail">
            {recent.map((camp) => (
              <CampCard
                key={camp.id}
                camp={camp}
                variant="rail"
                favorite={favorites.includes(camp.id)}
                onToggleFavorite={toggleFavorite}
                userLocation={location}
              />
            ))}
          </div>
        </section>
      )}

      <p className="demo-note">
        <Info size={14} aria-hidden />
        <span>
          Bu sürümdeki tesis adları, fiyatlar ve yorumlar <b>örnek veridir</b>; gerçek işletmeleri
          göstermez. Gerçek veriler bağlandığında uygulama aynı şekilde çalışır.
        </span>
      </p>
    </div>
  )
}
