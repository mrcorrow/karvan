import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** 0'dan hedefe yumuşak sayaç animasyonu (istatistik kartları için). */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const fromRef = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      const next = from + (target - from) * eased
      setValue(next)
      if (progress < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

/** Ekrana giren öğeler için "reveal" animasyonu. */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

/** Akışta aşağı çekip yenileme jesti. */
export function usePullToRefresh(onRefresh: () => void | Promise<void>, enabled = true) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const callbackRef = useRef(onRefresh)
  callbackRef.current = onRefresh
  const THRESHOLD = 58

  useEffect(() => {
    if (!enabled) return
    const state = { startY: 0, active: false, pull: 0, refreshing: false }

    const onStart = (event: TouchEvent) => {
      if (window.scrollY > 2 || state.refreshing) return
      state.startY = event.touches[0].clientY
      state.active = true
    }
    const onMove = (event: TouchEvent) => {
      if (!state.active || state.refreshing) return
      const delta = event.touches[0].clientY - state.startY
      if (delta > 0 && window.scrollY <= 2) {
        state.pull = Math.min(96, delta * 0.52)
        setPull(state.pull)
      } else {
        state.pull = 0
        setPull(0)
      }
    }
    const onEnd = () => {
      if (!state.active) return
      state.active = false
      if (state.pull > THRESHOLD) {
        state.refreshing = true
        setRefreshing(true)
        Promise.resolve(callbackRef.current()).finally(() => {
          state.refreshing = false
          state.pull = 0
          setRefreshing(false)
          setPull(0)
        })
      } else {
        state.pull = 0
        setPull(0)
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [enabled])

  return { pull, refreshing, progress: Math.min(1, pull / 58) }
}

/** Sonsuz kaydırma: gönderilen ref görünür olduğunda tetikler. */
export function useInfiniteTrigger(onTrigger: () => void, enabled = true) {
  const ref = useRef<HTMLDivElement | null>(null)
  const callbackRef = useRef(onTrigger)
  callbackRef.current = onTrigger

  useEffect(() => {
    const node = ref.current
    if (!node || !enabled || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) callbackRef.current()
      },
      { rootMargin: '220px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled])

  return ref
}
