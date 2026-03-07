import React from 'react'
import { useAgentStatus } from '../../hooks/useAgentStatus'
import type { AgentAvailability } from '../../types/agent'

/**
 * Agent Status Dashboard Component
 *
 * Displays real-time agent status with:
 * - Status aggregation summary (idle, working, waiting counts)
 * - Sortable table with agent details
 * - Filter by status
 * - Search by agent name
 * - Auto-refresh every 15 seconds
 */
export function AgentStatusDashboard() {
  const { agents, aggregation, isLoading, isError, error } = useAgentStatus()

  const [filterStatus, setFilterStatus] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [sortKey, setSortKey] = React.useState<'name' | 'status' | 'tasksCompleted' | 'performance'>('name')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')

  // Filter agents
  let filteredAgents = agents

  if (filterStatus) {
    const statusMap: Record<string, AgentAvailability['status']> = {
      idle: 'idle',
      working: 'active',
      busy: 'busy',
      waiting: 'offline',
    }
    const targetStatus = statusMap[filterStatus]
    filteredAgents = filteredAgents.filter((agent) => agent.status === targetStatus)
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filteredAgents = filteredAgents.filter((agent) =>
      agent.name.toLowerCase().includes(term)
    )
  }

  // Sort agents
  filteredAgents.sort((a, b) => {
    let aVal: any = ''
    let bVal: any = ''

    switch (sortKey) {
      case 'name':
        aVal = a.name
        bVal = b.name
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      case 'tasksCompleted':
        aVal = a.metadata?.tasksCompleted ?? 0
        bVal = b.metadata?.tasksCompleted ?? 0
        break
      case 'performance':
        // Calculate performance tier based on error rate
        aVal = a.metadata?.errorRate ?? 0
        bVal = b.metadata?.errorRate ?? 0
        break
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }

    const numA = typeof aVal === 'number' ? aVal : 0
    const numB = typeof bVal === 'number' ? bVal : 0
    return sortOrder === 'asc' ? numA - numB : numB - numA
  })

  const toggleSort = (key: 'name' | 'status' | 'tasksCompleted' | 'performance') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const getPerformanceTier = (errorRate: number): 'high' | 'medium' | 'low' => {
    if (errorRate <= 5) return 'high'
    if (errorRate <= 15) return 'medium'
    return 'low'
  }

  const getStatusBadgeColor = (status: AgentAvailability['status']): string => {
    switch (status) {
      case 'idle':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'busy':
        return 'bg-yellow-100 text-yellow-800'
      case 'offline':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Agent Status</h2>
        <p className="text-red-700">{error?.message || 'Failed to fetch agent status'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agent Status Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time monitoring of agent status and performance</p>
      </div>

      {/* Status Aggregation Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Idle</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{aggregation.idle}</p>
            </div>
            <div className="text-4xl text-blue-200">⏸</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Working</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{aggregation.working}</p>
            </div>
            <div className="text-4xl text-green-200">▶</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Waiting</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{aggregation.waiting}</p>
            </div>
            <div className="text-4xl text-red-200">⏳</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by name
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search agents..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by status
            </label>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="idle">Idle</option>
              <option value="working">Working</option>
              <option value="busy">Busy</option>
              <option value="waiting">Waiting</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-gray-500 mt-4">Loading agent status...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No agents found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => toggleSort('name')}
                    className="font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-2"
                  >
                    Name
                    {sortKey === 'name' && (
                      <span className="text-sm">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => toggleSort('status')}
                    className="font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-2"
                  >
                    Status
                    {sortKey === 'status' && (
                      <span className="text-sm">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => toggleSort('tasksCompleted')}
                    className="font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-2"
                  >
                    Tasks Completed
                    {sortKey === 'tasksCompleted' && (
                      <span className="text-sm">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => toggleSort('performance')}
                    className="font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-2"
                  >
                    Performance
                    {sortKey === 'performance' && (
                      <span className="text-sm">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{agent.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {agent.metadata?.tasksCompleted ?? 0}
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-sm">{agent.role}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      getPerformanceTier(agent.metadata?.errorRate ?? 0) === 'high'
                        ? 'bg-green-100 text-green-800'
                        : getPerformanceTier(agent.metadata?.errorRate ?? 0) === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {getPerformanceTier(agent.metadata?.errorRate ?? 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Last Update Info */}
      <div className="text-sm text-gray-500">
        Updating every 15 seconds • Last update: {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}
