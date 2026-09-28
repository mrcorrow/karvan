/** Uygulama genelinde kullanılan veri tipleri. */

export type AmenityKey =
  | 'elektrik'
  | 'su'
  | 'dus'
  | 'wc'
  | 'wifi'
  | 'camasir'
  | 'mutfak'
  | 'pet'
  | 'golge'
  | 'deniz'
  | 'ates'
  | 'kantin'
  | 'bosaltma'
  | 'guvenlik'
  | 'oyun'

/** Tesis tipi: klasik kamp, karavan parkı ya da yol üstü mola noktası. */
export type CampType = 'kamp' | 'karavan-park' | 'mola'

/** Manzara / çevre tipi. */
export type SceneryKey = 'deniz' | 'gol' | 'orman' | 'dag' | 'vadi' | 'sehir'

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  text: string
}

export interface Camp {
  id: string
  name: string
  city: string
  district: string
  lat: number
  lon: number
  type: CampType
  /** Gecelik ücret (karavan + 2 kişi, TL). */
  price: number
  priceNote: string
  rating: number
  reviewCount: number
  /** Kart üzerinde görünen tek cümlelik özet. */
  summary: string
  about: string
  amenities: AmenityKey[]
  scenery: SceneryKey[]
  image: string
  phone: string
  season: string
  capacity: number
  altitude: number
  featured?: boolean
  reviews: Review[]
}

export interface TripStop {
  campId: string
  nights: number
}

export interface Trip {
  id: string
  name: string
  startDate: string
  /** Gezi bitiş tarihi; toplam gece sayısından otomatik hesaplanır. */
  endDate: string
  /** Başlangıç noktası (şehir/POI kimliği). Boşsa rota ilk duraktan başlar. */
  startPlaceId: string | null
  stops: TripStop[]
  /** Günlük yemek, giriş, aktivite gibi ek masraflar (TL). */
  dailyExtras: number
  note: string
  createdAt: number
}

export type VehicleKey = 'cekme' | 'moto' | 'van' | 'cadir'

export interface Profile {
  name: string
  vehicle: VehicleKey
  plate: string
  avatar: string
  /** 100 km'de ortalama yakıt tüketimi (L). */
  consumption: number
  /** Yakıt litre fiyatı (TL). */
  fuelPrice: number
}

export interface GeoPoint {
  lat: number
  lon: number
}

export type SortKey = 'onerilen' | 'puan' | 'fiyat-artan' | 'fiyat-azalan' | 'mesafe'

export interface Filters {
  q: string
  types: CampType[]
  amenities: AmenityKey[]
  scenery: SceneryKey[]
  maxPrice: number
  minRating: number
  favoritesOnly: boolean
  sort: SortKey
}

export interface Place {
  id: string
  name: string
  lat: number
  lon: number
}
