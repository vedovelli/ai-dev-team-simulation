import { describe, it, expect } from 'vitest'
import { serializeTableState, deserializeTableState, type TableURLState } from '../useTableState'

describe('useTableState serialization', () => {
  describe('serializeTableState', () => {
    it('should serialize empty state', () => {
      const state: TableURLState = {}
      const result = serializeTableState(state)
      expect(result).toEqual({})
    })

    it('should serialize sorting', () => {
      const state: TableURLState = {
        sort: [{ column: 'name', direction: 'asc' }],
      }
      const result = serializeTableState(state)
      expect(result.sort).toBe('name:asc')
    })

    it('should serialize multiple sort columns', () => {
      const state: TableURLState = {
        sort: [
          { column: 'priority', direction: 'desc' },
          { column: 'name', direction: 'asc' },
        ],
      }
      const result = serializeTableState(state)
      expect(result.sort).toBe('priority:desc,name:asc')
    })

    it('should serialize filters', () => {
      const state: TableURLState = {
        filters: { status: 'active', team: 'frontend' },
      }
      const result = serializeTableState(state)
      expect(result.filter_status).toBe('active')
      expect(result.filter_team).toBe('frontend')
    })

    it('should skip empty filter values', () => {
      const state: TableURLState = {
        filters: { status: 'active', team: '' },
      }
      const result = serializeTableState(state)
      expect(result.filter_status).toBe('active')
      expect(result.filter_team).toBeUndefined()
    })

    it('should serialize pagination', () => {
      const state: TableURLState = {
        page: 2,
        pageSize: 50,
      }
      const result = serializeTableState(state)
      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(50)
    })

    it('should skip page 1 (default)', () => {
      const state: TableURLState = {
        page: 1,
        pageSize: 10,
      }
      const result = serializeTableState(state)
      expect(result.page).toBeUndefined()
      expect(result.pageSize).toBe(10)
    })

    it('should serialize selected rows', () => {
      const state: TableURLState = {
        selectedRows: ['row1', 'row2', 'row3'],
      }
      const result = serializeTableState(state)
      expect(result.selectedRows).toBe('row1,row2,row3')
    })

    it('should handle complete state', () => {
      const state: TableURLState = {
        sort: [{ column: 'name', direction: 'asc' }],
        filters: { status: 'active' },
        page: 3,
        pageSize: 25,
        selectedRows: ['id1', 'id2'],
      }
      const result = serializeTableState(state)
      expect(result.sort).toBe('name:asc')
      expect(result.filter_status).toBe('active')
      expect(result.page).toBe(3)
      expect(result.pageSize).toBe(25)
      expect(result.selectedRows).toBe('id1,id2')
    })
  })

  describe('deserializeTableState', () => {
    it('should deserialize empty params', () => {
      const result = deserializeTableState({})
      expect(result).toEqual({})
    })

    it('should deserialize sorting', () => {
      const result = deserializeTableState({ sort: 'name:asc' })
      expect(result.sort).toEqual([{ column: 'name', direction: 'asc' }])
    })

    it('should deserialize multiple sort columns', () => {
      const result = deserializeTableState({ sort: 'priority:desc,name:asc' })
      expect(result.sort).toEqual([
        { column: 'priority', direction: 'desc' },
        { column: 'name', direction: 'asc' },
      ])
    })

    it('should handle invalid sort direction (default to asc)', () => {
      const result = deserializeTableState({ sort: 'name:invalid' })
      expect(result.sort).toEqual([{ column: 'name', direction: 'asc' }])
    })

    it('should deserialize filters', () => {
      const result = deserializeTableState({ filter_status: 'active', filter_team: 'frontend' })
      expect(result.filters).toEqual({ status: 'active', team: 'frontend' })
    })

    it('should skip non-filter prefixed params', () => {
      const result = deserializeTableState({
        filter_status: 'active',
        sort: 'name:asc',
        other: 'value',
      })
      expect(result.filters).toEqual({ status: 'active' })
      expect(result.sort).toEqual([{ column: 'name', direction: 'asc' }])
      expect(result).not.toHaveProperty('other')
    })

    it('should deserialize pagination', () => {
      const result = deserializeTableState({ page: '2', pageSize: '50' })
      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(50)
    })

    it('should handle numeric pagination params', () => {
      const result = deserializeTableState({ page: 2, pageSize: 50 })
      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(50)
    })

    it('should skip invalid pagination values', () => {
      const result = deserializeTableState({ page: '0', pageSize: '-10' })
      expect(result.page).toBeUndefined()
      expect(result.pageSize).toBeUndefined()
    })

    it('should deserialize selected rows', () => {
      const result = deserializeTableState({ selectedRows: 'row1,row2,row3' })
      expect(result.selectedRows).toEqual(['row1', 'row2', 'row3'])
    })

    it('should skip empty row ids', () => {
      const result = deserializeTableState({ selectedRows: 'row1,,row3,' })
      expect(result.selectedRows).toEqual(['row1', 'row3'])
    })

    it('should handle complete params', () => {
      const result = deserializeTableState({
        sort: 'name:asc',
        filter_status: 'active',
        page: '3',
        pageSize: '25',
        selectedRows: 'id1,id2',
      })
      expect(result).toEqual({
        sort: [{ column: 'name', direction: 'asc' }],
        filters: { status: 'active' },
        page: 3,
        pageSize: 25,
        selectedRows: ['id1', 'id2'],
      })
    })
  })

  describe('round-trip serialization', () => {
    it('should preserve state through serialize/deserialize cycle', () => {
      const originalState: TableURLState = {
        sort: [{ column: 'priority', direction: 'desc' }],
        filters: { status: 'done', team: 'backend' },
        page: 2,
        pageSize: 20,
        selectedRows: ['task1', 'task2'],
      }

      const serialized = serializeTableState(originalState)
      const deserialized = deserializeTableState(serialized)

      expect(deserialized.sort).toEqual(originalState.sort)
      expect(deserialized.filters).toEqual(originalState.filters)
      expect(deserialized.page).toBe(originalState.page)
      expect(deserialized.pageSize).toBe(originalState.pageSize)
      expect(deserialized.selectedRows).toEqual(originalState.selectedRows)
    })

    it('should handle edge cases in round-trip', () => {
      const state: TableURLState = {
        filters: { empty: '', status: 'active' },
        selectedRows: [],
      }

      const serialized = serializeTableState(state)
      const deserialized = deserializeTableState(serialized)

      // Empty filter should be skipped
      expect(deserialized.filters?.empty).toBeUndefined()
      expect(deserialized.filters?.status).toBe('active')
      // Empty selected rows array should not be included
      expect(deserialized.selectedRows).toBeUndefined()
    })
  })
})
