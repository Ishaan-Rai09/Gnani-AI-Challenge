export function AppSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="h-2.5 w-32 animate-pulse rounded bg-ink/10" />
          <div className="mt-3 h-7 w-64 animate-pulse rounded bg-ink/10" />
          <div className="mt-2.5 h-3 w-80 max-w-full animate-pulse rounded bg-ink/[0.06]" />
        </div>
        <div className="hidden h-10 w-44 animate-pulse rounded-full bg-ink/10 sm:block" />
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.45fr_1fr_1fr_1fr]">
        <div className="h-[154px] animate-pulse rounded-xl bg-ink/90" />
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-[154px] animate-pulse rounded-xl border border-line bg-paper" />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <div className="space-y-4">
          <div className="h-[280px] animate-pulse rounded-xl bg-ink/90" />
          <div className="h-[300px] animate-pulse rounded-xl border border-line bg-paper" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-[150px] animate-pulse rounded-xl border border-line bg-paper" />
          ))}
        </div>
      </div>
    </div>
  );
}
