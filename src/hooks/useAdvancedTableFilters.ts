import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type {
  FilterFieldDefinition,
  FilterPreset,
  FilterState,
  UseTableFiltersOptions,
  UseTableFiltersReturn,
} from '../types/filters'

/**
 * Advanced hook for managing composable filter state with URL persistence
 * Supports text, multiselect, select, daterange, and checkbox filter types
 */
export function useAdvancedTableFilters(
  options: UseTableFiltersOptions
): UseTableFiltersReturn {
  const navigate = useNavigate()
  const searchParams = useSearch() as Record<string, any>

  // Parse filter state from URL params
  const filters = useMemo<FilterState>(() => {
    const result: FilterState = {}

    options.fields.forEach((field) => {
      const paramValue = searchParams[field.name]

      if (paramValue === undefined) {
        result[field.name] = field.defaultValue
        return
      }

      if (field.type === 'multiselect' || field.type === 'checkbox') {
        // Handle array values
        result[field.name] = Array.isArray(paramValue)
          ? paramValue
          : typeof paramValue === 'string'
            ? paramValue.split(',').filter(Boolean)
            : []
      } else if (field.type === 'daterange') {
        // Handle date range objects
        const from = searchParams[`${field.name}From`]
        const to = searchParams[`${field.name}To`]
        result[field.name] = { from, to }
      } else {
        // Handle text and select as strings
        result[field.name] = paramValue
      }
    })

    return result
  }, [searchParams, options.fields])

  const updateFilter = useCallback(
    (fieldName: string, value: any) => {
      const field = options.fields.find((f) => f.name === fieldName)
      if (!field) return

      const newParams: Record<string, any> = { ...searchParams }

      if (field.type === 'daterange') {
        // Handle date range updates
        const currentRange = filters[fieldName] as { from?: string; to?: string }
        if (typeof value === 'object' && value.from !== undefined) {
          newParams[`${fieldName}From`] = value.from || null
        }
        if (typeof value === 'object' && value.to !== undefined) {
          newParams[`${fieldName}To`] = value.to || null
        }
      } else if (field.type === 'multiselect' || field.type === 'checkbox') {
        // Handle array values
        if (Array.isArray(value)) {
          if (value.length === 0) {
            delete newParams[fieldName]
          } else {
            newParams[fieldName] = value
          }
        } else {
          delete newParams[fieldName]
        }
      } else {
        // Handle string values
        if (value === null || value === undefined || value === '') {
          delete newParams[fieldName]
        } else {
          newParams[fieldName] = value
        }
      }

      navigate({ search: newParams })
      options.onFiltersChange?.(filters)
    },
    [navigate, searchParams, filters, options]
  )

  const updateFilters = useCallback(
    (updates: Partial<FilterState>) => {
      const newParams: Record<string, any> = { ...searchParams }

      Object.entries(updates).forEach(([fieldName, value]) => {
        const field = options.fields.find((f) => f.name === fieldName)
        if (!field) return

        if (value === null || value === undefined) {
          delete newParams[fieldName]
          if (field.type === 'daterange') {
            delete newParams[`${fieldName}From`]
            delete newParams[`${fieldName}To`]
          }
        } else if (field.type === 'daterange' && typeof value === 'object') {
          newParams[`${fieldName}From`] = value.from || null
          newParams[`${fieldName}To`] = value.to || null
        } else if ((field.type === 'multiselect' || field.type === 'checkbox') && Array.isArray(value)) {
          if (value.length === 0) {
            delete newParams[fieldName]
          } else {
            newParams[fieldName] = value
          }
        } else if (value === '') {
          delete newParams[fieldName]
        } else {
          newParams[fieldName] = value
        }
      })

      navigate({ search: newParams })
      options.onFiltersChange?.(filters)
    },
    [navigate, searchParams, filters, options]
  )

  const clearFilters = useCallback(() => {
    navigate({ search: {} })
    options.onFiltersChange?.({})
  }, [navigate, options])

  const clearFilter = useCallback(
    (fieldName: string) => {
      const field = options.fields.find((f) => f.name === fieldName)
      if (!field) return

      const newParams: Record<string, any> = { ...searchParams }
      delete newParams[fieldName]
      if (field.type === 'daterange') {
        delete newParams[`${fieldName}From`]
        delete newParams[`${fieldName}To`]
      }

      navigate({ search: newParams })
    },
    [navigate, searchParams, options.fields]
  )

  const applyPreset = useCallback(
    (presetName: string) => {
      if (!options.presets) return

      const preset = options.presets.find((p) => p.name === presetName)
      if (!preset) return

      const newParams: Record<string, any> = {}

      Object.entries(preset.filters).forEach(([fieldName, value]) => {
        if (value === null || value === undefined) {
          return
        }

        const field = options.fields.find((f) => f.name === fieldName)
        if (!field) return

        if (field.type === 'daterange' && typeof value === 'object') {
          newParams[`${fieldName}From`] = value.from || null
          newParams[`${fieldName}To`] = value.to || null
        } else if ((field.type === 'multiselect' || field.type === 'checkbox') && Array.isArray(value)) {
          newParams[fieldName] = value
        } else {
          newParams[fieldName] = value
        }
      })

      navigate({ search: newParams })
    },
    [navigate, options]
  )

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      if (typeof value === 'object' && value !== null) {
        return value.from || value.to
      }
      return Boolean(value)
    })
  }, [filters])

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [, value]) => {
      if (Array.isArray(value)) {
        return count + value.length
      }
      if (typeof value === 'object' && value !== null) {
        return count + (value.from ? 1 : 0) + (value.to ? 1 : 0)
      }
      return count + (Boolean(value) ? 1 : 0)
    }, 0)
  }, [filters])

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,
    applyPreset,
    hasActiveFilters,
    activeFilterCount,
  }
}
