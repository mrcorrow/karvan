interface SkeletonProps {
  className?: string
}

/** Yükleme iskeleti — içerik gelmeden önce yer tutar. */
export default function Skeleton({ className = '' }: SkeletonProps) {
  return <span className={`skeleton ${className}`} aria-hidden />
}

export function PostSkeleton() {
  return (
    <article className="post-card post-card--skeleton">
      <div className="post-card__head">
        <Skeleton className="skeleton--avatar" />
        <div className="skeleton-lines">
          <Skeleton className="skeleton--line" />
          <Skeleton className="skeleton--line skeleton--short" />
        </div>
      </div>
      <Skeleton className="skeleton--image" />
      <div className="skeleton-lines">
        <Skeleton className="skeleton--line" />
        <Skeleton className="skeleton--line skeleton--short" />
      </div>
    </article>
  )
}
