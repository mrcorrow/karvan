# Karvan 🚐

Karavancılar için **kamp alanı keşif** uygulaması. Türkçe, mobil öncelikli bir **PWA**'dır:
telefon tarayıcısında açılır, ana ekrana eklenebilir, çevrimdışı çalışır ve Capacitor ile
Android/iOS paketine dönüştürülebilir.

## Neler var?

| Ekran | İçerik |
| --- | --- |
| **Keşfet** | Selamlama, konum bandı, hızlı filtre çipleri, editör seçimi ve yakındaki kamplar, bölgeye göre keşif, son baktıklarınız |
| **Harita** | Tüm tesisler fiyat baloncuklu işaretlerle, tesis tipi filtreleri, kart şeridi, tam ekran harita |
| **Ara** | Metin arama (Türkçe karakter duyarsız), 15 olanak + tesis tipi + manzara filtreleri, bütçe ve puan eşiği, 5 sıralama seçeneği |
| **Kamp detayı** | Fotoğraf, puan dağılımı, tesis olanakları, konum haritası, yol tarifi (Google/Apple Maps), telefonla arama, yakın çevredeki kamplar, yorum yazma |
| **Gezilerim** | Çok duraklı gezi planlama: gece sayısı, toplam km, sürüş süresi, yakıt + konaklama + ek masraf dökümü, rota haritası, planı kopyala/paylaş |
| **Profil** | Araç tipi, tüketim (L/100 km) ve yakıt fiyatı, hızlı yol maliyeti hesaplayıcı, açık/koyu tema, konum, veri yönetimi |

### Öne çıkan detaylar

- **Mesafe & maliyet mantığı**: kuş uçuşu mesafe × 1,28 katsayısıyla karayolu tahmini, ortalama 80 km/sa
  sürüş süresi, `mesafe / 100 × tüketim × litre fiyatı` yakıt hesabı.
- **Türkçe arama normalizasyonu**: `ı/İ/ç/ş/ğ/ü/ö` harfleri sadeleştirilir, "cesme" yazınca "Çeşme" bulunur.
- **Çevrimdışı**: service worker uygulama kabuğunu ve harita karolarını (son 240 karo) önbelleğe alır.
- **Yerel veri**: favoriler, geziler, profil ve yorumlar `localStorage`'da tutulur; hesap gerekmez.
- **Erişilebilirlik**: `aria-label`, `aria-pressed`, odak görünürlüğü ve azaltılmış hareket desteği.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ üretir
npm run preview    # derlenmiş sürümü sunar
npm run typecheck  # sadece tip kontrolü
```

## Telefonda deneme

1. Aynı wifi'deki bilgisayarda `npm run dev -- --host` çalıştırın.
2. Terminaldeki `Network` adresini telefonunuzda açın.
3. Tarayıcı menüsünden **Ana ekrana ekle** seçin — uygulama tam ekran açılır.

## Android / iOS paketi (Capacitor)

```bash
npm run build
npx cap add android     # ilk kez (native proje üretir)
npx cap add ios         # macOS + Xcode gerekir
npm run cap:sync        # dist'i native projelere kopyalar
npm run cap:android     # Android Studio ile açar
```

`android/` ve `ios/` klasörleri git'e eklenmez (`.gitignore` içindedir); ihtiyaç hâlinde
yukarıdaki komutlarla yeniden üretilir.

## Proje yapısı

```
src/
  components/   Card, harita, filtre paneli, sekme çubuğu, toast
  data/         camps.ts (örnek tesis verisi), taxonomy.ts (olanak/tip sözlüğü), places.ts
  lib/          geo (mesafe/rota), trip (bütçe özeti), search (filtre+sıralama), format, storage
  screens/      Discover, Map, Search, CampDetail, Trips, TripEditor, TripDetail, Profile
  store/        AppStore.tsx — favoriler, geziler, profil, tema, konum (Context + localStorage)
  types.ts      Ortak veri tipleri
```

## Örnek veri uyarısı

`src/data/camps.ts` içindeki **29 tesis kaydı tamamen örnektir**: tesis adları, telefon
numaraları, fiyatlar ve yorumlar temsilîdir, gerçek işletmeleri göstermez. Uygulama gerçek
bir API'ye bağlanacaksa tek yapılması gereken bu modülü bir `fetch` çağrısıyla değiştirmektir;
tip tanımları (`Camp`) aynı kalır.

## Yol haritası

- [ ] Topluluk akışı: karavancı paylaşımları, beğeni ve yorum
- [ ] Buluşma / etkinlik takvimi (karavan festival etkinlikleri)
- [ ] Bakım ve masraf günlüğü (garaj modülü)
- [ ] Çevrimdışı harita karolarının bölge bazlı indirilmesi
- [ ] Gerçek fiyat ve müsaitlik verisi için API entegrasyonu

## Lisans

MIT
