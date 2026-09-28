import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { KEYS, loadJSON, saveJSON } from '../lib/storage'
import { uid } from '../lib/format'
import type { Filters, GeoPoint, Profile, Trip } from '../types'
import { PRICE_MAX } from '../data/taxonomy'

export const DEFAULT_PROFILE: Profile = {
  name: 'Gezgin',
  vehicle: 'moto',
  plate: '',
  avatar: '🚐',
  consumption: 11,
  fuelPrice: 62.5,
}

export const DEFAULT_FILTERS: Filters = {
  q: '',
  types: [],
  amenities: [],
  scenery: [],
  maxPrice: PRICE_MAX,
  minRating: 0,
  favoritesOnly: false,
  sort: 'onerilen',
}

type Theme = 'light' | 'dark' | 'system'

interface AppState {
  favorites: string[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
  trips: Trip[]
  addTrip: (input: Omit<Trip, 'id' | 'createdAt'>) => Trip
  updateTrip: (id: string, patch: Partial<Trip>) => void
  deleteTrip: (id: string) => void
  profile: Profile
  updateProfile: (patch: Partial<Profile>) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  location: GeoPoint | null
  locationLabel: string | null
  setLocation: (point: GeoPoint | null, label?: string | null) => void
  filters: Filters
  setFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
  visited: string[]
  markVisited: (id: string) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => loadJSON<string[]>(KEYS.favorites, []))
  const [trips, setTrips] = useState<Trip[]>(() => loadJSON<Trip[]>(KEYS.trips, []))
  const [profile, setProfile] = useState<Profile>(() => ({
    ...DEFAULT_PROFILE,
    ...loadJSON<Partial<Profile>>(KEYS.profile, {}),
  }))
  const [theme, setThemeState] = useState<Theme>(() => loadJSON<Theme>(KEYS.theme, 'system'))
  const [location, setLocationState] = useState<GeoPoint | null>(() =>
    loadJSON<GeoPoint | null>(KEYS.location, null),
  )
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
    ...loadJSON<Partial<Filters>>(KEYS.filters, {}),
  }))
  const [visited, setVisited] = useState<string[]>(() => loadJSON<string[]>('visited', []))

  useEffect(() => saveJSON(KEYS.favorites, favorites), [favorites])
  useEffect(() => saveJSON(KEYS.trips, trips), [trips])
  useEffect(() => saveJSON(KEYS.profile, profile), [profile])
  useEffect(() => saveJSON(KEYS.theme, theme), [theme])
  useEffect(() => saveJSON(KEYS.filters, filters), [filters])
  useEffect(() => saveJSON('visited', visited), [visited])
  useEffect(() => {
    if (location) saveJSON(KEYS.location, location)
  }, [location])

  // Tema: sistem tercihi de desteklenir
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      root.dataset.theme = dark ? 'dark' : 'light'
      const meta = document.querySelector('meta[name="theme-color"]')
      meta?.setAttribute('content', dark ? '#0b1f18' : '#0f3d2e')
    }
    apply()
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }, [])

  const addTrip = useCallback((input: Omit<Trip, 'id' | 'createdAt'>) => {
    const trip: Trip = { ...input, id: uid('gezi'), createdAt: Date.now() }
    setTrips((prev) => [trip, ...prev])
    return trip
  }, [])

  const updateTrip = useCallback((id: string, patch: Partial<Trip>) => {
    setTrips((prev) => prev.map((trip) => (trip.id === id ? { ...trip, ...patch } : trip)))
  }, [])

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== id))
  }, [])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }))
  }, [])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])

  const setLocation = useCallback((point: GeoPoint | null, label: string | null = null) => {
    setLocationState(point)
    setLocationLabel(label)
  }, [])

  const setFilters = useCallback((patch: Partial<Filters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
  }, [])

  const resetFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), [])

  const markVisited = useCallback((id: string) => {
    setVisited((prev) => (prev.includes(id) ? prev : [id, ...prev].slice(0, 24)))
  }, [])

  const value = useMemo<AppState>(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      trips,
      addTrip,
      updateTrip,
      deleteTrip,
      profile,
      updateProfile,
      theme,
      setTheme,
      location,
      locationLabel,
      setLocation,
      filters,
      setFilters,
      resetFilters,
      visited,
      markVisited,
    }),
    [
      favorites,
      isFavorite,
      toggleFavorite,
      trips,
      addTrip,
      updateTrip,
      deleteTrip,
      profile,
      updateProfile,
      theme,
      setTheme,
      location,
      locationLabel,
      setLocation,
      filters,
      setFilters,
      resetFilters,
      visited,
      markVisited,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp, AppProvider içinde kullanılmalıdır')
  return context
}

/** Mesafe hesabı için seçili konumu döner. */
export function useUserLocation(): GeoPoint | null {
  return useApp().location
}
