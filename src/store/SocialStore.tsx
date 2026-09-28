import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { KEYS, loadJSON, saveJSON } from '../lib/storage'
import { uid } from '../lib/format'
import { plateCity } from '../lib/plate'
import { useApp } from './AppStore'
import {
  ME_ID,
  events as seedEvents,
  freshPosts,
  posts as seedPosts,
  seedNotifications,
  simulatedInteractions,
  users as seedUsers,
  usersById,
} from '../data/community'
import type {
  AppNotification,
  CommunityEvent,
  CommunityPost,
  CommunityUser,
  PostComment,
  SharedRoute,
} from '../types'

const SEED_LIKES: Record<string, number> = Object.fromEntries(
  seedPosts.map((post) => [post.id, post.likes]),
)

interface StoredSocial {
  myPosts: CommunityPost[]
  liked: string[]
  saved: string[]
  runtimeComments: Record<string, PostComment[]>
  commentLikes: string[]
  likeBoost: Record<string, number>
  following: string[]
  joinedEvents: string[]
  extraFollowers: number
  notifications: AppNotification[] | null
  freshIndex: number
  shownFresh: string[]
}

const EMPTY_STORED: StoredSocial = {
  myPosts: [],
  liked: [],
  saved: [],
  runtimeComments: {},
  commentLikes: [],
  likeBoost: {},
  following: [],
  joinedEvents: [],
  extraFollowers: 0,
  notifications: null,
  freshIndex: 0,
  shownFresh: [],
}

export interface NewPostInput {
  text: string
  image?: string
  campId?: string
  place?: string
  topic?: string
  route?: SharedRoute
}

interface SocialState {
  /** Tüm akış: tohum + kullanıcı + canlı eklenen gönderiler. */
  posts: CommunityPost[]
  getPost: (id: string) => CommunityPost | undefined
  getUser: (id: string) => CommunityUser | undefined
  users: CommunityUser[]
  me: CommunityUser
  myPosts: CommunityPost[]
  postsByUser: (userId: string) => CommunityPost[]
  createPost: (input: NewPostInput, options?: { simulate?: boolean }) => CommunityPost
  deletePost: (postId: string) => void
  toggleLike: (postId: string) => void
  toggleSave: (postId: string) => void
  addComment: (postId: string, text: string) => void
  deleteComment: (postId: string, commentId: string) => void
  toggleCommentLike: (postId: string, commentId: string) => void
  following: string[]
  isFollowing: (userId: string) => boolean
  toggleFollow: (userId: string) => void
  followerCount: (userId: string) => number
  events: CommunityEvent[]
  getEvent: (id: string) => CommunityEvent | undefined
  isJoined: (eventId: string) => boolean
  toggleJoin: (eventId: string) => void
  attendeeCount: (event: CommunityEvent) => number
  attendeesOf: (event: CommunityEvent) => CommunityUser[]
  notifications: AppNotification[]
  unreadCount: number
  markAllRead: () => void
  refreshFeed: () => CommunityPost | null
  /** Akışta gösterilen taze gönderilerin kimlikleri. */
  freshIds: string[]
  likedIds: string[]
  savedIds: string[]
}

const SocialContext = createContext<SocialState | null>(null)

