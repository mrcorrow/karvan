import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, List, LocateFixed, MapPin, Navigation } from 'lucide-react'
import MapView, { type MapMarker } from '../components/MapView'
import { useApp } from '../store/AppStore'
import { camps } from '../data/camps'
import { CAMP_TYPES, TYPE_LABEL } from '../data/taxonomy'
import { searchCamps } from '../lib/search'
import { DEMO_LOCATION } from '../lib/demo'
import { useToast } from '../components/Toast'
import { formatDistance, distanceKm } from '../lib/geo'
import { formatPrice } from '../lib/format'
import Rating from '../components/Rating'
import type { CampType } from '../types'

export default function MapScreen() {
  const { filters, favorites, toggleFavorite, location, setLocation } = useApp()
  const { show } = useToast()
  const [types, setTypes] = useState<CampType[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const railRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const list = useMemo(
    () =>
      searchCamps(
        camps,
        { ...filters, types, sort: location ? 'mesafe' : 'puan', favoritesOnly: false },
        { location, favorites },
      ),
    [filters, types, location, favorites],
  )

  const markers: MapMarker[] = useMemo(
    () =>
      list.map((camp) => ({
        id: camp.id,
        lat: camp.lat,
        lon: camp.lon,
        label: `${camp.name} · ${formatPrice(camp.price)}`,
        price: camp.price,
        highlight: camp.id === activeId,
        kind: 'camp' as const,
      })),
    [list, activeId],
  )

  // Seçili kartı şeritte görünür yap
  useEffect(() => {
    if (!activeId || !railRef.current) return
    const element = cardRefs.current[activeId]
    element?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeId])

  const toggleType = (type: CampType) =>
    setTypes((prev) => (prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]))

  return (
    <div className="screen screen--map">
      <div className="map-toolbar">
        <div className="chip-row">
          <button
            type="button"
            className={`chip${location ? ' is-active' : ''}`}
            onClick={() => {
              if (location) {
                setLocation(null, null)
                show('Konum temizlendi')
                return
              }
              if (!('geolocation' in navigator)) {
                setLocation(DEMO_LOCATION, 'Antalya (demo)')
                return
              }
              navigator.geolocation.getCurrentPosition(
                (position) =>
                  setLocation(
                    { lat: position.coords.latitude, lon: position.coords.longitude },
                    'Geçerli konumunuz',
                  ),
                () => {
                  setLocation(DEMO_LOCATION, 'Antalya (demo)')
                  show('Konum izni yok — Antalya demo konumu kullanıldı')
                },
                { timeout: 6000 },
              )
            }}
          >
            <LocateFixed size={14} aria-hidden />
            {location ? 'Konumum açık' : 'Yakınımdakiler'}
          </button>
          <button
            type="button"
            className={`chip${types.length === 0 ? ' is-active' : ''}`}
            onClick={() => setTypes([])}
          >
            Tümü
          </button>
          {CAMP_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              className={`chip${types.includes(type.key) ? ' is-active' : ''}`}
              onClick={() => toggleType(type.key)}
            >
              <type.Icon size={14} aria-hidden />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="map-stage">
        <MapView
          markers={markers}
          userLocation={location}
          activeId={activeId}
          onSelect={setActiveId}
          fitToMarkers
          zoom={location ? 9 : 6}
          fullscreenAllowed
        />

        <div className="map-count">
          <MapPin size={13} aria-hidden />
          {list.length} tesis haritada
        </div>
      </div>

      <div className="map-sheet">
        <div className="map-sheet__head">
          <h2>{activeId ? 'Seçili tesis' : 'Haritadaki kamplar'}</h2>
          <Link to="/ara" className="section__link">
            <List size={14} aria-hidden /> Listeye geç
          </Link>
        </div>
        <div className="rail rail--map" ref={railRef}>
          {list.map((camp) => {
            const distance = location ? distanceKm(location, camp) : null
            return (
              <div
                key={camp.id}
                ref={(node) => {
                  cardRefs.current[camp.id] = node
                }}
                className={`map-card${camp.id === activeId ? ' is-active' : ''}`}
                onClick={() => setActiveId(camp.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setActiveId(camp.id)
                }}
              >
                <div className="map-card__media">
                  <img src={camp.image} alt="" loading="lazy" decoding="async" />
                  <button
                    type="button"
                    className={`camp-card__fav${favorites.includes(camp.id) ? ' is-active' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleFavorite(camp.id)
                    }}
                    aria-label="Favori"
                  >
                    <Heart size={16} fill={favorites.includes(camp.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="map-card__body">
                  <b>{camp.name}</b>
                  <span className="map-card__meta">
                    {TYPE_LABEL[camp.type]} · {camp.district}
                  </span>
                  <span className="map-card__meta">
                    <Rating value={camp.rating} compact />
                  </span>
                  <div className="map-card__foot">
                    <b>{formatPrice(camp.price)}</b>
                    {distance !== null && (
                      <em>
                        <Navigation size={12} aria-hidden /> {formatDistance(distance)}
                      </em>
                    )}
                  </div>
                  <Link to={`/kamp/${camp.id}`} className="btn btn--sm btn--primary">
                    Detay
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
