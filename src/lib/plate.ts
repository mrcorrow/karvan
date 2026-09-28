/** İl plakası kodundan şehir adı — topluluk profilinde konum göstermek için. */
const PLATES: Record<string, string> = {
  '01': 'Adana',
  '06': 'Ankara',
  '07': 'Antalya',
  '09': 'Aydın',
  '16': 'Bursa',
  '17': 'Çanakkale',
  '20': 'Denizli',
  '22': 'Edirne',
  '26': 'Eskişehir',
  '31': 'Hatay',
  '34': 'İstanbul',
  '35': 'İzmir',
  '36': 'Kars',
  '38': 'Kayseri',
  '41': 'Kocaeli',
  '42': 'Konya',
  '43': 'Kütahya',
  '45': 'Manisa',
  '46': 'Kahramanmaraş',
  '48': 'Muğla',
  '52': 'Ordu',
  '53': 'Rize',
  '54': 'Sakarya',
  '55': 'Samsun',
  '58': 'Sivas',
  '61': 'Trabzon',
  '63': 'Şanlıurfa',
  '68': 'Aksaray',
  '81': 'Düzce',
}

/** "34 ABC 123" → "İstanbul"; tanınmayan girişte null döner. */
export function plateCity(plate: string): string | null {
  const code = plate.trim().slice(0, 2)
  if (!/^\d{2}$/.test(code)) return null
  return PLATES[code] ?? null
}

export function normalizePlate(value: string): string {
  return value
    .toLocaleUpperCase('tr-TR')
    .replace(/[^0-9A-ZÇĞİÖŞÜ ]/g, '')
    .slice(0, 12)
}
