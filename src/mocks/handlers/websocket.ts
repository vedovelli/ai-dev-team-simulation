import { ws } from 'msw'
import type { RealtimeEvent } from '../../types/realtime'

/**
 * MSW WebSocket mock setup for real-time events
 *
 * Features:
 * - Simulates WebSocket connection lifecycle
 * - Emits realistic events on a timer (v1 implementation)
 * - Supports heartbeat messages
 * - Can be evolved to emit more specific events based on app state
 */

// Event generation helpers
function generateTaskEvent(): RealtimeEvent {
  const taskId = Math.random().toString(36).substring(7)
  const sprintId = ['sprint-1', 'sprint-2', 'sprint-3'][
    Math.floor(Math.random() * 3)
  ]
  const statuses = ['todo', 'in_progress', 'done'] as const
  const priorities = ['low', 'normal', 'high'] as const

  const eventTypes = [
    'task:updated',
    'task:created',
    'task:deleted',
  ] as const

  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]

  switch (eventType) {
    case 'task:created':
      return {
        type: 'task:created',
        taskId,
        sprintId,
        title: `Task ${taskId.substring(0, 4)}`,
        timestamp: Date.now(),
      }

    case 'task:updated':
      return {
        type: 'task:updated',
        taskId,
        sprintId,
        changes: {
          status: statuses[Math.floor(Math.random() * statuses.length)],
          priority: priorities[Math.floor(Math.random() * priorities.length)],
        },
        timestamp: Date.now(),
      }

    case 'task:deleted':
      return {
        type: 'task:deleted',
        taskId,
        sprintId,
        timestamp: Date.now(),
      }

    default:
      const _exhaustive: never = eventType
      return _exhaustive
  }
}

function generateSprintEvent(): RealtimeEvent {
  const sprintId = `sprint-${Math.floor(Math.random() * 10)}`
  const eventTypes = [
    'sprint:updated',
    'sprint:started',
    'sprint:completed',
  ] as const

  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]

  switch (eventType) {
    case 'sprint:started':
      return {
        type: 'sprint:started',
        sprintId,
        timestamp: Date.now(),
      }

    case 'sprint:completed':
      return {
        type: 'sprint:completed',
        sprintId,
        timestamp: Date.now(),
      }

    case 'sprint:updated':
      const statuses = ['planning', 'active', 'completed'] as const
      return {
        type: 'sprint:updated',
        sprintId,
        changes: {
          status: statuses[Math.floor(Math.random() * statuses.length)],
        },
        timestamp: Date.now(),
      }

    default:
      const _exhaustive: never = eventType
      return _exhaustive
  }
}

function generateAgentEvent(): RealtimeEvent {
  const agentId = `agent-${Math.floor(Math.random() * 5)}`
  const eventTypes = [
    'agent:status-changed',
    'agent:capacity-changed',
  ] as const

  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]

  switch (eventType) {
    case 'agent:status-changed':
      const statuses = ['active', 'idle', 'offline'] as const
      return {
        type: 'agent:status-changed',
        agentId,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        timestamp: Date.now(),
      }

    case 'agent:capacity-changed':
      return {
        type: 'agent:capacity-changed',
        agentId,
        capacity: Math.floor(Math.random() * 10) + 1,
        currentLoad: Math.floor(Math.random() * 5),
        timestamp: Date.now(),
      }

    default:
      const _exhaustive: never = eventType
      return _exhaustive
  }
}

function generateRandomEvent(): RealtimeEvent {
  const eventSources = [generateTaskEvent, generateSprintEvent, generateAgentEvent]
  const fn = eventSources[Math.floor(Math.random() * eventSources.length)]
  return fn()
}

/**
 * WebSocket server setup for /api/realtime
 *
 * Simulates a real-time event stream that:
 * - Emits random events on a 5-second interval
 * - Responds to heartbeat messages
 * - Maintains connection state
 *
 * Can be evolved to:
 * - Track actual app state changes
 * - Emit specific events based on mutations
 * - Support client subscriptions to specific entity types
 */
export const websocketHandlers = [
  ws.url('*/api/realtime', ({ server }) => {
    // Handle incoming messages
    server.addEventListener('connection', (client) => {
      console.log('[MSW WebSocket] Client connected')

      // Send initial welcome message
      client.send(
        JSON.stringify({
          type: 'connection:established',
          timestamp: Date.now(),
        })
      )

      // Setup event emission on interval
      const eventInterval = setInterval(() => {
        try {
          const event = generateRandomEvent()
          client.send(JSON.stringify(event))
        } catch (err) {
          console.error('[MSW WebSocket] Failed to send event:', err)
        }
      }, 5000)

      // Handle incoming messages
      client.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'heartbeat') {
            // Respond to heartbeat
            client.send(
              JSON.stringify({
                type: 'heartbeat:ack',
                timestamp: Date.now(),
              })
            )
          }
        } catch (err) {
          console.error('[MSW WebSocket] Failed to handle message:', err)
        }
      })

      // Cleanup on disconnect
      client.addEventListener('close', () => {
        console.log('[MSW WebSocket] Client disconnected')
        clearInterval(eventInterval)
      })
    })
  }),
]
