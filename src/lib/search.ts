import type { Camp, Filters, GeoPoint } from '../types'
import { distanceKm } from './geo'
import { normalize } from './format'

/** Arama + filtre + sıralama işlemlerini tek yerde toplar. */
export function searchCamps(
  camps: Camp[],
  filters: Filters,
  options: { location?: GeoPoint | null; favorites?: string[] } = {},
): Camp[] {
  const { location = null, favorites = [] } = options
  const query = normalize(filters.q)
  const terms = query.split(/\s+/).filter(Boolean)

  const result = camps.filter((camp) => {
    if (terms.length > 0) {
      const haystack = normalize(
        [camp.name, camp.city, camp.district, camp.summary, camp.about].join(' '),
      )
      if (!terms.every((term) => haystack.includes(term))) return false
    }
    if (filters.types.length > 0 && !filters.types.includes(camp.type)) return false
    if (filters.scenery.length > 0 && !camp.scenery.some((key) => filters.scenery.includes(key))) {
      return false
    }
    if (
      filters.amenities.length > 0 &&
      !filters.amenities.every((key) => camp.amenities.includes(key))
    ) {
      return false
    }
    if (camp.price > filters.maxPrice) return false
    if (filters.minRating > 0 && camp.rating < filters.minRating) return false
    if (filters.favoritesOnly && !favorites.includes(camp.id)) return false
    return true
  })

  const distanceOf = (camp: Camp) => (location ? distanceKm(location, camp) : Number.POSITIVE_INFINITY)

  return result.sort((a, b) => {
    switch (filters.sort) {
      case 'puan':
        return b.rating - a.rating || b.reviewCount - a.reviewCount
      case 'fiyat-artan':
        return a.price - b.price || b.rating - a.rating
      case 'fiyat-azalan':
        return b.price - a.price || b.rating - a.rating
      case 'mesafe':
        return distanceOf(a) - distanceOf(b) || b.rating - a.rating
      case 'onerilen':
      default: {
        const scoreOf = (camp: Camp) => {
          const distanceBoost = Number.isFinite(distanceOf(camp))
            ? Math.max(0, 60 - distanceOf(camp)) / 60
            : 0
          return camp.rating * 12 + (camp.featured ? 6 : 0) + distanceBoost * 5 + camp.reviewCount / 200
        }
        return scoreOf(b) - scoreOf(a)
      }
    }
  })
}

/** Filtrelerden bağımsız olarak seçili kriterlerin sayısı. */
export function activeFilterCount(filters: Filters): number {
  let count = 0
  if (filters.q.trim()) count += 1
  count += filters.types.length
  count += filters.scenery.length
  count += filters.amenities.length
  if (filters.maxPrice < 1500) count += 1
  if (filters.minRating > 0) count += 1
  if (filters.favoritesOnly) count += 1
  return count
}

/** Ada/şehre göre gruplanmış özet — keşif ekranındaki bölge şeridi için. */
export function cityStats(camps: Camp[]): { city: string; count: number; avgPrice: number }[] {
  const map = new Map<string, { count: number; total: number }>()
  for (const camp of camps) {
    const entry = map.get(camp.city) ?? { count: 0, total: 0 }
    entry.count += 1
    entry.total += camp.price
    map.set(camp.city, entry)
  }
  return [...map.entries()]
    .map(([city, entry]) => ({
      city,
      count: entry.count,
      avgPrice: Math.round(entry.total / entry.count),
    }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, 'tr'))
}

export function priceBounds(camps: Camp[]): { min: number; max: number; avg: number } {
  if (camps.length === 0) return { min: 0, max: 0, avg: 0 }
  const prices = camps.map((camp) => camp.price)
  const total = prices.reduce((sum, value) => sum + value, 0)
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round(total / prices.length),
  }
}
