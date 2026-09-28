const currency = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
})

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
const shortDateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' })

export function formatPrice(value: number): string {
  return currency.format(value)
}

export function formatDate(iso: string): string {
  const date = parseDate(iso)
  return date ? dateFmt.format(date) : '—'
}

export function formatShortDate(iso: string): string {
  const date = parseDate(iso)
  return date ? shortDateFmt.format(date) : '—'
}

export function parseDate(iso: string): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

export function todayISO(offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return toISODate(date)
}

export function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** İki tarih arasındaki gece sayısı. */
export function nightsBetween(start: string, end: string): number {
  const a = parseDate(start)
  const b = parseDate(end)
  if (!a || !b) return 0
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000)
  return Math.max(0, diff)
}

/** Türkçe arama için aksan/şapka duyarsız normalizasyon. */
export function normalize(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .trim()
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Sayıyı Türkçe ondalık ayracıyla gösterir (62,5 gibi). */
export function num(value: number, maxDigits = 1): string {
  return value.toLocaleString('tr-TR', { maximumFractionDigits: maxDigits })
}

export function plural(n: number, singular: string, pluralForm?: string): string {
  return `${n} ${n === 1 ? singular : (pluralForm ?? singular)}`
}

export function compactNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',').replace(',0', '')}B`
  return `${n}`
}
