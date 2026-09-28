import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  MapPin,
  Pencil,
  Share2,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { useSocial } from '../store/SocialStore'
import { useToast } from '../components/Toast'
import { getCamp } from '../data/camps'
import { vehicleTerm } from '../data/taxonomy'
import { useCountUp } from '../hooks/animations'
import PostCard from '../components/PostCard'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'

export default function UserProfileScreen() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { show } = useToast()
  const { getUser, postsByUser, isFollowing, toggleFollow, followerCount, me } = useSocial()
  const [followPulse, setFollowPulse] = useState(false)

  const user = getUser(userId ?? '')
  const posts = useMemo(() => (user ? postsByUser(user.id) : []), [user, postsByUser])
  const followers = useCountUp(user ? followerCount(user.id) : 0)
  const isMe = user?.id === me.id
  const following = user ? isFollowing(user.id) : false

  const visitedCamps = useMemo(() => {
    const ids = [...new Set(posts.map((post) => post.campId).filter(Boolean))] as string[]
    return ids.map((id) => getCamp(id)).filter((camp): camp is NonNullable<typeof camp> => Boolean(camp))
  }, [posts])

  if (!user) {
    return (
      <div className="screen screen--profile-detail">
        <header className="page-head">
          <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Geri">
            <ArrowLeft size={20} />
          </button>
          <h1>Karavancı bulunamadı</h1>
        </header>
        <EmptyState
          Icon={UserPlus}
          title="Bu profil artık yok"
          description="Bağlantı eski olabilir. Akışa dönerek diğer karavancıları keşfedebilirsin."
          action={{ label: 'Akışa dön', onClick: () => navigate('/akis') }}
        />
      </div>
    )
  }

  const vehicle = vehicleTerm(user.vehicle)
  const cover = posts.find((post) => post.image)?.image ?? '/images/camp-sea.jpg'

  const follow = () => {
    toggleFollow(user.id)
    setFollowPulse(true)
    window.setTimeout(() => setFollowPulse(false), 520)
    show(following ? `${user.name} takipten çıkarıldı` : `${user.name} artık takip listenizde`)
  }

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/karavanci/${user.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: user.name, text: user.bio, url })
        return
      }
      await navigator.clipboard.writeText(url)
      show('Profil bağlantısı kopyalandı')
    } catch {
      show('Paylaşım iptal edildi')
    }
  }

  return (
    <div className="screen screen--member">
      <div className="member-cover">
        <img src={cover} alt="" />
        <div className="member-cover__scrim" />
        <div className="member-cover__bar">
          <button type="button" className="icon-btn icon-btn--onimage" onClick={() => navigate(-1)} aria-label="Geri">
            <ArrowLeft size={20} />
          </button>
          <div className="member-cover__actions">
            <button type="button" className="icon-btn icon-btn--onimage" onClick={share} aria-label="Paylaş">
              <Share2 size={18} />
            </button>
            {isMe && (
              <Link to="/profil" className="icon-btn icon-btn--onimage" aria-label="Profili düzenle">
                <Pencil size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <header className="member-head">
        <Avatar user={user} size="xl" ring />
        <h1>
          {user.name}
          {user.verified && <BadgeCheck size={17} className="verified" aria-label="Doğrulanmış" />}
        </h1>
        <p className="member-head__meta">
          <vehicle.Icon size={14} aria-hidden /> {vehicle.label} · {user.plate || 'plaka yok'}
        </p>
        <p className="member-head__meta">
          <MapPin size={13} aria-hidden /> {user.city}
          <span className="dot" />
          <CalendarDays size={13} aria-hidden /> {user.since}’den beri
        </p>
        <p className="member-head__bio">{user.bio}</p>

        <ul className="member-stats">
          <li>
            <b>{posts.length}</b>
            <span>paylaşım</span>
          </li>
          <li>
            <b>{Math.round(followers).toLocaleString('tr-TR')}</b>
            <span>takipçi</span>
          </li>
          <li>
            <b>{user.following}</b>
            <span>takip</span>
          </li>
        </ul>

        {isMe ? (
          <Link to="/profil" className="btn btn--ghost btn--block">
            <Pencil size={16} aria-hidden /> Profilini düzenle
          </Link>
        ) : (
          <div className="member-actions">
            <button
              type="button"
              className={`btn btn--block${following ? ' btn--ghost is-joined' : ' btn--primary'}${followPulse ? ' is-pulsing' : ''}`}
              onClick={follow}
              aria-pressed={following}
            >
              {following ? 'Takiptesin ✓' : 'Takip et'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => show('Özel mesajlar gerçek sürümde geliyor')}
            >
              Mesaj
            </button>
          </div>
        )}
      </header>

      {visitedCamps.length > 0 && (
        <section className="card">
          <h2>
            <MapPin size={16} aria-hidden /> Konakladığı kamplar
          </h2>
          <div className="chip-row chip-row--wrap">
            {visitedCamps.map((camp) => (
              <Link key={camp.id} to={`/kamp/${camp.id}`} className="chip chip--camp">
                {camp.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section__head">
          <h2>
            <Sparkles size={16} aria-hidden /> Paylaşımları
          </h2>
          <span className="muted">{posts.length} gönderi</span>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            Icon={Sparkles}
            title="Henüz paylaşım yok"
            description={
              isMe
                ? 'İlk paylaşımını yaparak topluluğa katıl.'
                : `${user.name} henüz bir deneyim paylaşmadı.`
            }
            action={isMe ? { label: 'Paylaşım yap', onClick: () => navigate('/akis/yeni') } : undefined}
          />
        ) : (
          <div className="post-list">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
