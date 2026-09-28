import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  CalendarPlus,
  Compass,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Search,
  Sparkle,
  Sparkles,
  Users,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useSocial } from '../store/SocialStore'
import { useToast } from '../components/Toast'
import { useInfiniteTrigger, usePullToRefresh } from '../hooks/animations'
import PostCard from '../components/PostCard'
import EventCard from '../components/EventCard'
import Avatar from '../components/Avatar'
import { PostSkeleton } from '../components/Skeleton'
import type { CommunityPost } from '../types'

type FeedFilter = 'tumu' | 'takip' | 'kamp' | 'rota' | 'kaydedilen'

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'takip', label: 'Takip ettiklerim' },
  { key: 'kamp', label: 'Kamp notları' },
  { key: 'rota', label: 'Rotalar' },
  { key: 'kaydedilen', label: 'Kaydedilenler' },
]

export default function FeedScreen() {
  const { favorites } = useApp()
  const {
    posts,
    users,
    events,
    unreadCount,
    refreshFeed,
    following,
    isFollowing,
    toggleFollow,
    savedIds,
    me,
  } = useSocial()
  const { show } = useToast()
  const navigate = useNavigate()

  const [filter, setFilter] = useState<FeedFilter>('tumu')
  const [visibleCount, setVisibleCount] = useState(6)
  const [loadingMore, setLoadingMore] = useState(false)
  const [booting, setBooting] = useState(true)
  const [refreshSpin, setRefreshSpin] = useState(false)

  // İlk açılış iskeleti — içerik animasyonla yerleşir
  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 650)
    return () => window.clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'takip':
        return posts.filter((post) => following.includes(post.userId) || post.mine)
      case 'kamp':
        return posts.filter((post) => Boolean(post.campId))
      case 'rota':
        return posts.filter((post) => Boolean(post.route) || post.topic === '#rota')
      case 'kaydedilen':
        return posts.filter((post) => post.saved || savedIds.includes(post.id))
      case 'tumu':
      default:
        return posts
    }
  }, [posts, filter, following, savedIds])

  const visible = filtered.slice(0, visibleCount)

  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    const added = refreshFeed()
    if (added) show('Akışa yeni bir paylaşım düştü')
    else show('Akış zaten güncel')
  }, [refreshFeed, show])

  const { pull, refreshing, progress } = usePullToRefresh(handleRefresh)

  const sentinelRef = useInfiniteTrigger(() => {
    if (loadingMore || booting || visibleCount >= filtered.length) return
    setLoadingMore(true)
    window.setTimeout(() => {
      setVisibleCount((count) => count + 6)
      setLoadingMore(false)
    }, 650)
  }, filter !== 'kaydedilen')

  const spinRefresh = () => {
    setRefreshSpin(true)
    handleRefresh().finally(() => window.setTimeout(() => setRefreshSpin(false), 400))
  }

  const suggestions = users.filter((user) => !isFollowing(user.id) && user.id !== me.id).slice(0, 6)

  const activeNow = 12 + (unreadCount > 0 ? unreadCount : 0)

  return (
    <div className="screen screen--feed" style={{ transform: `translateY(${pull}px)`, transition: pull === 0 ? 'transform 0.28s ease' : 'none' }}>
      <div className={`ptr${refreshing ? ' is-refreshing' : ''}`} style={{ opacity: progress || (refreshing ? 1 : 0) }}>
        <span className="ptr__spinner">
          <RefreshCw size={16} aria-hidden />
        </span>
        <span>{refreshing ? 'Güncelleniyor…' : pull > 58 ? 'Yenilemek için bırak' : 'Yenilemek için çek'}</span>
      </div>

      <header className="feed-head">
        <div>
          <h1>Akış</h1>
          <p className="muted">
            <Users size={12} aria-hidden /> {activeNow} karavancı şu an yollarda
          </p>
        </div>
        <div className="feed-head__actions">
          <button type="button" className="icon-btn" onClick={() => navigate('/ara')} aria-label="Kamp ara">
            <Search size={18} />
          </button>
          <button
            type="button"
            className={`icon-btn${refreshSpin || refreshing ? ' is-spinning' : ''}`}
            onClick={spinRefresh}
            aria-label="Akışı yenile"
          >
            <RefreshCw size={18} />
          </button>
          <Link to="/bildirimler" className="icon-btn icon-btn--bell" aria-label="Bildirimler">
            <Bell size={18} />
            {unreadCount > 0 && <i className="icon-btn__badge anim-pop">{unreadCount}</i>}
          </Link>
        </div>
      </header>

      <section className="section">
        <div className="section__head">
          <h2>
            <Compass size={16} aria-hidden /> Şu an yolda
          </h2>
          <span className="muted">canlı</span>
        </div>
        <div className="rail rail--people">
          {users.slice(0, 8).map((user, index) => (
            <Link
              key={user.id}
              to={`/karavanci/${user.id}`}
              className="person-chip anim-rise"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <Avatar user={user} ring />
              <b>{user.name.split(' ')[0]}</b>
              <em>{user.city}</em>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>
            <CalendarPlus size={16} aria-hidden /> Yaklaşan buluşmalar
          </h2>
          <Link to="/etkinlikler" className="section__link">
            Tümü
          </Link>
        </div>
        <div className="rail">
          {events.slice(0, 3).map((event, index) => (
            <EventCard key={event.id} event={event} variant="rail" index={index} />
          ))}
        </div>
      </section>

      <button type="button" className="composer-prompt" onClick={() => navigate('/akis/yeni')}>
        <Avatar user={me} />
        <span className="composer-prompt__text">
          <b>Nerede konakladın?</b>
          <em>Karavancılara deneyimini anlat…</em>
        </span>
        <span className="composer-prompt__icon">
          <MessageSquarePlus size={19} />
        </span>
      </button>

      <div className="chip-row chip-row--wrap feed-filters">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`chip${filter === item.key ? ' is-active' : ''}`}
            onClick={() => {
              setFilter(item.key)
              setVisibleCount(6)
            }}
          >
            {item.label}
            {item.key === 'kaydedilen' && savedIds.length > 0 && <em>{savedIds.length}</em>}
          </button>
        ))}
      </div>

      <div className="post-list">
        {booting && (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}

        {!booting && visible.length === 0 && (
          <div className="empty-state">
            <span className="empty-state__icon">
              <Sparkle size={26} aria-hidden />
            </span>
            <h3>Bu filtrede paylaşım yok</h3>
            <p>
              {filter === 'takip'
                ? 'Birkaç karavancıyı takip et, paylaşımları burada görünsün.'
                : filter === 'kaydedilen'
                  ? 'Beğendiğin paylaşımları kaydet, sonra buradan ulaş.'
                  : 'İlk paylaşımı sen yap, topluluk seninle başlasın.'}
            </p>
            <button type="button" className="btn btn--primary" onClick={() => navigate('/akis/yeni')}>
              Paylaşım yap
            </button>
          </div>
        )}

        {!booting &&
          visible.map((post: CommunityPost, index) => <PostCard key={post.id} post={post} index={index} />)}

        {loadingMore && (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}
      </div>

      <div ref={sentinelRef} className="feed-sentinel" aria-hidden />

      {!booting && visibleCount < filtered.length && (
        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={() => {
            setLoadingMore(true)
            window.setTimeout(() => {
              setVisibleCount((count) => count + 6)
              setLoadingMore(false)
            }, 500)
          }}
        >
          Daha fazla paylaşım
        </button>
      )}

      {suggestions.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>
              <Sparkles size={16} aria-hidden /> Tanışmak isteyebileceğin karavancılar
            </h2>
          </div>
          <ul className="follow-list">
            {suggestions.map((user, index) => (
              <li key={user.id} className="anim-rise" style={{ animationDelay: `${index * 50}ms` }}>
                <Link to={`/karavanci/${user.id}`} className="follow-list__person">
                  <Avatar user={user} />
                  <span>
                    <b>{user.name}</b>
                    <em>
                      {user.city} · {user.followers.toLocaleString('tr-TR')} takipçi
                    </em>
                  </span>
                </Link>
                <button
                  type="button"
                  className="btn btn--sm btn--primary follow-btn"
                  onClick={() => {
                    toggleFollow(user.id)
                    show(`${user.name} takip listenize eklendi`)
                  }}
                >
                  <Plus size={14} aria-hidden /> Takip et
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <div className="section__head">
          <h2>Favori kampların</h2>
          <Link to="/ara" className="section__link">
            Keşfet
          </Link>
        </div>
        <p className="muted section__note">
          {favorites.length > 0
            ? `Kaydedilmiş ${favorites.length} tesisin var. Birine uğradıysan deneyimini paylaşarak diğer karavancılara yardımcı ol.`
            : 'Kamp alanlarını favorilerine ekle; buradan hızlıca paylaşım yapabilirsin.'}
        </p>
      </section>

      <p className="demo-note">
        <Check size={14} aria-hidden />
        <span>
          Topluluk paylaşımları, yorumlar ve buluşmalar <b>örnek veridir</b>. Senin paylaşımların bu
          cihazda saklanır; birkaç saniye içinde gelen beğeni/yorumlar topluluğun canlı akışını
          göstermek için simüle edilir.
        </span>
      </p>
    </div>
  )
}
