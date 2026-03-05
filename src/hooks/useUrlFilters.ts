import { useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

interface FilterState {
  [key: string]: string | string[] | { from?: string; to?: string } | undefined
}

interface UseUrlFiltersOptions {
  from?: string
  replace?: boolean
}

export function useUrlFilters<T extends FilterState>(
  options: UseUrlFiltersOptions = {}
) {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: options.from || '__root__' }) as T

  const setFilter = useCallback(
    (key: keyof T, value: T[keyof T] | null) => {
      const newParams = { ...searchParams }

      if (value === null || value === undefined) {
        delete newParams[key]
      } else if (Array.isArray(value) && value.length === 0) {
        delete newParams[key]
      } else if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !value.from &&
        !value.to
      ) {
        delete newParams[key]
      } else {
        newParams[key] = value
      }

      navigate({
        search: newParams,
        replace: options.replace ?? false,
      })
    },
    [navigate, searchParams, options]
  )

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const newParams = { ...searchParams }

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          delete newParams[key as keyof T]
        } else if (Array.isArray(value) && value.length === 0) {
          delete newParams[key as keyof T]
        } else if (
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !(value as any).from &&
          !(value as any).to
        ) {
          delete newParams[key as keyof T]
        } else {
          ;(newParams as any)[key] = value
        }
      })

      navigate({
        search: newParams,
        replace: options.replace ?? false,
      })
    },
    [navigate, searchParams, options]
  )

  const clearFilters = useCallback(
    (keys?: (keyof T)[]) => {
      if (!keys) {
        navigate({
          search: {} as T,
          replace: options.replace ?? false,
        })
      } else {
        const newParams = { ...searchParams }
        keys.forEach((key) => {
          delete newParams[key]
        })
        navigate({
          search: newParams,
          replace: options.replace ?? false,
        })
      }
    },
    [navigate, searchParams, options]
  )

  return {
    filters: searchParams,
    setFilter,
    setFilters,
    clearFilters,
  }
}
