import { useEffect, useRef, useState } from 'react'
import { Heart, Send, Trash2, X } from 'lucide-react'
import type { CommunityPost } from '../types'
import { useSocial } from '../store/SocialStore'
import { timeAgo } from '../lib/time'
import Avatar from './Avatar'

interface CommentsSheetProps {
  post: CommunityPost
  onClose: () => void
}

/** Gönderi yorumları — alttan açılan panel, yeni yorum animasyonla eklenir. */
export default function CommentsSheet({ post, onClose }: CommentsSheetProps) {
  const { getUser, addComment, toggleCommentLike, deleteComment, me } = useSocial()
  const [text, setText] = useState('')
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const send = () => {
    if (!text.trim()) return
    const before = post.comments.map((comment) => comment.id)
    addComment(post.id, text)
    setText('')
    // Optimistik animasyon: yeni yorum kısa süre vurgulanır
    window.setTimeout(() => {
      const added = [...post.comments.map((comment) => comment.id)].find((id) => !before.includes(id))
      setLastAdded(added ?? null)
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    }, 0)
  }

  return (
    <div className="sheet sheet--comments" role="dialog" aria-modal="true" aria-label="Yorumlar">
      <button type="button" className="sheet__backdrop" onClick={onClose} aria-label="Kapat" />
      <div className="sheet__panel">
        <header className="sheet__head">
          <h2>Yorumlar ({post.comments.length})</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </header>

        <ul className="comment-list" ref={listRef}>
          {post.comments.length === 0 && (
            <li className="comment-empty">
              <p>İlk yorumu sen yaz — soru sor, deneyimini paylaş.</p>
            </li>
          )}
          {post.comments.map((comment) => {
            const author = getUser(comment.userId)
            const isMe = comment.userId === me.id
            return (
              <li
                key={comment.id}
                className={`comment${lastAdded === comment.id ? ' comment--new' : ''}`}
              >
                {author ? (
                  <Avatar user={author} size="sm" />
                ) : (
                  <span className="avatar avatar--sm avatar--me">?</span>
                )}
                <div className="comment__main">
                  <b>
                    {author?.name ?? 'Karavancı'}
                    {isMe && <span className="comment__me">siz</span>}
                  </b>
                  <p>{comment.text}</p>
                  <em>{timeAgo(comment.createdAt)}</em>
                </div>
                <div className="comment__tools">
                  <button
                    type="button"
                    className={`comment__like${comment.likedByMe ? ' is-active' : ''}`}
                    onClick={() => toggleCommentLike(post.id, comment.id)}
                    aria-pressed={comment.likedByMe}
                    aria-label="Yorumu beğen"
                  >
                    <Heart size={14} fill={comment.likedByMe ? 'currentColor' : 'none'} />
                    {comment.likes > 0 && <span>{comment.likes}</span>}
                  </button>
                  {isMe && (
                    <button
                      type="button"
                      className="comment__delete"
                      onClick={() => deleteComment(post.id, comment.id)}
                      aria-label="Yorumu sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <footer className="comment-form">
          <Avatar user={me} size="sm" />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') send()
            }}
            placeholder="Yorum yaz…"
            aria-label="Yorum yaz"
            maxLength={280}
          />
          <button
            type="button"
            className="comment-form__send"
            onClick={send}
            disabled={!text.trim()}
            aria-label="Gönder"
          >
            <Send size={17} />
          </button>
        </footer>
      </div>
    </div>
  )
}
