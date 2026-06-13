import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const base = { baseColor: "#ebe4d8", highlightColor: "#f5f0e8" };

export function PageSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-6">
      <Skeleton height={28} width={180} {...base} borderRadius={8} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height={112} borderRadius={12} {...base} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={56} borderRadius={12} {...base} />
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={160} borderRadius={12} {...base} />
      ))}
    </div>
  );
}

export function MetricSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={88} borderRadius={12} {...base} />
      ))}
    </div>
  );
}
