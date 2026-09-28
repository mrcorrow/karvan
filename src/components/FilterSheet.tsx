import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, Heart, RotateCcw, Star, Wallet, X } from 'lucide-react'
import { DEFAULT_FILTERS, useApp } from '../store/AppStore'
import { AMENITIES, CAMP_TYPES, PRICE_MAX, SCENERY } from '../data/taxonomy'
import { camps } from '../data/camps'
import { searchCamps } from '../lib/search'
import { formatPrice } from '../lib/format'
import type { SortKey } from '../types'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'onerilen', label: 'Önerilen' },
  { key: 'puan', label: 'Puan' },
  { key: 'fiyat-artan', label: 'Ucuz' },
  { key: 'fiyat-azalan', label: 'Pahalı' },
  { key: 'mesafe', label: 'Yakın' },
]

export default function FilterSheet({ open, onClose }: FilterSheetProps) {
  const { filters, setFilters, resetFilters, favorites } = useApp()
  const [draft, setDraft] = useState(filters)

  // Panel her açıldığında güncel filtrelerle başla
  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const resultCount = useMemo(
    () => searchCamps(camps, draft, { favorites }).length,
    [draft, favorites],
  )

  const toggleList = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

  if (!open) return null

  const apply = () => {
    setFilters(draft)
    onClose()
  }

  const clear = () => {
    resetFilters()
    setDraft({ ...DEFAULT_FILTERS, sort: draft.sort })
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Filtreler">
      <button type="button" className="sheet__backdrop" aria-label="Kapat" onClick={onClose} />
      <div className="sheet__panel">
        <header className="sheet__head">
          <h2>Sırala ve filtrele</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </header>

        <div className="sheet__body">
          <section className="field">
            <h3 className="field__title">
              <ArrowUpDown size={15} aria-hidden /> Sıralama
            </h3>
            <div className="segmented">
              {SORTS.map((sort) => (
                <button
                  key={sort.key}
                  type="button"
                  className={draft.sort === sort.key ? 'is-active' : ''}
                  onClick={() => setDraft({ ...draft, sort: sort.key })}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </section>

          <section className="field">
            <h3 className="field__title">Tesis tipi</h3>
            <div className="choice-grid">
              {CAMP_TYPES.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  className={`choice${draft.types.includes(type.key) ? ' is-active' : ''}`}
                  onClick={() => setDraft({ ...draft, types: toggleList(draft.types, type.key) })}
                >
                  <type.Icon size={18} aria-hidden />
                  <span>
                    <b>{type.label}</b>
                    <em>{type.hint}</em>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="field">
            <h3 className="field__title">Manzara / çevre</h3>
            <div className="chip-row chip-row--wrap">
              {SCENERY.map((term) => (
                <button
                  key={term.key}
                  type="button"
                  className={`chip${draft.scenery.includes(term.key) ? ' is-active' : ''}`}
                  onClick={() =>
                    setDraft({ ...draft, scenery: toggleList(draft.scenery, term.key) })
                  }
                >
                  <term.Icon size={14} aria-hidden />
                  {term.label}
                </button>
              ))}
            </div>
          </section>

          <section className="field">
            <h3 className="field__title">
              <Wallet size={15} aria-hidden /> Gecelik bütçe
            </h3>
            <input
              type="range"
              min={300}
              max={PRICE_MAX}
              step={50}
              value={draft.maxPrice}
              onChange={(event) => setDraft({ ...draft, maxPrice: Number(event.target.value) })}
              aria-label="Maksimum gecelik ücret"
            />
            <p className="field__hint">
              {draft.maxPrice >= PRICE_MAX
                ? 'Tüm fiyatlar gösteriliyor'
                : `${formatPrice(draft.maxPrice)} ve altı`}
            </p>
          </section>

          <section className="field">
            <h3 className="field__title">
              <Star size={15} aria-hidden /> Minimum puan
            </h3>
            <div className="chip-row">
              {[0, 4, 4.5, 4.8].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`chip${draft.minRating === value ? ' is-active' : ''}`}
                  onClick={() => setDraft({ ...draft, minRating: value })}
                >
                  {value === 0 ? 'Tümü' : `${value.toString().replace('.', ',')}+`}
                </button>
              ))}
            </div>
          </section>

          <section className="field">
            <h3 className="field__title">Olanaklar</h3>
            <div className="chip-row chip-row--wrap">
              {AMENITIES.map((term) => (
                <button
                  key={term.key}
                  type="button"
                  className={`chip${draft.amenities.includes(term.key) ? ' is-active' : ''}`}
                  onClick={() =>
                    setDraft({ ...draft, amenities: toggleList(draft.amenities, term.key) })
                  }
                >
                  <term.Icon size={14} aria-hidden />
                  {term.label}
                </button>
              ))}
            </div>
          </section>

          <section className="field">
            <label className="switch">
              <input
                type="checkbox"
                checked={draft.favoritesOnly}
                onChange={(event) => setDraft({ ...draft, favoritesOnly: event.target.checked })}
              />
              <span className="switch__track" aria-hidden>
                <span className="switch__thumb" />
              </span>
              <span className="switch__label">
                <Heart size={15} aria-hidden /> Sadece favorilerim
              </span>
            </label>
          </section>
        </div>

        <footer className="sheet__foot">
          <button type="button" className="btn btn--ghost" onClick={clear}>
            <RotateCcw size={16} aria-hidden />
            Temizle
          </button>
          <button type="button" className="btn btn--primary" onClick={apply}>
            {resultCount} sonucu göster
          </button>
        </footer>
      </div>
    </div>
  )
}
