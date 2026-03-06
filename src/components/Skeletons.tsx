/**
 * Loading skeleton components for displaying placeholders while data loads.
 */

export function MetricCardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-24 mb-4"></div>
      <div className="h-8 bg-slate-700 rounded w-32 mb-2"></div>
      <div className="h-3 bg-slate-700 rounded w-16"></div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="rounded-lg bg-slate-800 shadow-lg overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700 border-b border-slate-600">
            <tr>
              {[1, 2, 3, 4].map((i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-slate-600 rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row}>
                {[1, 2, 3, 4].map((col) => (
                  <td key={col} className="px-6 py-4">
                    <div className="h-4 bg-slate-700 rounded w-32"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Table Skeleton */}
      <div>
        <div className="h-6 bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
        <TableSkeleton />
      </div>
    </div>
  )
}
