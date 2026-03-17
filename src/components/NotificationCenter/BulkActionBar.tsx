interface BulkActionBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onMarkAsRead: () => void
  onArchive: () => void
  isLoading?: boolean
}

/**
 * Bulk action toolbar for notification operations
 *
 * Features:
 * - Shows selection count
 * - Select/Deselect all buttons
 * - Bulk operations (mark as read, archive)
 * - Loading state
 * - Fixed position at bottom of list
 */
export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onMarkAsRead,
  onArchive,
  isLoading,
}: BulkActionBarProps) {
  const allSelected = selectedCount > 0 && selectedCount === totalCount

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center justify-between sticky bottom-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-900">
          {selectedCount} selected
        </span>

        {selectedCount > 0 && (
          <div className="flex gap-2">
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              type="button"
              disabled={isLoading}
              className="text-xs text-blue-600 hover:text-blue-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex gap-2">
          <button
            onClick={onMarkAsRead}
            type="button"
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Mark as read
          </button>
          <button
            onClick={onArchive}
            type="button"
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Archive
          </button>
        </div>
      )}
    </div>
  )
}
