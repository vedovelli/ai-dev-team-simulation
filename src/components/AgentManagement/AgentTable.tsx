import { useMemo, useState } from 'react'
import type { Agent, AgentRole } from '../../types/agent'
import { AgentStatusBadge } from './AgentStatusBadge'
import { AgentActionsMenu } from './AgentActionsMenu'
import { SearchInput } from '../SearchInput'

interface AgentTableProps {
  agents: Agent[]
  isLoading?: boolean
  onEdit: (agent: Agent) => void
  onDelete: (agentId: string) => void
  onViewDetails: (agentId: string) => void
}

type SortKey = 'name' | 'capabilities' | 'taskCount' | 'successRate' | 'lastActive'

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-700">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-slate-700 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export function AgentTable({
  agents,
  isLoading = false,
  onEdit,
  onDelete,
  onViewDetails,
}: AgentTableProps) {
  const [filterValue, setFilterValue] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Mock data for capabilities and success rate (since Agent type doesn't have these)
  const agentsWithMockData = useMemo(
    () =>
      agents.map((agent) => ({
        ...agent,
        capabilities: ['REST APIs', 'React', 'TypeScript'].slice(
          0,
          Math.floor(Math.random() * 3) + 1
        ),
        taskCount: Math.floor(Math.random() * 15),
        successRate: Math.floor(Math.random() * 30) + 70,
      })),
    [agents]
  )

  const filteredAndSorted = useMemo(() => {
    let result = agentsWithMockData

    if (filterValue) {
      const lower = filterValue.toLowerCase()
      result = result.filter(
        (agent) =>
          agent.name.toLowerCase().includes(lower) ||
          agent.capabilities.some((cap) => cap.toLowerCase().includes(lower))
      )
    }

    result.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortKey) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'taskCount':
          aVal = a.taskCount
          bVal = b.taskCount
          break
        case 'successRate':
          aVal = a.successRate
          bVal = b.successRate
          break
        case 'lastActive':
          aVal = new Date(a.lastUpdated).getTime()
          bVal = new Date(b.lastUpdated).getTime()
          break
        case 'capabilities':
          aVal = a.capabilities.length
          bVal = b.capabilities.length
          break
      }

      const comparison =
        typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number)
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [agentsWithMockData, filterValue, sortKey, sortOrder])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search by name or capabilities..."
        value={filterValue}
        onChange={setFilterValue}
      />

      <div className="rounded-lg bg-slate-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700 border-b border-slate-600 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left">
                  <SortButton
                    label="Name"
                    onClick={() => handleSort('name')}
                    isActive={sortKey === 'name'}
                    order={sortKey === 'name' ? sortOrder : undefined}
                  />
                </th>
                <th className="px-6 py-3 text-left">Capabilities</th>
                <th className="px-6 py-3 text-left">
                  <SortButton
                    label="Task Count"
                    onClick={() => handleSort('taskCount')}
                    isActive={sortKey === 'taskCount'}
                    order={sortKey === 'taskCount' ? sortOrder : undefined}
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <SortButton
                    label="Success Rate"
                    onClick={() => handleSort('successRate')}
                    isActive={sortKey === 'successRate'}
                    order={sortKey === 'successRate' ? sortOrder : undefined}
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <SortButton
                    label="Last Active"
                    onClick={() => handleSort('lastActive')}
                    isActive={sortKey === 'lastActive'}
                    order={sortKey === 'lastActive' ? sortOrder : undefined}
                  />
                </th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredAndSorted.length > 0 ? (
                filteredAndSorted.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold">
                          {agent.name.charAt(0)}
                        </div>
                        <span>{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-2 py-1 bg-slate-700 text-xs rounded text-slate-200"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{agent.taskCount}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-700 rounded-full h-2 max-w-xs">
                          <div
                            className={`h-full rounded-full transition-all ${
                              agent.successRate >= 85
                                ? 'bg-green-500'
                                : agent.successRate >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${agent.successRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 min-w-fit">
                          {agent.successRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatTimeAgo(agent.lastUpdated)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <AgentActionsMenu
                        agentId={agent.id}
                        onEdit={() => onEdit(agent)}
                        onDelete={onDelete}
                        onViewDetails={onViewDetails}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                    <div className="space-y-2">
                      <p>No agents found</p>
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        Create Agent
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface SortButtonProps {
  label: string
  onClick: () => void
  isActive: boolean
  order?: 'asc' | 'desc'
}

function SortButton({ label, onClick, isActive, order }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 hover:text-slate-100 transition-colors text-slate-200 font-semibold"
    >
      {label}
      {isActive && <span className="text-xs text-blue-400">{order === 'asc' ? '↑' : '↓'}</span>}
    </button>
  )
}
