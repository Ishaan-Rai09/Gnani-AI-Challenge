export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-3 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="h-5 w-40 animate-pulse rounded bg-ink/10" />
      <div className="mt-4 h-3 w-64 animate-pulse rounded bg-ink/[0.06]" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-[104px] animate-pulse rounded-xl border border-line bg-paper" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-[300px] animate-pulse rounded-xl border border-line bg-paper" />
        <div className="h-[300px] animate-pulse rounded-xl border border-line bg-paper" />
      </div>
    </div>
  );
}
