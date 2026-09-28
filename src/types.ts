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
  /** Topluluk profilinde görünen şehir. */
  city: string
  /** Topluluk profilinde görünen kısa tanıtım. */
  bio: string
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

/* --------------------------------------------------------------------------
   TOPLULUK (sosyal katman)
   -------------------------------------------------------------------------- */

/** Uygulama içindeki karavancı. `me` kimliği kullanıcının kendisidir. */
export interface CommunityUser {
  id: string
  name: string
  avatar: string
  /** Avatar halkası için renk tonu anahtarı. */
  tint: string
  vehicle: VehicleKey
  plate: string
  bio: string
  city: string
  /** Katılım yılı, örn. "2021". */
  since: string
  followers: number
  following: number
  /** Doğrulanmış hesap (işletme / içerik üreticisi). */
  verified?: boolean
}

/** Paylaşılan gezi özeti — gönderiye iliştirilir. */
export interface SharedRoute {
  distanceKm: number
  nights: number
  totalCost: number
  stops: number
  tripId?: string
}

export interface PostComment {
  id: string
  userId: string
  text: string
  createdAt: number
  likes: number
  likedByMe: boolean
}

export interface CommunityPost {
  id: string
  userId: string
  text: string
  image?: string
  /** Etiketlenen tesis. */
  campId?: string
  /** Serbest yer bilgisi (tesis etiketi yoksa). */
  place?: string
  /** Konu etiketi (#rota gibi). */
  topic?: string
  route?: SharedRoute
  createdAt: number
  likes: number
  likedByMe: boolean
  saved: boolean
  comments: PostComment[]
  /** Kullanıcının kendi paylaşımı mı? */
  mine?: boolean
}

export interface CommunityEvent {
  id: string
  title: string
  city: string
  lat: number
  lon: number
  startDate: string
  endDate: string
  image: string
  description: string
  campId?: string
  hostId: string
  tags: string[]
  /** Katılımcı kullanıcı kimlikleri. */
  attendees: string[]
  capacity: number
  /** Katılım ücreti (0 = ücretsiz). */
  fee: number
}

export type NotificationKind = 'like' | 'comment' | 'follow' | 'event' | 'system'

export interface AppNotification {
  id: string
  kind: NotificationKind
  userId?: string
  postId?: string
  eventId?: string
  text: string
  createdAt: number
  read: boolean
}
