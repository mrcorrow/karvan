import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Bookmark,
  Copy,
  Flag,
  Gauge,
  Heart,
  MapPin,
  MessageCircle,
  Milestone,
  MoreHorizontal,
  Route,
  Share2,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react'
import type { CommunityPost } from '../types'
import { useSocial } from '../store/SocialStore'
import { useToast } from './Toast'
import { getCamp } from '../data/camps'
import { vehicleTerm } from '../data/taxonomy'
import { timeAgo } from '../lib/time'
import { formatPrice } from '../lib/format'
import CommentsSheet from './CommentsSheet'
import Avatar from './Avatar'

interface PostCardProps {
  post: CommunityPost
  /** Kademeli giriş animasyonu için sıra. */
  index?: number
  /** Gezi özeti kartını göster (rota paylaşımları). */
  showRouteCard?: boolean
}

export default function PostCard({ post, index = 0, showRouteCard = true }: PostCardProps) {
  const { getUser, toggleLike, toggleSave, deletePost } = useSocial()
  const { show } = useToast()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [bursts, setBursts] = useState(0)
  const [pulsing, setPulsing] = useState(false)
  const lastTapRef = useRef(0)
  const pulseTimer = useRef<number | null>(null)

  const author = getUser(post.userId)
  const camp = post.campId ? getCamp(post.campId) : undefined
  const vehicle = author ? vehicleTerm(author.vehicle) : null

  useEffect(
    () => () => {
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current)
    },
    [],
  )

  const like = useCallback(() => {
    toggleLike(post.id)
    if (!post.likedByMe) {
      setBursts((count) => count + 1)
      setPulsing(true)
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current)
      pulseTimer.current = window.setTimeout(() => setPulsing(false), 460)
      if (navigator.vibrate) navigator.vibrate(10)
    }
  }, [post.id, post.likedByMe, toggleLike])

  /** Görsele çift dokunma → beğen + kalp patlaması. */
  const handleImageTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 320) {
      if (!post.likedByMe) like()
      else setBursts((count) => count + 1)
    }
    lastTapRef.current = now
  }

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/karavanci/${post.userId}`
    const text = `${author?.name ?? 'Karavancı'}: ${post.text}${camp ? `\n📍 ${camp.name}` : ''}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Karvan paylaşımı', text, url })
        return
      }
      await navigator.clipboard.writeText(`${text}\n${url}`)
      show('Paylaşım metni kopyalandı')
    } catch {
      show('Paylaşım iptal edildi')
    }
  }

  if (!author) return null

  const isNew = Date.now() - post.createdAt < 12 * 60 * 1000
  const visibleComments = post.comments.slice(-2)
  const likeLabel = post.likes.toLocaleString('tr-TR')

  return (
    <article
      className="post-card anim-rise"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <header className="post-card__head">
        <Link to={`/karavanci/${author.id}`} className="post-card__author">
          <Avatar user={author} />
          <span className="post-card__author-lines">
            <b>
              {author.name}
              {author.verified && <BadgeCheck size={14} className="verified" aria-label="Doğrulanmış" />}
            </b>
            <em>
              {author.city} · {timeAgo(post.createdAt)}
              {isNew && <span className="post-badge">Yeni</span>}
            </em>
          </span>
        </Link>

        <div className="post-card__head-right">
          {vehicle && (
            <span className="post-card__vehicle" title={vehicle.label}>
              <vehicle.Icon size={15} aria-hidden />
            </span>
          )}
          <button
            type="button"
            className="icon-btn icon-btn--plain"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Gönderi seçenekleri"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              className="menu-backdrop"
              aria-label="Menüyü kapat"
              onClick={() => setMenuOpen(false)}
            />
            <ul className="post-menu anim-pop">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    toggleSave(post.id)
                    show(post.saved ? 'Kaydedilenlerden çıkarıldı' : 'Kaydedildi')
                    setMenuOpen(false)
                  }}
                >
                  <Bookmark size={15} fill={post.saved ? 'currentColor' : 'none'} />
                  {post.saved ? 'Kaydı kaldır' : 'Kaydet'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(`${author.name}: ${post.text}`)
                      .then(() => show('Metin kopyalandı'))
                      .catch(() => show('Kopyalanamadı'))
                    setMenuOpen(false)
                  }}
                >
                  <Copy size={15} /> Metni kopyala
                </button>
              </li>
              {post.mine ? (
                <li>
                  <button
                    type="button"
                    className="is-danger"
                    onClick={() => {
                      if (window.confirm('Gönderi silinsin mi?')) {
                        deletePost(post.id)
                        show('Gönderi silindi')
                      }
                      setMenuOpen(false)
                    }}
                  >
                    <Trash2 size={15} /> Gönderiyi sil
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      show('Bildiriminiz topluluk ekibine iletildi')
                      setMenuOpen(false)
                    }}
                  >
                    <Flag size={15} /> Bildir
                  </button>
                </li>
              )}
            </ul>
          </>
        )}
      </header>

      <p className="post-card__text">{post.text}</p>

      {post.image && (
        <div className="post-card__media" onClick={handleImageTap} role="presentation">
          <img src={post.image} alt="" loading="lazy" decoding="async" />
          {bursts > 0 && (
            <span className="like-burst" key={bursts}>
              <Heart size={66} className="like-burst__heart" fill="currentColor" />
              <i className="like-burst__p like-burst__p--1" />
              <i className="like-burst__p like-burst__p--2" />
              <i className="like-burst__p like-burst__p--3" />
              <i className="like-burst__p like-burst__p--4" />
            </span>
          )}
        </div>
      )}

      {post.image && bursts > 1 && <span className="sr-only">Beğenildi</span>}

      <footer className="post-card__body">
        <div className="post-card__tags">
          {camp && (
            <Link to={`/kamp/${camp.id}`} className="chip chip--camp">
              <MapPin size={12} aria-hidden />
              {camp.name}
            </Link>
          )}
          {!camp && post.place && (
            <span className="chip chip--ghost">
              <MapPin size={12} aria-hidden />
              {post.place}
            </span>
          )}
          {post.topic && <span className="chip chip--topic">{post.topic}</span>}
          {post.route && showRouteCard && (
            <span className="chip chip--ghost">
              <Route size={12} aria-hidden /> Gezi özeti
            </span>
          )}
        </div>

        {post.route && showRouteCard && (
          <ul className="post-route">
            <li>
              <Milestone size={13} aria-hidden />
              {Math.round(post.route.distanceKm)} km
            </li>
            <li>
              <Gauge size={13} aria-hidden />
              {post.route.stops} durak
            </li>
            <li>
              <Sparkles size={13} aria-hidden />
              {post.route.nights} gece
            </li>
            <li>
              <Wallet size={13} aria-hidden />
              {formatPrice(post.route.totalCost)}
            </li>
          </ul>
        )}

        <div className="post-card__actions">
          <button
            type="button"
            className={`post-action${post.likedByMe ? ' is-liked' : ''}${pulsing ? ' is-pulsing' : ''}`}
            onClick={like}
            aria-pressed={post.likedByMe}
          >
            <Heart size={19} fill={post.likedByMe ? 'currentColor' : 'none'} />
            <span>{likeLabel}</span>
          </button>
          <button
            type="button"
            className={`post-action${post.comments.length > 0 ? ' is-active' : ''}`}
            onClick={() => setCommentsOpen(true)}
          >
            <MessageCircle size={18} />
            <span>{post.comments.length}</span>
          </button>
          <button
            type="button"
            className={`post-action${post.saved ? ' is-saved' : ''}`}
            onClick={() => {
              toggleSave(post.id)
              show(post.saved ? 'Kaydedilenlerden çıkarıldı' : 'Kaydedildi')
            }}
            aria-pressed={post.saved}
          >
            <Bookmark size={18} fill={post.saved ? 'currentColor' : 'none'} />
          </button>
          <button type="button" className="post-action" onClick={share} aria-label="Paylaş">
            <Share2 size={18} />
          </button>
        </div>

        {post.comments.length > 0 && (
          <div className="post-card__comments">
            {visibleComments.map((comment) => {
              const commenter = getUser(comment.userId)
              return (
                <p key={comment.id}>
                  <b>{commenter?.name ?? 'Karavancı'}</b> {comment.text}
                </p>
              )
            })}
            {post.comments.length > visibleComments.length && (
              <button type="button" className="post-card__more" onClick={() => setCommentsOpen(true)}>
                {post.comments.length} yorumun tümünü gör
              </button>
            )}
          </div>
        )}
      </footer>

      {commentsOpen && <CommentsSheet post={post} onClose={() => setCommentsOpen(false)} />}
    </article>
  )
}
