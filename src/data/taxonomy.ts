import {
  Blocks,
  Bus,
  Caravan,
  CircleParking,
  Dog,
  Droplets,
  Flame,
  Landmark,
  Mountain,
  Plug,
  Recycle,
  Sailboat,
  ShowerHead,
  Store,
  Sunrise,
  Tent,
  Toilet,
  TreePine,
  Truck,
  Utensils,
  WashingMachine,
  Waves,
  Wifi,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { AmenityKey, CampType, SceneryKey, VehicleKey } from '../types'

export interface Term<T extends string> {
  key: T
  label: string
  Icon: LucideIcon
}

/** Tesis olanakları — filtre çipleri ve detay listesinde kullanılır. */
export const AMENITIES: Term<AmenityKey>[] = [
  { key: 'elektrik', label: 'Elektrik', Icon: Plug },
  { key: 'su', label: 'İçme suyu', Icon: Droplets },
  { key: 'dus', label: 'Sıcak duş', Icon: ShowerHead },
  { key: 'wc', label: 'WC', Icon: Toilet },
  { key: 'wifi', label: 'Wi-Fi', Icon: Wifi },
  { key: 'camasir', label: 'Çamaşır makinesi', Icon: WashingMachine },
  { key: 'mutfak', label: 'Ortak mutfak', Icon: Utensils },
  { key: 'pet', label: 'Evcil hayvan kabul', Icon: Dog },
  { key: 'golge', label: 'Gölgeli parsel', Icon: TreePine },
  { key: 'deniz', label: 'Denize erişim', Icon: Waves },
  { key: 'ates', label: 'Ateş / mangal alanı', Icon: Flame },
  { key: 'kantin', label: 'Market / kantin', Icon: Store },
  { key: 'bosaltma', label: 'Gri su boşaltma', Icon: Recycle },
  { key: 'guvenlik', label: '7/24 güvenlik', Icon: ShieldCheck },
  { key: 'oyun', label: 'Çocuk oyun alanı', Icon: Blocks },
]

const AMENITY_MAP = new Map(AMENITIES.map((term) => [term.key, term]))

export const amenityTerm = (key: AmenityKey): Term<AmenityKey> =>
  AMENITY_MAP.get(key) ?? { key, label: key, Icon: Plug }

export const CAMP_TYPES: (Term<CampType> & { hint: string })[] = [
  { key: 'kamp', label: 'Kamp alanı', hint: 'Çadır ve karavan kabul eden klasik tesisler', Icon: Tent },
  { key: 'karavan-park', label: 'Karavan parkı', hint: 'Tam donanımlı parselli modern parklar', Icon: Caravan },
  { key: 'mola', label: 'Mola noktası', hint: 'Yol üstü kısa konaklamalar', Icon: CircleParking },
]

const TYPE_MAP = new Map(CAMP_TYPES.map((term) => [term.key, term]))

export const campTypeTerm = (key: CampType): Term<CampType> =>
  TYPE_MAP.get(key) ?? { key, label: key, Icon: Tent }

export const SCENERY: Term<SceneryKey>[] = [
  { key: 'deniz', label: 'Deniz', Icon: Waves },
  { key: 'gol', label: 'Göl / baraj', Icon: Sailboat },
  { key: 'orman', label: 'Orman', Icon: TreePine },
  { key: 'dag', label: 'Dağ / yayla', Icon: Mountain },
  { key: 'vadi', label: 'Vadi', Icon: Sunrise },
  { key: 'sehir', label: 'Şehir yakını', Icon: Landmark },
]

const SCENERY_MAP = new Map(SCENERY.map((term) => [term.key, term]))

export const sceneryTerm = (key: SceneryKey): Term<SceneryKey> =>
  SCENERY_MAP.get(key) ?? { key, label: key, Icon: Waves }

export const VEHICLES: (Term<VehicleKey> & { hint: string })[] = [
  { key: 'cekme', label: 'Çekme karavan', hint: 'Geniş parseller önceliklidir', Icon: Caravan },
  { key: 'moto', label: 'Motokaravan', hint: 'Boşaltma noktaları öne çıkar', Icon: Bus },
  { key: 'van', label: 'Panelvan dönüşümü', hint: 'Kompakt ve serbest kamp', Icon: Truck },
  { key: 'cadir', label: 'Çadır / SUV', hint: 'Doğa kampları önerilir', Icon: Tent },
]

const VEHICLE_MAP = new Map(VEHICLES.map((term) => [term.key, term]))

export const vehicleTerm = (key: VehicleKey): Term<VehicleKey> =>
  VEHICLE_MAP.get(key) ?? { key, label: key, Icon: Caravan }

export const TYPE_LABEL: Record<CampType, string> = {
  kamp: 'Kamp alanı',
  'karavan-park': 'Karavan parkı',
  mola: 'Mola noktası',
}

export const PRICE_MAX = 1500

/** Fiyat aralığını kısa etiketle gösterir. */
export function priceLabel(value: number): string {
  return value >= PRICE_MAX ? 'Tüm fiyatlar' : `${value} ₺'ye kadar`
}
