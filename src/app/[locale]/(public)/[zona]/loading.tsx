export default function ZonaLoading() {
  return (
    <div className="min-h-screen bg-cream flex flex-col antialiased">
      {/* Header Skeleton */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-b border-stone-light/80 px-4 py-2.5 sm:py-3 shadow-xs">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-light/60 animate-pulse" />
            <div className="w-24 h-5 rounded bg-stone-light/60 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-7 rounded-full bg-stone-light/60 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-stone-light/60 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Feed Skeleton */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-20 pb-16">
        {/* Pills / Tabs Skeleton */}
        <div className="flex gap-2 mb-6 overflow-x-hidden py-1">
          <div className="w-20 h-8 rounded-full bg-stone-light/70 animate-pulse shrink-0" />
          <div className="w-24 h-8 rounded-full bg-stone-light/50 animate-pulse shrink-0" />
          <div className="w-20 h-8 rounded-full bg-stone-light/50 animate-pulse shrink-0" />
          <div className="w-28 h-8 rounded-full bg-stone-light/50 animate-pulse shrink-0" />
        </div>

        {/* Event Cards Skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-stone-light/60 overflow-hidden shadow-xs animate-pulse"
            >
              {/* Card Image Skeleton */}
              <div className="w-full h-48 bg-stone-light/40 relative">
                <div className="absolute top-3 left-3 w-16 h-6 rounded-full bg-cream/80" />
                <div className="absolute top-3 right-3 w-12 h-6 rounded-full bg-cream/80" />
              </div>

              {/* Card Content Skeleton */}
              <div className="p-4 space-y-3">
                <div className="w-3/4 h-5 rounded bg-stone-light/60" />
                <div className="w-full h-3.5 rounded bg-stone-light/40" />
                <div className="w-2/3 h-3.5 rounded bg-stone-light/40" />

                <div className="pt-2 flex items-center justify-between border-t border-stone-light/40">
                  <div className="w-24 h-4 rounded bg-stone-light/50" />
                  <div className="w-16 h-4 rounded bg-stone-light/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
