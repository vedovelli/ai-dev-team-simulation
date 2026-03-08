import { useCallback, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { WorkloadData } from '../hooks/useAgentWorkload'
import { useAgentWorkloadList, calculateWorkloadMetrics } from '../hooks/useAgentWorkload'
import { AgentWorkloadCard } from './AgentWorkloadCard'

type FilterOption = 'all' | 'overloaded' | 'balanced' | 'underutilized'
type SortOption = 'utilization' | 'tasks' | 'name' | 'role'

/**
 * Agent Workload Balancing Dashboard
 * Shows team capacity planning with virtual scrolling for 100+ agents
 * Includes filtering by utilization level and role
 * Independent real-time polling every 30 seconds
 */
export function WorkloadDashboard() {
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [sortBy, setSortBy] = useState<SortOption>('utilization')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch workload data with independent polling
  const { data: workloads, isLoading, isError, error } = useAgentWorkloadList()

  // Calculate metrics for each agent
  const workloadsWithMetrics = useMemo(() => {
    if (!workloads) return []

    return workloads.map((workload) => ({
      workload,
      metrics: calculateWorkloadMetrics(workload),
    }))
  }, [workloads])

  // Filter agents based on utilization and role
  const filteredWorkloads = useMemo(() => {
    return workloadsWithMetrics.filter((item) => {
      const { metrics, workload } = item

      // Filter by utilization status
      if (filterBy !== 'all' && metrics.utilization !== filterBy) {
        return false
      }

      // Filter by role
      if (roleFilter !== 'all' && workload.role !== roleFilter) {
        return false
      }

      return true
    })
  }, [workloadsWithMetrics, filterBy, roleFilter])

  // Sort filtered agents
  const sortedWorkloads = useMemo(() => {
    const sorted = [...filteredWorkloads]

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'utilization':
          return b.workload.utilizationPercent - a.workload.utilizationPercent
        case 'tasks':
          return b.workload.activeTasksCount - a.workload.activeTasksCount
        case 'name':
          return a.workload.agentId.localeCompare(b.workload.agentId)
        case 'role':
          return a.workload.role.localeCompare(b.workload.role)
        default:
          return 0
      }
    })

    return sorted
  }, [filteredWorkloads, sortBy])

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: sortedWorkloads.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 250, // Card height estimate
    overscan: 10,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0

  // Get unique roles for filtering
  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>()
    workloadsWithMetrics.forEach((item) => {
      roles.add(item.workload.role)
    })
    return Array.from(roles).sort()
  }, [workloadsWithMetrics])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (workloads.length === 0) return null

    const total = workloads.length
    const overloaded = workloads.filter((w) => {
      const metrics = calculateWorkloadMetrics(w)
      return metrics.utilization === 'overloaded'
    }).length
    const balanced = workloads.filter((w) => {
      const metrics = calculateWorkloadMetrics(w)
      return metrics.utilization === 'balanced'
    }).length
    const underutilized = workloads.filter((w) => {
      const metrics = calculateWorkloadMetrics(w)
      return metrics.utilization === 'underutilized'
    }).length

    const avgUtilization = Math.round(
      (workloads.reduce((sum, w) => sum + w.utilizationPercent, 0) / total) * 10
    ) / 10
    const totalTasks = workloads.reduce((sum, w) => sum + w.activeTasksCount, 0)

    return {
      total,
      overloaded,
      balanced,
      underutilized,
      avgUtilization,
      totalTasks,
    }
  }, [workloads])

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center p-8 border border-red-300 rounded-lg bg-red-50'>
        <p className='text-red-900 font-semibold'>
          Failed to load workload data
        </p>
        <p className='text-sm text-red-700 mt-1'>
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full gap-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold mb-2'>Agent Workload Dashboard</h1>
        <p className='text-gray-600'>
          Monitor team capacity and task distribution across agents
        </p>
      </div>

      {/* Summary Cards */}
      {summaryStats && (
        <div className='grid grid-cols-2 md:grid-cols-6 gap-4'>
          <div className='bg-white border rounded-lg p-4'>
            <p className='text-xs font-semibold text-gray-600 uppercase'>
              Total Agents
            </p>
            <p className='text-2xl font-bold mt-1'>{summaryStats.total}</p>
          </div>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <p className='text-xs font-semibold text-red-600 uppercase'>
              Overloaded
            </p>
            <p className='text-2xl font-bold text-red-700 mt-1'>
              {summaryStats.overloaded}
            </p>
          </div>
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <p className='text-xs font-semibold text-green-600 uppercase'>
              Balanced
            </p>
            <p className='text-2xl font-bold text-green-700 mt-1'>
              {summaryStats.balanced}
            </p>
          </div>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <p className='text-xs font-semibold text-blue-600 uppercase'>
              Underutilized
            </p>
            <p className='text-2xl font-bold text-blue-700 mt-1'>
              {summaryStats.underutilized}
            </p>
          </div>
          <div className='bg-white border rounded-lg p-4'>
            <p className='text-xs font-semibold text-gray-600 uppercase'>
              Avg Utilization
            </p>
            <p className='text-2xl font-bold mt-1'>
              {summaryStats.avgUtilization}%
            </p>
          </div>
          <div className='bg-white border rounded-lg p-4'>
            <p className='text-xs font-semibold text-gray-600 uppercase'>
              Active Tasks
            </p>
            <p className='text-2xl font-bold mt-1'>{summaryStats.totalTasks}</p>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className='bg-white border rounded-lg p-4 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Filter by Utilization */}
          <div>
            <label className='block text-sm font-semibold mb-2'>
              Utilization Level
            </label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
            >
              <option value='all'>All Agents</option>
              <option value='overloaded'>Overloaded (&gt; 90%)</option>
              <option value='balanced'>Balanced (50-90%)</option>
              <option value='underutilized'>Underutilized (&lt; 50%)</option>
            </select>
          </div>

          {/* Filter by Role */}
          <div>
            <label className='block text-sm font-semibold mb-2'>Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
            >
              <option value='all'>All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort by */}
          <div>
            <label className='block text-sm font-semibold mb-2'>Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
            >
              <option value='utilization'>Utilization (High to Low)</option>
              <option value='tasks'>Task Count (High to Low)</option>
              <option value='name'>Name (A to Z)</option>
              <option value='role'>Role (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Results info */}
        <div className='text-sm text-gray-600'>
          Showing {sortedWorkloads.length} of {workloadsWithMetrics.length} agents
        </div>
      </div>

      {/* Virtualized Agent Grid */}
      {isLoading ? (
        <div className='flex items-center justify-center p-8'>
          <p className='text-gray-500'>Loading workload data...</p>
        </div>
      ) : sortedWorkloads.length === 0 ? (
        <div className='flex items-center justify-center p-8 text-gray-500'>
          No agents match the selected filters
        </div>
      ) : (
        <div
          ref={containerRef}
          className='flex-1 overflow-y-auto border rounded-lg bg-white'
        >
          <div
            style={{
              height: `${totalSize}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <div
              style={{
                transform: `translateY(${paddingTop}px)`,
              }}
            >
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4'>
                {virtualItems.map((virtualItem) => {
                  const item = sortedWorkloads[virtualItem.index]
                  if (!item) return null

                  return (
                    <div key={item.workload.agentId} data-index={virtualItem.index}>
                      <AgentWorkloadCard
                        workload={item.workload}
                        metrics={item.metrics}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className='text-xs text-gray-500 text-center'>
        Real-time updates • Polling every 30 seconds
      </div>
    </div>
  )
}
