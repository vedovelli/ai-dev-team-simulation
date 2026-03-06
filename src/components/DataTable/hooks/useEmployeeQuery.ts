import { useQuery } from '@tanstack/react-query'
import type { Employee, EmployeesResponse } from '../../../types/employee'
import { SortingState } from '@tanstack/react-table'

interface UseEmployeeQueryOptions {
  pageIndex?: number
  pageSize?: number
  sorting?: SortingState
  search?: string
  department?: string
  status?: string
}

export function useEmployeeQuery(options: UseEmployeeQueryOptions = {}) {
  const {
    pageIndex = 0,
    pageSize = 25,
    sorting = [],
    search = '',
    department = '',
    status = '',
  } = options

  const sortBy =
    sorting.length > 0
      ? sorting[0].id
      : 'firstName'
  const sortOrder =
    sorting.length > 0 && sorting[0].desc
      ? 'desc'
      : 'asc'

  const params = new URLSearchParams()
  params.append('pageIndex', String(pageIndex))
  params.append('pageSize', String(pageSize))
  params.append('sortBy', sortBy)
  params.append('sortOrder', sortOrder)

  if (search) {
    params.append('search', search)
  }
  if (department) {
    params.append('department', department)
  }
  if (status) {
    params.append('status', status)
  }

  return useQuery({
    queryKey: [
      'employees',
      { pageIndex, pageSize, sorting, search, department, status },
    ],
    queryFn: async (): Promise<EmployeesResponse> => {
      const response = await fetch(`/api/employees?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
