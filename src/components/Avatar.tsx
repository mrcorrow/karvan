import { Link } from 'react-router-dom'
import type { CommunityUser } from '../types'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  user: Pick<CommunityUser, 'id' | 'name' | 'avatar' | 'tint'>
  size?: AvatarSize
  /** Çevresine vurgu halkası ekler. */
  ring?: boolean
  /** Profil sayfasına bağlantı verir. */
  link?: boolean
  className?: string
}

const EMOJI = /\p{Extended_Pictographic}/u
const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: 'avatar--sm',
  md: '',
  lg: 'avatar--lg',
  xl: 'avatar--xl',
}

/** İsimden baş harfleri üretir: "Elif Yamaç" → "EY". */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toLocaleUpperCase('tr-TR')
}

/**
 * Karavancı avatarı. Veri içindeki `avatar` alanı emoji ise emojiyi,
 * değilse isimden türetilen baş harfleri gösterir — böylece emoji desteği
 * olmayan cihazlarda da her zaman okunur bir görsel çıkar.
 */
export default function Avatar({ user, size = 'md', ring = false, link = false, className = '' }: AvatarProps) {
  const isEmoji = EMOJI.test(user.avatar)
  const classes = [
    'avatar',
    `avatar--${user.tint}`,
    SIZE_CLASS[size],
    ring ? 'avatar--ring' : '',
    isEmoji ? 'avatar--emoji' : 'avatar--initials',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = <span className={classes}>{isEmoji ? user.avatar : initialsOf(user.name)}</span>

  return link ? (
    <Link to={`/karavanci/${user.id}`} aria-label={user.name}>
      {content}
    </Link>
  ) : (
    content
  )
}
