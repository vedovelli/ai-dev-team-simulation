import { useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import { AdvancedDataTable } from './AdvancedDataTable'
import { useEmployeeQuery } from './hooks/useEmployeeQuery'

/**
 * Example demonstrating the AdvancedDataTable component with TanStack Table v8.
 *
 * Features:
 * - Server-side sorting and pagination
 * - Global search functionality
 * - Column visibility toggling
 * - Row selection with checkboxes
 * - Responsive table with virtualization
 * - Loading and error states
 */
export function AdvancedDataTableExample() {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading, isError, error } = useEmployeeQuery({
    pageIndex,
    pageSize,
    sorting,
    search,
    department,
    status,
  })

  const employees = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Employee Directory
        </h1>
        <p className="text-slate-600">
          Advanced data table with sorting, filtering, and column visibility controls
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Search Employees
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name, email, or position..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPageIndex(0)
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Department
              </label>
              <select
                id="department"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value)
                  setPageIndex(0)
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Support">Support</option>
                <option value="Legal">Legal</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPageIndex(0)
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <AdvancedDataTable
          data={employees}
          isLoading={isLoading}
          isError={isError}
          errorMessage={
            error instanceof Error
              ? error.message
              : 'Failed to load employees'
          }
          onSortingChange={setSorting}
        />
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {employees.length === 0 ? 0 : pageIndex * pageSize + 1} to{' '}
            {Math.min((pageIndex + 1) * pageSize, total)} of {total} employees
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={pageIndex === 0 || isLoading}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Page {pageIndex + 1} of{' '}
                {Math.ceil(total / pageSize)}
              </span>
            </div>

            <button
              onClick={() =>
                setPageIndex((prev) =>
                  Math.min(
                    prev + 1,
                    Math.ceil(total / pageSize) - 1
                  )
                )
              }
              disabled={
                pageIndex >= Math.ceil(total / pageSize) - 1 || isLoading
              }
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
