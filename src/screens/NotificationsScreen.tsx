import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  Heart,
  Info,
  MessageCircle,
  UserPlus,
} from 'lucide-react'
import { useSocial } from '../store/SocialStore'
import { timeAgo } from '../lib/time'
import EmptyState from '../components/EmptyState'
import type { AppNotification } from '../types'

const ICONS = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  event: CalendarDays,
  system: Info,
} as const

export default function NotificationsScreen() {
  const navigate = useNavigate()
  const { notifications, markAllRead, unreadCount, getUser } = useSocial()

  const target = (notification: AppNotification) => {
    if (notification.eventId) return `/etkinlik/${notification.eventId}`
    if (notification.postId && notification.userId) return '/akis'
    if (notification.userId) return `/karavanci/${notification.userId}`
    return '/akis'
  }

  return (
    <div className="screen screen--notifications">
      <header className="page-head">
        <div className="page-head__left">
          <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Geri">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Bildirimler</h1>
            <p className="muted">{unreadCount > 0 ? `${unreadCount} yeni etkileşim` : 'Tümü okundu'}</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={markAllRead}>
            <Check size={15} aria-hidden /> Okundu say
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          Icon={Bell}
          title="Bildirim yok"
          description="Paylaşım yaptığında gelen beğeni, yorum ve takip istekleri burada görünür."
        />
      ) : (
        <ul className="notif-list">
          {notifications.map((notification, index) => {
            const Icon = ICONS[notification.kind]
            const user = notification.userId ? getUser(notification.userId) : undefined
            return (
              <li
                key={notification.id}
                className={`notif anim-rise${notification.read ? '' : ' is-unread'}`}
                style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
              >
                <Link to={target(notification)} className="notif__link">
                  <span className={`notif__icon notif__icon--${notification.kind}`}>
                    <Icon size={16} aria-hidden />
                  </span>
                  {user && <span className={`avatar avatar--${user.tint} avatar--sm`}>{user.avatar}</span>}
                  <span className="notif__body">
                    <b>{notification.text}</b>
                    <em>{timeAgo(notification.createdAt)}</em>
                  </span>
                  {!notification.read && <i className="notif__dot" aria-label="Okunmadı" />}
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <p className="demo-note">
        <Info size={14} aria-hidden />
        <span>
          Bildirimler demo amaçlıdır: kendi paylaşımından sonra gelen beğeni ve yorumlar birkaç saniye
          içinde simüle edilir. Gerçek sürümde sunucudan (push/websocket) gelir.
        </span>
      </p>
    </div>
  )
}
