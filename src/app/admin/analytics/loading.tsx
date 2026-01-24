export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse pb-20 lg:pb-0">
      <div className="h-10 w-32 bg-[var(--gray-200)] rounded mb-2" />
      <div className="h-5 w-80 bg-[var(--gray-100)] rounded mb-8" />

      {/* Stats grid skeleton */}
      <div className="mb-8">
        <div className="h-6 w-28 bg-[var(--gray-200)] rounded mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 h-20" />
          ))}
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl h-72" />
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl h-72" />
      </div>

      {/* Tables skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl h-80" />
        ))}
      </div>
    </div>
  );
}
