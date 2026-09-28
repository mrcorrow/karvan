import { parseDate } from './format'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Türkçe göreli zaman: "şimdi", "12 dk", "3 sa", "2 gün", "14 Eyl". */
export function timeAgo(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp)
  if (diff < MINUTE) return 'şimdi'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} dk`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} sa`
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} gün`
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(date)
}

/** Kısa süre biçimi: "1 sa 20 dk". */
export function shortDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} dk`
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return rest === 0 ? `${hours} sa` : `${hours} sa ${rest} dk`
}

/** Etkinliğe kalan gün sayısı (geçmişse negatif). */
export function daysUntil(isoDate: string, now = new Date()): number {
  const target = parseDate(isoDate)
  if (!target) return 0
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((end.getTime() - start.getTime()) / DAY)
}

/** "12 gün sonra" / "bugün" / "3 gün önce" */
export function relativeDay(isoDate: string, now = new Date()): string {
  const diff = daysUntil(isoDate, now)
  if (diff === 0) return 'bugün'
  if (diff === 1) return 'yarın'
  if (diff > 1) return `${diff} gün sonra`
  if (diff === -1) return 'dün'
  return `${Math.abs(diff)} gün önce`
}
