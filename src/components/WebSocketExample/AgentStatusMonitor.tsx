import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useWebSocket,
  useWebSocketQueryIntegration,
  type WebSocketMessage,
} from '../../hooks'

/**
 * Agent Status Message from WebSocket
 */
interface AgentStatusUpdate {
  agentId: string
  status: 'online' | 'offline' | 'busy'
  lastSeen: string
}

/**
 * Mock agent data type
 */
interface Agent {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy'
  lastSeen: string
}

/**
 * Example component demonstrating WebSocket integration with TanStack Query
 *
 * Shows how to:
 * 1. Connect to WebSocket and receive realtime updates
 * 2. Merge incoming updates with cached query data
 * 3. Handle connection state and errors
 * 4. Properly cleanup on unmount
 *
 * @example
 * ```tsx
 * <AgentStatusMonitor wsUrl="ws://localhost:8080" />
 * ```
 */
export function AgentStatusMonitor({ wsUrl }: { wsUrl: string }) {
  const queryClient = useQueryClient()
  const [lastUpdate, setLastUpdate] = useState<AgentStatusUpdate | null>(null)

  // Fetch initial agent list
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      // Mock data - in real app, fetch from server
      return [
        { id: '1', name: 'Agent Alpha', status: 'online' as const, lastSeen: new Date().toISOString() },
        { id: '2', name: 'Agent Beta', status: 'offline' as const, lastSeen: new Date().toISOString() },
        { id: '3', name: 'Agent Gamma', status: 'busy' as const, lastSeen: new Date().toISOString() },
      ]
    },
  })

  // Setup WebSocket query integration
  const { updateQueryData } = useWebSocketQueryIntegration({
    queryKey: ['agents'],
    onMergeData: (existing: Agent[], incoming: AgentStatusUpdate) => {
      // Smart merge: update specific agent's status
      return existing.map((agent) =>
        agent.id === incoming.agentId
          ? { ...agent, status: incoming.status, lastSeen: incoming.lastSeen }
          : agent
      )
    },
  })

  // Connect to WebSocket
  const { isConnected, isConnecting, error, send, disconnect } = useWebSocket({
    url: wsUrl,
    onMessage: (message: WebSocketMessage<AgentStatusUpdate>) => {
      if (message.type === 'agent-status-update') {
        const update = message.payload
        setLastUpdate(update)
        updateQueryData(update)
      }
    },
    shouldReconnect: true,
    maxReconnectAttempts: 5,
    onOpen: () => {
      console.log('WebSocket connected')
      // Optionally subscribe to specific updates
      send({
        type: 'subscribe',
        payload: { channel: 'agent-status' },
      })
    },
    onError: (event) => {
      console.error('WebSocket error:', event)
    },
    onClose: () => {
      console.log('WebSocket disconnected')
    },
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Agent Status Monitor</h2>

        {/* Connection Status */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </span>
          {error && <span className="text-sm text-red-600">Error: {error.message}</span>}
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm font-mono text-gray-700">
              Last update: {lastUpdate.agentId} → {lastUpdate.status}
            </p>
          </div>
        )}
      </div>

      {/* Agent List */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700">Agents</h3>
        {agents.length === 0 ? (
          <p className="text-gray-500 text-sm">Loading agents...</p>
        ) : (
          <ul className="space-y-1">
            {agents.map((agent) => (
              <li
                key={agent.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm font-medium">{agent.name}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'online'
                        ? 'bg-green-500'
                        : agent.status === 'busy'
                          ? 'bg-yellow-500'
                          : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-xs text-gray-600">{agent.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() =>
            send({
              type: 'test-message',
              payload: { timestamp: Date.now() },
            })
          }
          disabled={!isConnected}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded disabled:bg-gray-300"
        >
          Send Test Message
        </button>
        <button
          onClick={disconnect}
          disabled={!isConnected}
          className="px-3 py-1 bg-red-500 text-white text-sm rounded disabled:bg-gray-300"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

export default AgentStatusMonitor
