import { getCamp } from '../data/camps'
import { places } from '../data/places'
import { formatPrice } from './format'
import { routeDistanceKm } from './geo'
import type { Camp, GeoPoint, Profile, Trip } from '../types'

/** Ortalama seyahat hızı (km/sa) — sürüş süresi tahmini için. */
export const AVG_SPEED = 80

export interface TripStopDetail {
  camp: Camp
  nights: number
  /** Bir önceki duraktan (ya da başlangıç noktasından) mesafe. */
  legKm: number
  cost: number
}

export interface TripSummary {
  stops: TripStopDetail[]
  points: GeoPoint[]
  totalNights: number
  distanceKm: number
  drivingHours: number
  fuelCost: number
  campCost: number
  extrasCost: number
  totalCost: number
  campCount: number
}

export function tripStartPoint(trip: Trip): GeoPoint | null {
  if (!trip.startPlaceId) return null
  const place = places.find((item) => item.id === trip.startPlaceId)
  return place ? { lat: place.lat, lon: place.lon } : null
}

export function tripStartName(trip: Trip): string | null {
  const place = places.find((item) => item.id === trip.startPlaceId)
  return place ? place.name : null
}

/** Gezi rotasını başlangıç noktası + duraklar sırasıyla döner. */
export function tripPoints(trip: Trip, startOverride?: GeoPoint | null): GeoPoint[] {
  const start = startOverride ?? tripStartPoint(trip)
  const points: GeoPoint[] = start ? [start] : []
  for (const stop of trip.stops) {
    const camp = getCamp(stop.campId)
    if (camp) points.push({ lat: camp.lat, lon: camp.lon })
  }
  return points
}

export function summarizeTrip(
  trip: Trip,
  profile: Profile,
  startOverride?: GeoPoint | null,
): TripSummary {
  const start = startOverride ?? tripStartPoint(trip)
  const points = tripPoints(trip, start)
  const distanceKm = routeDistanceKm(points)
  const fuelCost = (distanceKm / 100) * profile.consumption * profile.fuelPrice

  let previous: GeoPoint | null = start ? { lat: start.lat, lon: start.lon } : null
  const stopDetails: TripStopDetail[] = []
  let campCost = 0
  let totalNights = 0

  for (const stop of trip.stops) {
    const camp = getCamp(stop.campId)
    if (!camp) continue
    const legKm = previous
      ? routeDistanceKm([previous, { lat: camp.lat, lon: camp.lon }])
      : 0
    const cost = camp.price * stop.nights
    campCost += cost
    totalNights += stop.nights
    stopDetails.push({ camp, nights: stop.nights, legKm, cost })
    previous = { lat: camp.lat, lon: camp.lon }
  }

  const extrasCost = trip.dailyExtras * Math.max(0, totalNights)

  return {
    stops: stopDetails,
    points,
    totalNights,
    distanceKm,
    drivingHours: distanceKm / AVG_SPEED,
    fuelCost,
    campCost,
    extrasCost,
    totalCost: fuelCost + campCost + extrasCost,
    campCount: stopDetails.length,
  }
}

/** Gezi özeti başlangıç saatinden bitiş tarihini üretir. */
export function endDateFrom(startDate: string, nights: number): string {
  const date = new Date(startDate)
  if (Number.isNaN(date.getTime())) return startDate
  date.setDate(date.getDate() + Math.max(0, nights))
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Panoya kopyalanabilir / paylaşılabilir gezi metni. */
export function tripToText(trip: Trip, summary: TripSummary, profile: Profile): string {
  const lines: string[] = []
  lines.push(`KARVAN GEZİ PLANI — ${trip.name}`)
  lines.push(`Tarih: ${trip.startDate} → ${trip.endDate} (${summary.totalNights} gece)`)
  const startName = tripStartName(trip)
  if (startName) lines.push(`Başlangıç: ${startName}`)
  lines.push('')
  lines.push('DURAKLAR')
  summary.stops.forEach((stop, index) => {
    const leg = index === 0 && startName ? `${Math.round(stop.legKm)} km (başlangıçtan)` : `${Math.round(stop.legKm)} km`
    lines.push(
      `${index + 1}. ${stop.camp.name} — ${stop.camp.district}, ${stop.camp.city} | ${stop.nights} gece | ${formatPrice(stop.cost)} | ${leg}`,
    )
  })
  lines.push('')
  lines.push('ÖZET')
  lines.push(`Toplam mesafe: ${Math.round(summary.distanceKm)} km (~${summary.drivingHours.toFixed(1)} sa sürüş)`)
  lines.push(`Konaklama: ${formatPrice(summary.campCost)}`)
  lines.push(
    `Yakıt: ${formatPrice(summary.fuelCost)} (${profile.consumption} L/100 km × ${profile.fuelPrice} ₺/L)`,
  )
  if (summary.extrasCost > 0) lines.push(`Ek masraflar: ${formatPrice(summary.extrasCost)}`)
  lines.push(`TOPLAM: ${formatPrice(summary.totalCost)}`)
  if (trip.note.trim()) {
    lines.push('')
    lines.push(`NOT: ${trip.note.trim()}`)
  }
  lines.push('')
  lines.push('Karvan ile planlandı')
  return lines.join('\n')
}
