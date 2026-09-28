import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CloudOff, Maximize2, Minimize2 } from 'lucide-react'
import type { GeoPoint } from '../types'

export interface MapMarker {
  id: string
  lat: number
  lon: number
  label: string
  /** Fiyat baloncuğunda gösterilir (kamp işaretleri için). */
  price?: number
  /** Ayrı renkte vurgulanır (seçili öğe). */
  highlight?: boolean
  kind?: 'camp' | 'stop' | 'place'
}

interface MapViewProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  userLocation?: GeoPoint | null
  activeId?: string | null
  onSelect?: (id: string) => void
  /** İşaretlerin tamamını kapsayacak şekilde yakınlaştırır. */
  fitToMarkers?: boolean
  className?: string
  /** Durakları sırayla bağlayan kesikli çizgi. */
  polyline?: [number, number][]
  fullscreenAllowed?: boolean
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>'

export default function MapView({
  markers,
  center = [39.0, 35.0],
  zoom = 6,
  userLocation = null,
  activeId = null,
  onSelect,
  fitToMarkers = false,
  className = '',
  polyline,
  fullscreenAllowed = true,
}: MapViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const [ready, setReady] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [tilesFailed, setTilesFailed] = useState(false)

  // Haritayı bir kez oluştur
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return
    const map = L.map(hostRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      worldCopyJump: true,
    })
    const tiles = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 19,
      detectRetina: true,
    })
    // Karolar yüklenemezse (çevrimdışı vb.) işaretler yine görünür kalsın
    let tileErrors = 0
    tiles.on('tileerror', () => {
      tileErrors += 1
      if (tileErrors > 5) setTilesFailed(true)
    })
    tiles.on('tileload', () => {
      tileErrors = 0
      setTilesFailed(false)
    })
    tiles.addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    setReady(true)

    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(hostRef.current)
    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      layerRef.current = null
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // İşaretler her render'da yeniden üretildiği için içerik parmak izi ile takip edilir
  const markerKey = useMemo(
    () =>
      markers
        .map(
          (marker) =>
            `${marker.id}:${marker.lat}:${marker.lon}:${marker.price ?? ''}:${marker.label}:${
              marker.highlight ? 1 : 0
            }:${marker.kind ?? 'camp'}`,
        )
        .join('|'),
    [markers],
  )

  const polylineKey = useMemo(
    () => (polyline ? polyline.map((point) => point.join(',')).join('|') : ''),
    [polyline],
  )

  // İşaretleri çiz
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer || !ready) return
    layer.clearLayers()

    markers.forEach((marker, markerIndex) => {
      const isCamp = marker.kind === undefined || marker.kind === 'camp'
      const classes = ['pin']
      if (marker.highlight) classes.push('pin--active')
      if (marker.kind === 'stop') classes.push('pin--stop')
      if (marker.kind === 'place') classes.push('pin--place')

      const delay = `animation-delay:${Math.min(markerIndex, 14) * 45}ms`
      const html = isCamp
        ? `<span class="${classes.join(' ')}" style="${delay}"><b>${marker.price ? `${marker.price} ₺` : marker.label}</b></span>`
        : `<span class="${classes.join(' ')}" style="${delay}"><i></i></span>`

      const icon = L.divIcon({
        html,
        className: 'pin-wrap',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })

      const leafletMarker = L.marker([marker.lat, marker.lon], { icon, title: marker.label })
      leafletMarker.bindTooltip(marker.label, { direction: 'top', offset: [0, -12], opacity: 0.95 })
      leafletMarker.on('click', () => onSelect?.(marker.id))
      leafletMarker.addTo(layer)
    })

    if (polyline && polyline.length > 1) {
      L.polyline(polyline, {
        color: '#0f3d2e',
        weight: 3,
        dashArray: '7 7',
        opacity: 0.75,
        className: 'route-path',
      }).addTo(layer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey, polylineKey, ready, onSelect])

  // Kullanıcı konumu işareti
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !userLocation) return
    const icon = L.divIcon({
      html: '<span class="pin-me"><i></i></span>',
      className: 'pin-wrap',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    })
    const marker = L.marker([userLocation.lat, userLocation.lon], { icon, title: 'Konumunuz' })
    marker.bindTooltip('Konumunuz', { direction: 'top', offset: [0, -10] })
    marker.addTo(map)
    return () => {
      marker.remove()
    }
  }, [userLocation, ready])

  // Görünümü güncelle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (fitToMarkers && markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((marker) => [marker.lat, marker.lon] as [number, number]))
      if (userLocation) bounds.extend([userLocation.lat, userLocation.lon])
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
      return
    }
    if (fitToMarkers && markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lon], Math.max(zoom, 11))
      return
    }
    if (activeId) {
      const active = markers.find((marker) => marker.id === activeId)
      if (active) map.setView([active.lat, active.lon], Math.max(map.getZoom(), 12), { animate: true })
      return
    }
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lon], Math.max(zoom, 9))
      return
    }
    map.setView(center, zoom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey, activeId, userLocation?.lat, userLocation?.lon, ready, fitToMarkers])

  return (
    <div className={`map-view${fullscreen ? ' is-fullscreen' : ''} ${className}`}>
      <div ref={hostRef} className="map-view__canvas" />
      {tilesFailed && (
        <p className="map-view__notice">
          <CloudOff size={13} aria-hidden />
          Harita karoları yüklenemedi — işaretler çevrimdışı da görünür
        </p>
      )}
      {fullscreenAllowed && (
        <button
          type="button"
          className="map-view__expand icon-btn"
          onClick={() => setFullscreen((prev) => !prev)}
          aria-label={fullscreen ? 'Haritayı küçült' : 'Haritayı tam ekran yap'}
        >
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      )}
    </div>
  )
}
