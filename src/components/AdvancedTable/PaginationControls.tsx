interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  canPreviousPage: boolean
  canNextPage: boolean
  onPreviousPage: () => void
  onNextPage: () => void
  onPageSizeChange: (size: number) => void
  pageSize: number
  pageSizeOptions?: number[]
  totalRecords: number
  isLoading?: boolean
  variant?: 'simple' | 'extended'
}

export function PaginationControls({
  currentPage,
  totalPages,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onPageSizeChange,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  totalRecords,
  isLoading = false,
  variant = 'extended',
}: PaginationControlsProps) {
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(parseInt(e.target.value, 10))
  }

  if (variant === 'simple') {
    return (
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-slate-600">
          Page {currentPage + 1} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPreviousPage}
            disabled={!canPreviousPage || isLoading}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            ← Previous
          </button>
          <button
            onClick={onNextPage}
            disabled={!canNextPage || isLoading}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Page Size Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm font-medium text-slate-700">
            Rows per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={isLoading}
            className="px-3 py-1 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-slate-600">
          Total: {totalRecords} record{totalRecords !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Page {currentPage + 1} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPreviousPage}
            disabled={!canPreviousPage || isLoading}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            ← Previous
          </button>
          <button
            onClick={onNextPage}
            disabled={!canNextPage || isLoading}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
