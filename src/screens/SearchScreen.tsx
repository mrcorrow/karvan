import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Sparkle, X } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { camps } from '../data/camps'
import { activeFilterCount, searchCamps, cityStats } from '../lib/search'
import { amenityTerm, campTypeTerm, sceneryTerm, PRICE_MAX } from '../data/taxonomy'
import CampCard from '../components/CampCard'
import FilterSheet from '../components/FilterSheet'
import EmptyState from '../components/EmptyState'

export default function SearchScreen() {
  const { filters, setFilters, resetFilters, favorites, toggleFavorite, location } = useApp()
  const [sheetOpen, setSheetOpen] = useState(false)

  const results = useMemo(
    () => searchCamps(camps, filters, { location, favorites }),
    [filters, location, favorites],
  )

  const filterCount = activeFilterCount(filters)
  const popular = useMemo(() => cityStats(camps).slice(0, 6), [])

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.types.map((type) => ({
      key: `type-${type}`,
      label: campTypeTerm(type).label,
      onRemove: () => setFilters({ types: filters.types.filter((item) => item !== type) }),
    })),
    ...filters.scenery.map((key) => ({
      key: `scenery-${key}`,
      label: sceneryTerm(key).label,
      onRemove: () => setFilters({ scenery: filters.scenery.filter((item) => item !== key) }),
    })),
    ...filters.amenities.map((key) => ({
      key: `amenity-${key}`,
      label: amenityTerm(key).label,
      onRemove: () => setFilters({ amenities: filters.amenities.filter((item) => item !== key) }),
    })),
    ...(filters.maxPrice < PRICE_MAX
      ? [
          {
            key: 'price',
            label: `${filters.maxPrice} ₺ altı`,
            onRemove: () => setFilters({ maxPrice: PRICE_MAX }),
          },
        ]
      : []),
    ...(filters.minRating > 0
      ? [
          {
            key: 'rating',
            label: `${filters.minRating.toString().replace('.', ',')}+ puan`,
            onRemove: () => setFilters({ minRating: 0 }),
          },
        ]
      : []),
    ...(filters.favoritesOnly
      ? [{ key: 'fav', label: 'Favorilerim', onRemove: () => setFilters({ favoritesOnly: false }) }]
      : []),
  ]

  return (
    <div className="screen screen--search">
      <header className="search-head">
        <div className="search-input">
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={filters.q}
            placeholder="Kamp alanı, şehir, ilçe ara…"
            onChange={(event) => setFilters({ q: event.target.value })}
            aria-label="Arama"
          />
          {filters.q && (
            <button type="button" className="icon-btn" onClick={() => setFilters({ q: '' })} aria-label="Aramayı temizle">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="button"
          className={`filter-btn${filterCount > 0 ? ' is-active' : ''}`}
          onClick={() => setSheetOpen(true)}
        >
          <SlidersHorizontal size={17} aria-hidden />
          {filterCount > 0 && <i>{filterCount}</i>}
        </button>
      </header>

      {chips.length > 0 && (
        <div className="chip-row chip-row--wrap chip-row--applied">
          {chips.map((chip) => (
            <button key={chip.key} type="button" className="chip chip--on" onClick={chip.onRemove}>
              {chip.label}
              <X size={13} aria-hidden />
            </button>
          ))}
          <button type="button" className="chip chip--clear" onClick={resetFilters}>
            Tümünü temizle
          </button>
        </div>
      )}

      <div className="results-bar">
        <b>{results.length} tesis</b>
        <span>
          {filters.sort === 'mesafe' && location
            ? 'mesafeye göre sıralı'
            : filters.sort === 'fiyat-artan'
              ? 'en uygun fiyat'
              : filters.sort === 'fiyat-azalan'
                ? 'en yüksek fiyat'
                : filters.sort === 'puan'
                  ? 'puana göre'
                  : 'editör önerisi'}
        </span>
      </div>

      {results.length === 0 ? (
        <EmptyState
          Icon={Search}
          title="Sonuç bulunamadı"
          description="Arama kelimesini değiştirmeyi veya filtreleri gevşetmeyi deneyin."
          action={{ label: 'Filtreleri temizle', onClick: resetFilters }}
        />
      ) : (
        <div className="camp-list">
          {results.map((camp) => (
            <CampCard
              key={camp.id}
              camp={camp}
              favorite={favorites.includes(camp.id)}
              onToggleFavorite={toggleFavorite}
              userLocation={location}
            />
          ))}
        </div>
      )}

      {filters.q === '' && chips.length === 0 && (
        <section className="section">
          <div className="section__head">
            <h2>
              <Sparkle size={16} aria-hidden /> Popüler bölgeler
            </h2>
          </div>
          <div className="chip-row chip-row--wrap">
            {popular.map((city) => (
              <button
                key={city.city}
                type="button"
                className="chip"
                onClick={() => setFilters({ q: city.city })}
              >
                {city.city}
                <em>{city.count}</em>
              </button>
            ))}
          </div>
        </section>
      )}

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
