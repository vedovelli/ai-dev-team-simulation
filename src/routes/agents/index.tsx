import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { useAgents } from '../../hooks/useAgents'

export function AgentsDashboard() {
  const { data: agents = [], isLoading, error } = useAgents()
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: agents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    gap: 8,
  })

  if (isLoading) {
    return <div className="p-4">Loading agents...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading agents: {error.message}</div>
  }

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Agent Dashboard</h1>
      <div
        ref={parentRef}
        className="border rounded-lg overflow-auto h-[600px] bg-white"
      >
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const agent = agents[virtualItem.index]
            if (!agent) return null

            return (
              <div
                key={agent.id}
                data-index={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="p-4 border-b flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-semibold">{agent.name}</p>
                    <p className="text-sm text-gray-600">{agent.role}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        agent.status === 'idle'
                          ? 'bg-gray-100 text-gray-800'
                          : agent.status === 'working'
                            ? 'bg-blue-100 text-blue-800'
                            : agent.status === 'blocked'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AgentsDashboard
