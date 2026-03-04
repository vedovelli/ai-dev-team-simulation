import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVirtualizedTableState } from '../useVirtualizedTableState'

describe('useVirtualizedTableState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVirtualizedTableState())

    expect(result.current.globalFilter).toBe('')
    expect(result.current.columnVisibility).toEqual({})
    expect(result.current.selectedRowIndex).toBeNull()
  })

  it('should initialize with custom column visibility', () => {
    const initialVisibility = { id: true, name: false }
    const { result } = renderHook(() =>
      useVirtualizedTableState({
        initialColumnVisibility: initialVisibility,
      })
    )

    expect(result.current.columnVisibility).toEqual(initialVisibility)
  })

  it('should update global filter', () => {
    const { result } = renderHook(() => useVirtualizedTableState())

    act(() => {
      result.current.setGlobalFilter('test query')
    })

    expect(result.current.globalFilter).toBe('test query')
  })

  it('should update column visibility', () => {
    const { result } = renderHook(() => useVirtualizedTableState())

    const newVisibility = { id: true, name: false, status: true }

    act(() => {
      result.current.setColumnVisibility(newVisibility)
    })

    expect(result.current.columnVisibility).toEqual(newVisibility)
  })

  it('should update selected row index', () => {
    const { result } = renderHook(() => useVirtualizedTableState())

    act(() => {
      result.current.setSelectedRowIndex(5)
    })

    expect(result.current.selectedRowIndex).toBe(5)
  })

  it('should reset state to initial values', () => {
    const { result } = renderHook(() =>
      useVirtualizedTableState({
        initialColumnVisibility: { id: false },
      })
    )

    act(() => {
      result.current.setGlobalFilter('search')
      result.current.setSelectedRowIndex(3)
      result.current.setColumnVisibility({ id: true })
    })

    expect(result.current.globalFilter).toBe('search')
    expect(result.current.selectedRowIndex).toBe(3)

    act(() => {
      result.current.resetState()
    })

    expect(result.current.globalFilter).toBe('')
    expect(result.current.selectedRowIndex).toBeNull()
    expect(result.current.columnVisibility).toEqual({ id: false })
  })

  it('should clear selected row when setting to null', () => {
    const { result } = renderHook(() => useVirtualizedTableState())

    act(() => {
      result.current.setSelectedRowIndex(5)
    })

    expect(result.current.selectedRowIndex).toBe(5)

    act(() => {
      result.current.setSelectedRowIndex(null)
    })

    expect(result.current.selectedRowIndex).toBeNull()
  })

  it('should persist independent state values', () => {
    const { result } = renderHook(() => useVirtualizedTableState())

    act(() => {
      result.current.setGlobalFilter('query')
      result.current.setSelectedRowIndex(2)
    })

    // Update one value
    act(() => {
      result.current.setGlobalFilter('new query')
    })

    // Other values should remain unchanged
    expect(result.current.selectedRowIndex).toBe(2)
    expect(result.current.globalFilter).toBe('new query')
  })
})
