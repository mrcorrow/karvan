import type { Place } from '../types'

/**
 * Gezi planlayıcıda başlangıç noktası ve ara durak olarak seçilebilecek
 * şehirler ile popüler gezi noktaları. Koordinatlar şehir merkezini temsil eder.
 */
export const places: Place[] = [
  { id: 'p-istanbul', name: 'İstanbul', lat: 41.0151, lon: 28.9795 },
  { id: 'p-ankara', name: 'Ankara', lat: 39.9208, lon: 32.8541 },
  { id: 'p-izmir', name: 'İzmir', lat: 38.4237, lon: 27.1428 },
  { id: 'p-antalya', name: 'Antalya', lat: 36.8969, lon: 30.7133 },
  { id: 'p-bursa', name: 'Bursa', lat: 40.1885, lon: 29.061 },
  { id: 'p-adana', name: 'Adana', lat: 37.0, lon: 35.3213 },
  { id: 'p-konya', name: 'Konya', lat: 37.8746, lon: 32.4932 },
  { id: 'p-kayseri', name: 'Kayseri', lat: 38.7312, lon: 35.4787 },
  { id: 'p-samsun', name: 'Samsun', lat: 41.2867, lon: 36.33 },
  { id: 'p-trabzon', name: 'Trabzon', lat: 41.0027, lon: 39.7168 },
  { id: 'p-eskisehir', name: 'Eskişehir', lat: 39.7767, lon: 30.5206 },
  { id: 'p-gaziantep', name: 'Gaziantep', lat: 37.0662, lon: 37.3833 },
  { id: 'p-mugla', name: 'Muğla', lat: 37.2153, lon: 28.3636 },
  { id: 'p-canakkale', name: 'Çanakkale', lat: 40.1409, lon: 26.4048 },
  { id: 'poi-kapadokya', name: 'Kapadokya / Göreme', lat: 38.6431, lon: 34.8289 },
  { id: 'poi-oludeniz', name: 'Ölüdeniz', lat: 36.5497, lon: 29.1164 },
  { id: 'poi-uzungol', name: 'Uzungöl', lat: 40.6203, lon: 40.2933 },
  { id: 'poi-ayder', name: 'Ayder Yaylası', lat: 40.9503, lon: 41.1086 },
  { id: 'poi-efes', name: 'Efes Antik Kenti', lat: 37.9392, lon: 27.3417 },
  { id: 'poi-pamukkale', name: 'Pamukkale', lat: 37.9207, lon: 29.1206 },
  { id: 'poi-ihlara', name: 'Ihlara Vadisi', lat: 38.2489, lon: 34.3064 },
  { id: 'poi-nemrut', name: 'Nemrut Dağı', lat: 37.9808, lon: 38.7411 },
  { id: 'poi-salda', name: 'Salda Gölü', lat: 37.5511, lon: 29.6803 },
  { id: 'poi-kackar', name: 'Kaçkar Dağları', lat: 40.8833, lon: 41.1667 },
]
