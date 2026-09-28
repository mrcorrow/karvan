/**
 * Konum izni olmadığında kullanılan demo başlangıç noktası.
 * Gerçek kullanımda konum doğrudan cihazdan alınır (navigator.geolocation).
 */
export const DEMO_LOCATION = { lat: 36.8969, lon: 30.7133 }

/** Hızlı erişim için sık kullanılan rota noktaları. */
export const DEMO_ROUTE = [
  { lat: 36.8969, lon: 30.7133 }, // Antalya
  { lat: 36.5486, lon: 30.45 }, // Çıralı
  { lat: 36.2013, lon: 29.64 }, // Kaş
  { lat: 36.7245, lon: 27.685 }, // Datça
]
