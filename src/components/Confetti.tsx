import { useMemo } from 'react'

const COLORS = ['#f2a65a', '#e07a5f', '#2a7f9e', '#7fd1ab', '#f6e7c1', '#c9a227']

interface ConfettiProps {
  /** Parçacık sayısı. */
  count?: number
  /** Yalnızca bir kez oynatmak için anahtar değişimi kullanılabilir. */
  className?: string
}

/**
 * Paylaşım / katılım gibi anlarda oynayan hafif konfeti efekti.
 * Parçacıklar CSS ile hareket eder (transform + opacity) ve kalıcı DOM bırakmaz.
 */
export default function Confetti({ count = 24, className = '' }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1 + Math.random() * 0.7,
        drift: (Math.random() - 0.5) * 120,
        rotate: 180 + Math.random() * 540,
        size: 5 + Math.random() * 7,
        color: COLORS[index % COLORS.length],
        round: Math.random() > 0.6,
      })),
    [count],
  )

  return (
    <div className={`confetti ${className}`} aria-hidden="true">
      {pieces.map((piece) => (
        <i
          key={piece.id}
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.round ? piece.size : piece.size * 1.7,
            background: piece.color,
            borderRadius: piece.round ? '50%' : '2px',
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ['--drift' as string]: `${piece.drift}px`,
            ['--rotate' as string]: `${piece.rotate}deg`,
          }}
        />
      ))}
    </div>
  )
}
