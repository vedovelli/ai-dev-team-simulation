/**
 * Skeleton loaders for AgentStatusPanel
 * Provides realistic loading state animations
 */
export function AgentStatusSkeletons() {
  return (
    <div className="space-y-6">
      {/* Agent Header Skeleton */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-8 bg-slate-700 rounded w-2/3 mb-2" />
            <div className="h-4 bg-slate-700 rounded w-1/3" />
          </div>
          <div className="h-10 bg-slate-700 rounded-full w-32" />
        </div>
        <div className="h-3 bg-slate-700 rounded w-1/4" />
      </div>

      {/* Status Details Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-slate-800 rounded-lg border border-slate-700 p-4 animate-pulse"
          >
            <div className="h-4 bg-slate-700 rounded w-2/3 mb-3" />
            <div className="h-8 bg-slate-700 rounded w-1/2 mb-2" />
            <div className="h-3 bg-slate-700 rounded w-3/4" />
          </div>
        ))}
      </div>

      {/* Capabilities Skeleton */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/4 mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-6 bg-slate-700 rounded-full w-20" />
          ))}
        </div>
      </div>
    </div>
  )
}