/** Kayıtlı verileri tohum gönderilere uygular. */
function hydrate(stored: StoredSocial): CommunityPost[] {
  const patched = seedPosts.map((post) => ({
    ...post,
    likes: (SEED_LIKES[post.id] ?? post.likes) + (stored.likeBoost[post.id] ?? 0),
    likedByMe: stored.liked.includes(post.id),
    saved: stored.saved.includes(post.id),
    comments: [
      ...post.comments.map((comment) => ({
        ...comment,
        likedByMe: stored.commentLikes.includes(comment.id),
      })),
      ...(stored.runtimeComments[post.id] ?? []),
    ],
  }))
  const myPosts = stored.myPosts.map((post) => ({
    ...post,
    comments: post.comments.map((comment) => ({
      ...comment,
      likedByMe: stored.commentLikes.includes(comment.id),
    })),
  }))
  return [...myPosts, ...patched].sort((a, b) => b.createdAt - a.createdAt)
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const { profile } = useApp()
  const [stored, setStored] = useState<StoredSocial>(() => ({
    ...EMPTY_STORED,
    ...loadJSON<Partial<StoredSocial>>(KEYS.social, {}),
  }))
  const [posts, setPosts] = useState<CommunityPost[]>(() => hydrate({ ...EMPTY_STORED, ...loadJSON<Partial<StoredSocial>>(KEYS.social, {}) }))
  const [notifications, setNotifications] = useState<AppNotification[]>(
    () => loadJSON<AppNotification[] | null>(KEYS.notifications, null) ?? seedNotifications,
  )
  const timersRef = useRef<number[]>([])

  useEffect(() => () => timersRef.current.forEach((timer) => window.clearTimeout(timer)), [])

  // Kalıcılık: yalnızca etkileşim katmanı saklanır, tohum içerik taze kalır
  useEffect(() => {
    saveJSON(KEYS.social, stored)
  }, [stored])
  useEffect(() => {
    saveJSON(KEYS.notifications, notifications)
  }, [notifications])

  const me: CommunityUser = useMemo(() => {
    const city = plateCity(profile.plate)
    return {
      id: ME_ID,
      name: profile.name?.trim() || 'Gezgin',
      avatar: profile.avatar,
      tint: 'me',
      vehicle: profile.vehicle,
      plate: profile.plate,
      bio: profile.bio?.trim() || 'Yollarda görüşürüz. Karavan günlüğümü buradan paylaşıyorum.',
      city: profile.city?.trim() || city || 'Türkiye',
      since: '2026',
      followers: 8 + stored.extraFollowers,
      following: stored.following.length,
      verified: false,
    }
  }, [profile, stored.extraFollowers, stored.following.length])

  const userMap = useMemo(() => {
    const map = new Map(usersById)
    map.set(ME_ID, me)
    return map
  }, [me])

  const getUser = useCallback((id: string) => userMap.get(id), [userMap])

  const postsByUser = useCallback(
    (userId: string) => posts.filter((post) => post.userId === userId),
    [posts],
  )

  const getPost = useCallback((id: string) => posts.find((post) => post.id === id), [posts])

  const pushNotification = useCallback((notification: AppNotification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 60))
  }, [])

  /** Paylaşım sonrası gelen demo etkileşimleri zamanlar. */
  const scheduleInteractions = useCallback(
    (postId: string) => {
      for (const interaction of simulatedInteractions) {
        const timer = window.setTimeout(() => {
          const author = usersById.get(interaction.userId)
          if (!author) return
          if (interaction.kind === 'like') {
            setPosts((prev) =>
              prev.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)),
            )
            setStored((prev) => ({
              ...prev,
              likeBoost: { ...prev.likeBoost, [postId]: (prev.likeBoost[postId] ?? 0) + 1 },
            }))
            pushNotification({
              id: uid('bildirim'),
              kind: 'like',
              userId: author.id,
              postId,
              text: `${author.name} gönderini beğendi`,
              createdAt: Date.now(),
              read: false,
            })
            return
          }
          if (interaction.kind === 'comment' && interaction.text) {
            const comment: PostComment = {
              id: uid('yorum'),
              userId: author.id,
              text: interaction.text,
              createdAt: Date.now(),
              likes: 0,
              likedByMe: false,
            }
            setPosts((prev) =>
              prev.map((post) =>
                post.id === postId ? { ...post, comments: [...post.comments, comment] } : post,
              ),
            )
            setStored((prev) => ({
              ...prev,
              runtimeComments: {
                ...prev.runtimeComments,
                [postId]: [...(prev.runtimeComments[postId] ?? []), comment],
              },
            }))
            pushNotification({
              id: uid('bildirim'),
              kind: 'comment',
              userId: author.id,
              postId,
              text: `${author.name} yorum yaptı: “${interaction.text}”`,
              createdAt: Date.now(),
              read: false,
            })
            return
          }
          if (interaction.kind === 'follow') {
            setStored((prev) => ({ ...prev, extraFollowers: prev.extraFollowers + 1 }))
            pushNotification({
              id: uid('bildirim'),
              kind: 'follow',
              userId: author.id,
              text: `${author.name} seni takip etmeye başladı`,
              createdAt: Date.now(),
              read: false,
            })
          }
        }, interaction.delayMs)
        timersRef.current.push(timer)
      }
    },
    [pushNotification],
  )

  const createPost = useCallback(
    (input: NewPostInput, options?: { simulate?: boolean }) => {
      const post: CommunityPost = {
        id: uid('gonderi'),
        userId: ME_ID,
        text: input.text.trim(),
        image: input.image,
        campId: input.campId,
        place: input.place,
        topic: input.topic,
        route: input.route,
        createdAt: Date.now(),
        likes: 0,
        likedByMe: false,
        saved: false,
        comments: [],
        mine: true,
      }
      setPosts((prev) => [post, ...prev])
      setStored((prev) => ({ ...prev, myPosts: [post, ...prev.myPosts].slice(0, 40) }))
      if (options?.simulate !== false) scheduleInteractions(post.id)
      return post
    },
    [scheduleInteractions],
  )

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
    setStored((prev) => ({ ...prev, myPosts: prev.myPosts.filter((post) => post.id !== postId) }))
  }, [])

  const toggleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post
        const liked = !post.likedByMe
        return { ...post, likedByMe: liked, likes: Math.max(0, post.likes + (liked ? 1 : -1)) }
      }),
    )
    setStored((prev) => ({
      ...prev,
      liked: prev.liked.includes(postId)
        ? prev.liked.filter((id) => id !== postId)
        : [...prev.liked, postId],
      likeBoost: prev.likeBoost[postId]
        ? prev.likeBoost
        : { ...prev.likeBoost, [postId]: prev.liked.includes(postId) ? 0 : 1 },
    }))
  }, [])

  const toggleSave = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, saved: !post.saved } : post)),
    )
    setStored((prev) => ({
      ...prev,
      saved: prev.saved.includes(postId)
        ? prev.saved.filter((id) => id !== postId)
        : [...prev.saved, postId],
    }))
  }, [])

  const addComment = useCallback(
    (postId: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const comment: PostComment = {
        id: uid('yorum'),
        userId: ME_ID,
        text: trimmed,
        createdAt: Date.now(),
        likes: 0,
        likedByMe: false,
      }
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, comments: [...post.comments, comment] } : post,
        ),
      )
      setStored((prev) => ({
        ...prev,
        runtimeComments: {
          ...prev.runtimeComments,
          [postId]: [...(prev.runtimeComments[postId] ?? []), comment],
        },
      }))
    },
    [],
  )

  const deleteComment = useCallback((postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) }
          : post,
      ),
    )
    setStored((prev) => ({
      ...prev,
      runtimeComments: {
        ...prev.runtimeComments,
        [postId]: (prev.runtimeComments[postId] ?? []).filter((comment) => comment.id !== commentId),
      },
    }))
  }, [])

  const toggleCommentLike = useCallback((postId: string, commentId: string) => {
    let newLikedState = false
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post
        return {
          ...post,
          comments: post.comments.map((comment) => {
            if (comment.id !== commentId) return comment
            const liked = !comment.likedByMe
            newLikedState = liked
            return { ...comment, likedByMe: liked, likes: Math.max(0, comment.likes + (liked ? 1 : -1)) }
          }),
        }
      }),
    )
    setStored((prev) => ({
      ...prev,
      commentLikes: newLikedState
        ? [...prev.commentLikes, commentId]
        : prev.commentLikes.filter((id) => id !== commentId),
    }))
  }, [])

  const isFollowing = useCallback(
    (userId: string) => stored.following.includes(userId),
    [stored.following],
  )

  const toggleFollow = useCallback(
    (userId: string) => {
      const nowFollowing = !stored.following.includes(userId)
      setStored((prev) => ({
        ...prev,
        following: nowFollowing
          ? [...prev.following, userId]
          : prev.following.filter((id) => id !== userId),
      }))
      const user = usersById.get(userId)
      if (nowFollowing && user) {
        pushNotification({
          id: uid('bildirim'),
          kind: 'follow',
          userId,
          text: `${user.name} artık takip listenizde — paylaşımlarını akışta göreceksiniz`,
          createdAt: Date.now(),
          read: false,
        })
      }
    },
    [stored.following, pushNotification],
  )

  const followerCount = useCallback(
    (userId: string) => {
      if (userId === ME_ID) return me.followers
      const base = usersById.get(userId)?.followers ?? 0
      return base + (stored.following.includes(userId) ? 1 : 0)
    },
    [me.followers, stored.following],
  )

  const getEvent = useCallback(
    (id: string) => seedEvents.find((event) => event.id === id),
    [],
  )

  const isJoined = useCallback(
    (eventId: string) => stored.joinedEvents.includes(eventId),
    [stored.joinedEvents],
  )

  const toggleJoin = useCallback(
    (eventId: string) => {
      const joining = !stored.joinedEvents.includes(eventId)
      setStored((prev) => ({
        ...prev,
        joinedEvents: joining
          ? [...prev.joinedEvents, eventId]
          : prev.joinedEvents.filter((id) => id !== eventId),
      }))
      const event = seedEvents.find((item) => item.id === eventId)
      if (joining && event) {
        pushNotification({
          id: uid('bildirim'),
          kind: 'event',
          eventId,
          text: `${event.title} buluşmasına katıldınız — takviminize ekleyin`,
          createdAt: Date.now(),
          read: false,
        })
      }
    },
    [stored.joinedEvents, pushNotification],
  )

  const attendeeCount = useCallback(
    (event: CommunityEvent) => event.attendees.length + (stored.joinedEvents.includes(event.id) ? 1 : 0),
    [stored.joinedEvents],
  )

  const attendeesOf = useCallback(
    (event: CommunityEvent) => {
      const ids = [...event.attendees, ...(stored.joinedEvents.includes(event.id) ? [ME_ID] : [])]
      return ids.map((id) => userMap.get(id)).filter((user): user is CommunityUser => Boolean(user))
    },
    [stored.joinedEvents, userMap],
  )

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [])

  const [freshIds, setFreshIds] = useState<string[]>(() => loadJSON<string[]>(KEYS.freshIds, []))

  const refreshFeed = useCallback(() => {
    const index = stored.freshIndex % freshPosts.length
    const template = freshPosts[index]
    const existing = posts.find((post) => post.id === template.id)
    if (existing) {
      // Aynı gönderi zaten akışta: zamanını tazele
      setPosts((prev) =>
        prev.map((post) => (post.id === template.id ? { ...post, createdAt: Date.now() } : post)),
      )
      return existing
    }
    const post: CommunityPost = { ...template, createdAt: Date.now() }
    setPosts((prev) => [post, ...prev])
    setFreshIds((prev) => [...prev, post.id])
    setStored((prev) => ({
      ...prev,
      freshIndex: (prev.freshIndex + 1) % freshPosts.length,
      shownFresh: [...prev.shownFresh, post.id],
    }))
    return post
  }, [posts, stored.freshIndex])

  useEffect(() => saveJSON(KEYS.freshIds, freshIds), [freshIds])

  const value = useMemo<SocialState>(
    () => ({
      posts,
      getPost,
      getUser,
      users: seedUsers,
      me,
      myPosts: posts.filter((post) => post.mine),
      postsByUser,
      createPost,
      deletePost,
      toggleLike,
      toggleSave,
      addComment,
      deleteComment,
      toggleCommentLike,
      following: stored.following,
      isFollowing,
      toggleFollow,
      followerCount,
      events: seedEvents,
      getEvent,
      isJoined,
      toggleJoin,
      attendeeCount,
      attendeesOf,
      notifications,
      unreadCount,
      markAllRead,
      refreshFeed,
      freshIds,
      likedIds: stored.liked,
      savedIds: stored.saved,
    }),
    [
      posts,
      getPost,
      getUser,
      me,
      postsByUser,
      createPost,
      deletePost,
      toggleLike,
      toggleSave,
      addComment,
      deleteComment,
      toggleCommentLike,
      stored.following,
      stored.liked,
      stored.saved,
      isFollowing,
      toggleFollow,
      followerCount,
      getEvent,
      isJoined,
      toggleJoin,
      attendeeCount,
      attendeesOf,
      notifications,
      unreadCount,
      markAllRead,
      refreshFeed,
      freshIds,
    ],
  )

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}

export function useSocial(): SocialState {
  const context = useContext(SocialContext)
  if (!context) throw new Error('useSocial, SocialProvider içinde kullanılmalıdır')
  return context
}
