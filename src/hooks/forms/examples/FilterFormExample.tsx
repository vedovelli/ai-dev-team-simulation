import { useFilterForm, type FilterFormData } from '../useFilterForm'
import { useState } from 'react'

interface Item {
  id: string
  name: string
  status: 'active' | 'inactive' | 'archived'
  date: string
}

/**
 * Example component demonstrating useFilterForm hook
 * Shows filter form with multiple field types and query parameter synchronization
 */
export function FilterFormExample() {
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useFilterForm({
    onFiltersChange: async (filters: FilterFormData) => {
      try {
        setIsLoading(true)

        // Simulate API call with filter parameters
        const queryParams = new URLSearchParams()
        if (filters.search) queryParams.set('search', filters.search)
        if (filters.status !== 'all') queryParams.set('status', filters.status)
        if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom)
        if (filters.dateTo) queryParams.set('dateTo', filters.dateTo)
        if (filters.sortBy) queryParams.set('sortBy', filters.sortBy)

        const response = await fetch(`/api/items?${queryParams.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch items')

        const data = await response.json()
        setFilteredItems(data.items || [])
      } catch (error) {
        console.error('Filter error:', error)
        setFilteredItems([])
      } finally {
        setIsLoading(false)
      }
    },
    debounceMs: 300,
  })

  return (
    <div className="space-y-6">
      <form className="bg-white p-4 rounded border border-gray-200 space-y-4">
        <h2 className="text-xl font-bold">Filter Items</h2>

        {/* Search field */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium mb-1">
            Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by name..."
            value={form.state.values.search}
            onChange={(e) => form.setFieldValue('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        {/* Status select */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            value={form.state.values.status}
            onChange={(e) => form.setFieldValue('status', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium mb-1">
              From Date
            </label>
            <input
              id="dateFrom"
              type="date"
              value={form.state.values.dateFrom}
              onChange={(e) => form.setFieldValue('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium mb-1">
              To Date
            </label>
            <input
              id="dateTo"
              type="date"
              value={form.state.values.dateTo}
              onChange={(e) => form.setFieldValue('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Sort by */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium mb-1">
            Sort By
          </label>
          <select
            id="sortBy"
            value={form.state.values.sortBy}
            onChange={(e) => form.setFieldValue('sortBy', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="status">Status</option>
          </select>
        </div>
      </form>

      {/* Results */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold">
          Results ({isLoading ? 'loading...' : filteredItems.length})
        </h3>

        {filteredItems.length > 0 ? (
          <ul className="space-y-2">
            {filteredItems.map((item) => (
              <li
                key={item.id}
                className="p-3 border border-gray-200 rounded hover:bg-gray-50"
              >
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-600">
                  Status: {item.status} • Date: {item.date}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No items found</p>
        )}
      </div>
    </div>
  )
}
