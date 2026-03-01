import { useState } from 'react'
import type { Agent, AgentHistoryEntry } from '../types/agent'
import { StatusBadge } from './StatusBadge'
import { AgentHistoryTable } from './AgentHistoryTable'

interface AgentDetailLayoutProps {
  agent: Agent
  history: AgentHistoryEntry[]
  isLoading: boolean
  isHistoryLoading: boolean
}

type TabType = 'overview' | 'tasks' | 'history'

export function AgentDetailLayout({
  agent,
  history,
  isLoading,
  isHistoryLoading,
}: AgentDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-500">Loading agent details...</p>
      </div>
    )
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'history', label: 'History' },
  ]

  function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'sr-dev': 'Senior Developer',
      'junior': 'Junior Developer',
      'pm': 'Project Manager',
    }
    return labels[role] || role
  }

  function getRoleBgColor(role: string): string {
    switch (role) {
      case 'sr-dev':
        return 'bg-purple-50'
      case 'junior':
        return 'bg-sky-50'
      case 'pm':
        return 'bg-orange-50'
      default:
        return 'bg-slate-50'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Agent Profile Card */}
      <div
        className={`rounded-xl border border-slate-200 shadow-sm p-6 mb-6 ${getRoleBgColor(agent.role)}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {agent.name}
            </h1>
            <p className="text-slate-600">{getRoleLabel(agent.role)}</p>
          </div>
          <StatusBadge status={agent.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              ID
            </p>
            <p className="text-sm text-slate-700 font-mono">{agent.id}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Last Updated
            </p>
            <p className="text-sm text-slate-700">
              {new Date(agent.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {activeTab === 'overview' && (
          <OverviewTab agent={agent} />
        )}

        {activeTab === 'tasks' && (
          <TasksTab agent={agent} />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            history={history}
            isLoading={isHistoryLoading}
          />
        )}
      </div>
    </div>
  )
}

function OverviewTab({ agent }: { agent: Agent }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Current Activity
        </h3>
        <p className="text-slate-700">{agent.currentTask || 'No active task'}</p>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Output</h3>
        <p className="text-slate-700">{agent.output || 'No output available'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-6">
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Status
          </p>
          <StatusBadge status={agent.status} />
        </div>
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Role
          </p>
          <p className="text-slate-700 font-medium capitalize">{agent.role}</p>
        </div>
      </div>
    </div>
  )
}

function TasksTab({ agent }: { agent: Agent }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Active Task</h3>
        <p className="text-blue-800">
          {agent.currentTask || 'No active task'}
        </p>
      </div>
      <p className="text-sm text-slate-500 text-center py-4">
        Recent and active tasks will be displayed here
      </p>
    </div>
  )
}

function HistoryTab({
  history,
  isLoading,
}: {
  history: AgentHistoryEntry[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-slate-500">Loading history...</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">No history available</p>
      </div>
    )
  }

  return <AgentHistoryTable data={history} />
}
