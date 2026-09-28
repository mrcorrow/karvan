import type { Camp, GeoPoint } from '../types'

const EARTH_RADIUS_KM = 6371

const toRad = (deg: number) => (deg * Math.PI) / 180

/** İki koordinat arasındaki büyük daire mesafesi (km). */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Kuş uçuşu mesafeyi karayolu tahminine çevirir (dolambaç katsayısı ~1.28). */
export function roadDistanceKm(a: GeoPoint, b: GeoPoint): number {
  return distanceKm(a, b) * 1.28
}

export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return ''
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`
  return `${Math.round(km)} km`
}

/** Bir noktanın en yakın kamp alanlarını döner. */
export function nearestCamps(camps: Camp[], point: GeoPoint, limit = 3, excludeId?: string): Camp[] {
  return camps
    .filter((camp) => camp.id !== excludeId)
    .map((camp) => ({ camp, d: distanceKm(point, camp) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((entry) => entry.camp)
}

/** Rota üzerindeki toplam sürüş mesafesi (km) — duraklar sırayla bağlanır. */
export function routeDistanceKm(points: GeoPoint[]): number {
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    total += roadDistanceKm(points[i - 1], points[i])
  }
  return total
}

export function centerOf(points: GeoPoint[]): GeoPoint | null {
  if (points.length === 0) return null
  const sum = points.reduce(
    (acc, point) => ({ lat: acc.lat + point.lat, lon: acc.lon + point.lon }),
    { lat: 0, lon: 0 },
  )
  return { lat: sum.lat / points.length, lon: sum.lon / points.length }
}
