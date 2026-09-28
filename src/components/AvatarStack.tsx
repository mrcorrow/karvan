import type { CommunityUser } from '../types'
import Avatar from './Avatar'

interface AvatarStackProps {
  users: CommunityUser[]
  /** Listenin tamamı gösterilmez, kalan sayısı baloncukta yazar. */
  max?: number
  size?: 'sm' | 'md'
  /** Avatarlar profil sayfasına bağlansın mı? */
  link?: boolean
}

export default function AvatarStack({ users, max = 4, size = 'sm', link = true }: AvatarStackProps) {
  const shown = users.slice(0, max)
  const rest = users.length - shown.length

  return (
    <ul className={`avatar-stack avatar-stack--${size}`}>
      {shown.map((user) => (
        <li key={user.id} title={user.name}>
          <Avatar user={user} size={size === 'md' ? 'md' : 'sm'} link={link} />
        </li>
      ))}
      {rest > 0 && (
        <li>
          <span className="avatar avatar--more">+{rest}</span>
        </li>
      )}
    </ul>
  )
}
