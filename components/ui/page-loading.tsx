export default function PageLoading() {
  return (
    <div className="space-y-6" aria-label="Loading" aria-busy="true">
      <div className="space-y-1.5">
        <div className="h-3.5 w-24 animate-pulse rounded bg-surface-200" />
        <div className="h-5 w-40 animate-pulse rounded bg-surface-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-surface-200 bg-surface-100/60" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-lg border border-surface-200 bg-surface-100/60" />
    </div>
  );
}