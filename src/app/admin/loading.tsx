export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-48 bg-[var(--gray-200)] rounded mb-2" />
      <div className="h-5 w-64 bg-[var(--gray-100)] rounded mb-8" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 h-24" />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl h-64" />
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl h-64" />
      </div>
    </div>
  );
}
