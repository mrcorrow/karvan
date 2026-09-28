const PREFIX = 'karvan:'

/** localStorage tabanlı okuma — hatalı/bozuk veride varsayılana döner. */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* kota dolu ya da gizli mod: sessizce yut */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* yoksay */
  }
}

export const KEYS = {
  favorites: 'favorites',
  trips: 'trips',
  profile: 'profile',
  theme: 'theme',
  location: 'location',
  filters: 'last-filters',
  onboarded: 'onboarded',
  visited: 'visited',
  reviews: 'my-reviews',
} as const
