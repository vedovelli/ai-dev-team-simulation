interface TableSkeletonProps {
  rowCount?: number
  columnCount?: number
  height?: string
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-size-200 h-full rounded" />
  )
}

export function TableSkeleton({
  rowCount = 5,
  columnCount = 6,
  height = '500px',
}: TableSkeletonProps) {
  return (
    <div
      className="rounded-lg border border-slate-200 overflow-hidden"
      style={{ height }}
      role="status"
      aria-label="Loading table data"
    >
      <table className="w-full border-collapse">
        {/* Skeleton Header */}
        <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300">
          <tr>
            {Array.from({ length: columnCount }).map((_, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-100 border-b border-slate-300"
              >
                <div className="h-4 bg-slate-300 rounded w-3/4" />
              </th>
            ))}
          </tr>
        </thead>

        {/* Skeleton Rows */}
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-slate-200">
              {Array.from({ length: columnCount }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3 text-sm">
                  <div className="h-4 bg-slate-200 rounded w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
