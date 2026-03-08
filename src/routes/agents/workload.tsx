/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useState, useRef } from 'react'
import { useWorkloadAnalytics } from '../../hooks/useWorkloadAnalytics'
import { useReassignTask } from '../../hooks/mutations/useReassignTask'
import { AgentWorkloadCard } from '../../components/AgentWorkloadCard/AgentWorkloadCard'
import { WorkloadFilterBar } from '../../components/WorkloadFilterBar/WorkloadFilterBar'
import { LoadingState } from '../../components/LoadingState'
import { ErrorState } from '../../components/ErrorState'
import type { WorkloadAnalyticsFilters } from '../../hooks/useWorkloadAnalytics'

export const Route = createFileRoute('/agents/workload')({
  component: AgentWorkloadDashboard,
})

function AgentWorkloadDashboard() {
  const [filters, setFilters] = useState<WorkloadAnalyticsFilters>({})
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; fromAgentId: string } | null>(
    null
  )
  const parentRef = useRef<HTMLDivElement>(null)

  const { data = [], isLoading, error } = useWorkloadAnalytics(filters)
  const reassignMutation = useReassignTask()

  // Collect all unique skill tags for filter dropdown
  const allSkillTags = Array.from(new Set(data.flatMap((w) => w.skillTags))).sort()

  // Virtual scrolling for large agent lists
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250,
    overscan: 2,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  const handleTaskDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string, agentId: string) => {
    e.stopPropagation()
    setDraggedTask({ taskId, fromAgentId: agentId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toAgentId: string) => {
    e.preventDefault()
    if (!draggedTask || draggedTask.fromAgentId === toAgentId) {
      return
    }

    // Check capacity validation from dropped agent
    const targetAgent = data.find((w) => w.agentId === toAgentId)
    if (targetAgent && targetAgent.capacityUtilization >= 100) {
      alert('Target agent is at maximum capacity')
      setDraggedTask(null)
      return
    }

    reassignMutation.mutate({
      taskId: draggedTask.taskId,
      fromAgentId: draggedTask.fromAgentId,
      toAgentId,
    })

    setDraggedTask(null)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Agent Workload Balancer</h1>
        <LoadingState title="Loading Workload Data" message="Fetching agent workload information..." />
      </main>
    )
  }

  if (error) {
    const errorObject = error instanceof Error ? error : undefined
    return (
      <main className="min-h-screen bg-white p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Agent Workload Balancer</h1>
        <ErrorState
          title="Failed to Load Workload"
          message="Unable to fetch agent workload data"
          error={errorObject}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Agent Workload Balancer</h1>
        <p className="text-gray-600 mb-6">
          Drag tasks between agents to balance workload across your team
        </p>

        <WorkloadFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          skillTags={allSkillTags}
        />

        {/* Virtual scrolling container */}
        <div
          ref={parentRef}
          className="mt-6 h-screen overflow-y-auto rounded-lg bg-white"
        >
          <div style={{ height: `${totalSize}px` }} className="relative w-full">
            {virtualItems.map((virtualItem) => {
              const workload = data[virtualItem.index]
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  className="absolute top-0 left-0 w-full px-4 py-3"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <AgentWorkloadCard
                    workload={workload}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', workload.agentId)
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, workload.agentId)}
                    onDragLeave={handleDragLeave}
                  >
                    {/* Task reassignment drop zone indicator */}
                    {draggedTask && draggedTask.fromAgentId !== workload.agentId && (
                      <div className="rounded bg-blue-50 p-3 text-center text-sm text-blue-600">
                        {workload.capacityUtilization < 100
                          ? '📥 Drop task here to reassign'
                          : '⚠️ Agent at capacity'}
                      </div>
                    )}
                  </AgentWorkloadCard>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {data.length} agents
        </div>
      </div>
    </main>
  )
}
