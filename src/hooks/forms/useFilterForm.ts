import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { useCallback, useEffect } from 'react'

/**
 * Validation schema for filter form
 */
const filterSchema = z.object({
  search: z.string().optional().default(''),
  status: z.enum(['all', 'active', 'inactive', 'archived']).optional().default('all'),
  dateFrom: z.string().optional().default(''),
  dateTo: z.string().optional().default(''),
  sortBy: z.enum(['name', 'date', 'status']).optional().default('name'),
})

export type FilterFormData = z.infer<typeof filterSchema>

interface UseFilterFormOptions {
  onFiltersChange?: (data: FilterFormData) => Promise<void>
  debounceMs?: number
}

/**
 * Custom hook for filter form with debounced validation
 * Automatically synchronizes filter values to query parameters
 *
 * @example
 * ```tsx
 * function FilteredList() {
 *   const form = useFilterForm({
 *     onFiltersChange: async (filters) => {
 *       const results = await api.search(filters)
 *       setResults(results)
 *     },
 *     debounceMs: 300
 *   })
 *
 *   return (
 *     <form>
 *       <input
 *         type="text"
 *         placeholder="Search..."
 *         value={form.state.values.search}
 *         onChange={(e) =>
 *           form.setFieldValue('search', e.target.value)
 *         }
 *       />
 *       <select
 *         value={form.state.values.status}
 *         onChange={(e) =>
 *           form.setFieldValue('status', e.target.value as any)
 *         }
 *       >
 *         <option value="all">All</option>
 *         <option value="active">Active</option>
 *         <option value="inactive">Inactive</option>
 *       </select>
 *     </form>
 *   )
 * }
 * ```
 */
export function useFilterForm({
  onFiltersChange,
  debounceMs = 300,
}: UseFilterFormOptions) {
  const form = useForm({
    defaultValues: {
      search: '',
      status: 'all' as const,
      dateFrom: '',
      dateTo: '',
      sortBy: 'name' as const,
    },
    onSubmit: async ({ value }) => {
      if (onFiltersChange) {
        await onFiltersChange(value)
      }
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: filterSchema,
    },
  })

  // Sync form values to URL query parameters
  const syncToUrl = useCallback(() => {
    const values = form.state.values
    const params = new URLSearchParams()

    // Only add non-empty/non-default values to URL
    if (values.search) params.set('search', values.search)
    if (values.status && values.status !== 'all') params.set('status', values.status)
    if (values.dateFrom) params.set('dateFrom', values.dateFrom)
    if (values.dateTo) params.set('dateTo', values.dateTo)
    if (values.sortBy && values.sortBy !== 'name') params.set('sortBy', values.sortBy)

    const newUrl = params.toString()
    const baseUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl ? `${baseUrl}?${newUrl}` : baseUrl)
  }, [form.state.values])

  // Debounce URL sync and form submission
  useEffect(() => {
    const timer = setTimeout(() => {
      syncToUrl()
      if (onFiltersChange) {
        onFiltersChange(form.state.values)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [form.state.values, debounceMs, syncToUrl, onFiltersChange])

  // Load filter values from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const search = params.get('search') || ''
    const status = (params.get('status') || 'all') as FilterFormData['status']
    const dateFrom = params.get('dateFrom') || ''
    const dateTo = params.get('dateTo') || ''
    const sortBy = (params.get('sortBy') || 'name') as FilterFormData['sortBy']

    if (search) form.setFieldValue('search', search)
    if (status) form.setFieldValue('status', status)
    if (dateFrom) form.setFieldValue('dateFrom', dateFrom)
    if (dateTo) form.setFieldValue('dateTo', dateTo)
    if (sortBy) form.setFieldValue('sortBy', sortBy)
  }, [form])

  return form
}
