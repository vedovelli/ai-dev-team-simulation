import { useCallback } from 'react'

export interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  disabled?: boolean
}

/**
 * Pagination controls for table navigation.
 * Includes page selector and page size selector.
 */
export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalItems)

  const handlePrevious = useCallback(() => {
    if (page > 1) onPageChange(page - 1)
  }, [page, onPageChange])

  const handleNext = useCallback(() => {
    if (page < totalPages) onPageChange(page + 1)
  }, [page, totalPages, onPageChange])

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onPageSizeChange(parseInt(e.target.value, 10))
    },
    [onPageSizeChange]
  )

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-slate-400">
        Showing {totalItems === 0 ? 0 : startItem} to {endItem} of {totalItems} items
      </div>

      <div className="flex items-center gap-3">
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          disabled={disabled || totalItems === 0}
          className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Items per page"
        >
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
        </select>

        <div className="flex gap-1">
          <button
            onClick={handlePrevious}
            disabled={disabled || page === 1}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            ← Prev
          </button>

          <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm">
            Page {totalPages === 0 ? 0 : page} of {totalPages}
          </div>

          <button
            onClick={handleNext}
            disabled={disabled || page >= totalPages}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
