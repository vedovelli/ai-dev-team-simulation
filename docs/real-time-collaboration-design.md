# Real-Time Collaboration Design Document

## Executive Summary

This document defines the architecture, conflict resolution strategy, and implementation plan for real-time collaboration features in the AI Dev Team Simulation platform. Real-time collaboration enables multiple users to simultaneously edit tasks, participate in sprint planning, and see live updates from their teammates.

The design prioritizes data consistency, graceful conflict handling, and user experience in scenarios with network disruption and concurrent edits.

---

## 1. Scope Definition

### 1.1 Features Requiring Real-Time Updates

**Priority 1 (MVP)**:
- Task edits (description, priority, assignee, status, labels)
- Presence indicators (who's viewing/editing what)
- Task status changes (broadcasted updates)
- Comment additions and updates
- Sprint planning board updates (drag-drop task assignments)

**Priority 2 (Post-MVP)**:
- Sprint metadata edits (name, dates, goals)
- Agent availability changes
- Bulk task operations (visible progress to all users)
- Task creation in shared views

### 1.2 User Actions That Trigger Broadcasts

**Immediate Broadcast (within 500ms)**:
- Task save (after form submission or explicit save)
- Task status change (completed, in-progress, etc.)
- Assignee change
- Sprint board drop (task reassignment)
- Comment submission
- Presence join/leave

**Debounced Broadcast (1s window)**:
- Description edits during typing (show "User X is typing...")
- Priority changes
- Label modifications

### 1.3 Data Synchronization Requirements

Real-time events must propagate:
- To all users viewing the same sprint
- To users viewing the same task detail modal
- To users with the same assignee in their dashboard
- Presence data to any user in an overlapping context

**Data Consistency Model**: Eventual consistency with strong consistency for critical fields (e.g., assignee prevents double-assignment).

### 1.4 Performance Boundaries

- **Concurrent Users**: Up to 20 concurrent users per sprint (soft limit)
- **Message Frequency**: Max 10 messages per second per client
- **Payload Size**: Individual messages < 5KB, batch updates < 10KB
- **Latency Target**: Updates visible within 500ms of send
- **Network Conditions**: Support 3G/LTE with up to 2s latency

---

## 2. Conflict Resolution Strategy

### 2.1 Conflict Types and Resolution Patterns

#### Pattern A: Same Field, Different Values (Last-Write-Wins with Collision Detection)

**Scenario**: User A and B both edit task description simultaneously.

**Resolution**:
1. Track last modified timestamp and user ID on each field
2. Server accepts the latest timestamp
3. If timestamps differ by < 100ms, apply three-way merge logic
4. Client shows conflict modal with version comparison

**Code Flow**:
```typescript
type FieldVersion = {
  value: string;
  timestamp: number;
  userId: string;
  version: number;
};

function resolveFieldConflict(
  local: FieldVersion,
  remote: FieldVersion,
  original: FieldVersion
): ResolutionResult {
  // If no conflict, use remote
  if (remote.timestamp > local.timestamp) {
    return { resolved: true, value: remote.value };
  }

  // If timestamps too close, use three-way merge or conflict modal
  if (Math.abs(remote.timestamp - local.timestamp) < 100) {
    return { resolved: false, local, remote, original };
  }

  // Local wins (user was faster)
  return { resolved: true, value: local.value };
}
```

#### Pattern B: Different Fields on Same Entity (Field-Level Merge)

**Scenario**: User A changes priority while B changes assignee on the same task.

**Resolution**:
- Merge non-conflicting field changes automatically
- No user interaction required
- Increment task version number
- Emit "merged changes from 2 users" event

**Implementation**:
```typescript
interface TaskFieldDelta {
  taskId: string;
  userId: string;
  timestamp: number;
  version: number;
  changes: Partial<Task>;
  originalVersion: number;
}

function mergeTaskDeltas(
  local: TaskFieldDelta,
  remote: TaskFieldDelta,
  serverVersion: Task
): Task {
  const fieldsChanged = new Set([
    ...Object.keys(local.changes),
    ...Object.keys(remote.changes)
  ]);

  const conflicts = fieldsChanged.filter(
    field => field in local.changes && field in remote.changes
  );

  if (conflicts.length === 0) {
    // Safe to merge
    return { ...serverVersion, ...local.changes, ...remote.changes };
  }

  // Has conflicts on these fields: handle with modal
  return null;
}
```

#### Pattern C: Task Deletion During Concurrent Edit

**Scenario**: User A deletes a task while B is editing it.

**Resolution**:
1. Server rejects edit with 409 Conflict + reason "task_deleted"
2. Client shows toast: "Task was deleted by User A"
3. Close detail modal with optional "undo delete" action (5s window)
4. Invalidate task cache

**Handling**:
```typescript
function handleTaskEditError(error: ApiError, context: EditContext) {
  if (error.code === 409 && error.reason === 'task_deleted') {
    showToast(`Task deleted by ${error.deletedBy}`, {
      action: {
        label: 'Undo',
        onClick: () => undoTaskDeletion(context.taskId)
      },
      duration: 5000
    });
    closeTaskDetail();
  }
}
```

#### Pattern D: Network Partition Recovery (Offline Changes)

**Scenario**: User A goes offline, makes edits, comes back online while B also edited the task.

**Resolution**:
1. Client batches changes while offline into a pending queue
2. On reconnect, send all pending changes with "offlineUntil" timestamp
3. Server applies changes against current server state
4. If conflicts exist, merge using timestamp + server version
5. Notify user of how many changes were merged

**Queue Structure**:
```typescript
interface PendingChange {
  id: string;
  type: 'edit' | 'create' | 'delete';
  entityId: string;
  changes: Partial<Task>;
  timestamp: number;
  offlineUntil?: number; // When reconnection occurred
  status: 'pending' | 'sent' | 'confirmed' | 'failed';
}
```

### 2.2 Conflict Resolution Flowchart

```
Remote update received (WebSocket)
├─ Check if entity exists locally?
│  ├─ No → Fetch full state from server
│  └─ Yes → Continue
├─ Compare versions (local vs remote vs server)
├─ Changes on same field?
│  ├─ No → Merge field-level changes (no conflict)
│  ├─ Yes & timestamps differ > 100ms → LWW (no conflict)
│  └─ Yes & timestamps < 100ms → Conflict detected
│     ├─ Show conflict modal
│     ├─ User selects version
│     └─ Emit resolution event
└─ Invalidate TanStack Query cache
   └─ Re-fetch from server for confirmation
```

### 2.3 Conflict Modal UI

When a conflict is detected (same field edited concurrently), show modal with:

```typescript
interface ConflictModalProps {
  field: string;
  localValue: string;
  remoteValue: string;
  localUser: string;
  remoteUser: string;
  localTimestamp: number;
  remoteTimestamp: number;
  onResolve: (winner: 'local' | 'remote' | 'merge') => void;
}

// Display:
// "Conflict on Task Description"
// "Your version (edited 2s ago)"
// [Show local value in editor, read-only]
//
// "John's version (edited 1s ago)"
// [Show remote value in editor, read-only]
//
// [Keep mine] [Use theirs] [Merge manually]
```

---

## 3. WebSocket Architecture

### 3.1 Connection Lifecycle

```
┌─ Connect
│  ├─ CONNECTING (authenticate)
│  ├─ AUTH_SUCCESS
│  └─ CONNECTED
├─ Active session
│  ├─ Message exchange
│  ├─ Heartbeat (30s)
│  └─ Presence broadcast (5s)
├─ Network disruption
│  ├─ DISCONNECTED (connection lost)
│  ├─ Retry with exponential backoff:
│  │  ├─ 1s wait → retry
│  │  ├─ 2s wait → retry
│  │  ├─ 4s wait → retry
│  │  ├─ 8s wait → retry
│  │  └─ 16s (cap) → retry
│  └─ Back to CONNECTED on success
└─ Disconnect
   ├─ User logout
   ├─ Browser tab close
   └─ Server shutdown
```

### 3.2 Message Format and Versioning

**Base Message Structure**:
```typescript
interface WebSocketMessage {
  id: string; // UUID for deduplication
  version: 1; // Schema version
  type: MessageType;
  timestamp: number;
  userId: string;
  payload: unknown;
  sequence: number; // Per-connection sequence for ordering
}

type MessageType =
  | 'auth'
  | 'auth_response'
  | 'subscribe'
  | 'unsubscribe'
  | 'task_update'
  | 'task_created'
  | 'task_deleted'
  | 'comment_added'
  | 'presence_update'
  | 'presence_leave'
  | 'heartbeat'
  | 'heartbeat_ack'
  | 'error'
  | 'ack';
```

**Event Message Examples**:

```typescript
// Task update event
{
  id: 'evt-abc123',
  version: 1,
  type: 'task_update',
  timestamp: 1678903200000,
  userId: 'user-456',
  payload: {
    taskId: 'task-789',
    sprintId: 'sprint-123',
    changes: {
      description: 'Updated task...',
      priority: 2
    },
    fieldVersions: {
      description: { version: 5, timestamp: 1678903200000 },
      priority: { version: 3, timestamp: 1678903200000 }
    }
  },
  sequence: 42
}

// Presence event
{
  id: 'evt-presence-001',
  version: 1,
  type: 'presence_update',
  timestamp: 1678903200000,
  userId: 'user-456',
  payload: {
    status: 'viewing', // 'viewing' | 'editing' | 'offline'
    context: {
      type: 'task', // 'task' | 'sprint' | 'dashboard'
      entityId: 'task-789'
    },
    user: {
      id: 'user-456',
      name: 'John Doe',
      color: '#FF5733'
    }
  },
  sequence: 43
}
```

### 3.3 Authentication and Authorization

**WebSocket Auth Flow**:

1. Client connects (no auth yet)
2. Server sends `auth_required` message
3. Client sends JWT in auth message
4. Server validates JWT and replies with `auth_response`
5. Only after auth, client can subscribe to channels

```typescript
// Client auth
{
  id: 'auth-request-1',
  type: 'auth',
  payload: {
    token: 'eyJhbGc...' // JWT from login
  }
}

// Server response
{
  id: 'auth-request-1',
  type: 'auth_response',
  payload: {
    success: true,
    userId: 'user-456',
    permissions: ['sprint:read', 'task:write']
  }
}
```

**Authorization for Subscriptions**:
- User can only subscribe to sprints they're a member of
- User can only see presence/updates for their sprint
- Can filter out sensitive info based on role

### 3.4 Room/Channel Structure

**Channel Design**:

```
Global rooms:
- notifications (all authenticated users)

Per-sprint:
- sprint:{sprintId}:updates (all members see)
- sprint:{sprintId}:presence (all members see who's online)

Per-task (when modal open):
- task:{taskId}:updates
- task:{taskId}:comments

Per-user (personal):
- user:{userId}:notifications
```

**Subscribe/Unsubscribe**:

```typescript
{
  type: 'subscribe',
  payload: {
    channels: ['sprint:sprint-123:updates', 'sprint:sprint-123:presence']
  }
}

// Server manages subscriptions
// Client auto-unsubscribes when leaving view
```

### 3.5 Heartbeat and Presence Detection

**Heartbeat (every 30 seconds)**:

```typescript
// Client sends
{ type: 'heartbeat', id: 'hb-123', timestamp: 1678903200000 }

// Server responds
{ type: 'heartbeat_ack', id: 'hb-123', serverTime: 1678903200050 }
```

**Presence Broadcast (every 5 seconds)**:

```typescript
// Client broadcasts presence when in a view
{
  type: 'presence_update',
  payload: {
    status: 'viewing', // or 'editing'
    context: { type: 'sprint', entityId: 'sprint-123' },
    lastActivity: 1678903200000
  }
}

// Server removes presence if no heartbeat for 60s
```

---

## 4. Client-Side State Management

### 4.1 TanStack Query Integration

**Query Structure for Real-Time Data**:

```typescript
// Base query for task
const taskQuery = {
  queryKey: ['tasks', taskId],
  queryFn: () => fetchTask(taskId),
  staleTime: 5000, // Stale after 5s (WebSocket should be fresher)
  gcTime: 1000 * 60 * 5, // Keep in cache 5min
};

// Sprint-level query
const sprintTasksQuery = {
  queryKey: ['sprints', sprintId, 'tasks'],
  queryFn: () => fetchSprintTasks(sprintId),
  staleTime: 3000, // Shorter stale time for collaborative data
  select: (data) => sortByPosition(data) // Keep local sort stable
};
```

### 4.2 Optimistic Updates Pattern

When user submits a task edit:

```typescript
function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation(
    (data) => api.updateTask(data),
    {
      onMutate: async (newData) => {
        // Cancel in-flight queries
        await queryClient.cancelQueries(['tasks', newData.taskId]);

        // Snapshot old data
        const previous = queryClient.getQueryData(['tasks', newData.taskId]);

        // Optimistically update
        queryClient.setQueryData(['tasks', newData.taskId], (old) => ({
          ...old,
          ...newData,
          __optimistic: true,
          __version: (old.__version || 0) + 1
        }));

        return { previous, newData };
      },
      onError: (err, newData, context) => {
        // Rollback on error
        queryClient.setQueryData(['tasks', newData.taskId], context.previous);
      },
      onSuccess: (serverData) => {
        // Confirm with server version
        queryClient.setQueryData(['tasks', serverData.id], serverData);
      }
    }
  );
}
```

### 4.3 WebSocket Update Handler

When WebSocket event arrives, update cache before UI re-renders:

```typescript
function useWebSocketSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = ws.on('task_update', (event) => {
      // Check if we have local optimistic update pending
      const cached = queryClient.getQueryData(['tasks', event.taskId]);

      if (cached?.__optimistic) {
        // We have pending optimistic update
        // Server confirmed our changes
        if (isCompatible(cached, event)) {
          // Our changes align with server, keep them
          queryClient.setQueryData(['tasks', event.taskId], {
            ...event.data,
            __optimistic: false
          });
        } else {
          // Conflict detected, resolve
          handleConflict(cached, event);
        }
      } else {
        // Just a remote update, apply it
        queryClient.setQueryData(['tasks', event.taskId], event.data);
      }

      // Invalidate related queries
      queryClient.invalidateQueries(['sprints', event.sprintId]);
    });

    return unsubscribe;
  }, [queryClient]);
}
```

### 4.4 Query Invalidation Strategy

**Invalidation Scope**:

```typescript
// Task updated
queryClient.invalidateQueries({
  queryKey: ['tasks', taskId]
});
queryClient.invalidateQueries({
  queryKey: ['sprints', sprintId, 'tasks']
});

// Sprint updated
queryClient.invalidateQueries({
  queryKey: ['sprints', sprintId]
});

// Comment added
queryClient.invalidateQueries({
  queryKey: ['tasks', taskId, 'comments']
});

// Assignee changed (multiple impacts)
queryClient.invalidateQueries({
  queryKey: ['users', oldAssigneeId, 'tasks']
});
queryClient.invalidateQueries({
  queryKey: ['users', newAssigneeId, 'tasks']
});
```

### 4.5 Handling Stale Data During Reconnection

After reconnecting after > 30s offline:

```typescript
function useWebSocketReconnect() {
  useEffect(() => {
    const unsubscribe = ws.on('reconnected', () => {
      const queryClient = useQueryClient();

      // Full invalidation of stale data
      queryClient.resetQueries();

      // Re-fetch critical queries
      queryClient.refetchQueries({
        queryKey: ['sprints', currentSprintId],
        type: 'active'
      });
    });

    return unsubscribe;
  }, []);
}
```

---

## 5. MSW Mock Strategy

### 5.1 WebSocket Mock Handler

**Setup**:

```typescript
import { setupServer } from 'msw/node';
import { WebSocketHandler } from 'msw';

class CollaborationWebSocketServer {
  private clients = new Map<string, MockClient>();
  private messageQueue: QueuedMessage[] = [];
  private conflicts: ConflictRecord[] = [];

  constructor() {
    this.setupMessageHandlers();
  }

  handleTaskUpdate(userId: string, taskId: string, changes: Partial<Task>) {
    const task = this.state.tasks[taskId];

    // Check for conflicts
    const conflict = this.detectConflict(task, changes, userId);

    if (conflict) {
      this.conflicts.push(conflict);
      // Broadcast conflict to all affected users
      this.broadcastConflict(conflict);
    } else {
      // Apply update
      task.lastModifiedBy = userId;
      task.lastModifiedAt = Date.now();
      Object.assign(task, changes);

      // Broadcast to all subscribed clients
      this.broadcastUpdate({
        type: 'task_update',
        taskId,
        changes,
        userId
      });
    }
  }

  detectConflict(task: Task, incomingChanges: Partial<Task>, userId: string) {
    // Check if same field edited in last 100ms
    const recentEdits = task.__recentEdits?.filter(
      (e) => Date.now() - e.timestamp < 100
    ) || [];

    const conflictedFields = Object.keys(incomingChanges).filter(
      (field) => recentEdits.some((e) => e.field === field && e.userId !== userId)
    );

    if (conflictedFields.length > 0) {
      return {
        taskId: task.id,
        field: conflictedFields[0],
        userId,
        timestamp: Date.now(),
        resolutionRequired: true
      };
    }

    return null;
  }
}
```

### 5.2 Deterministic Conflict Simulation

```typescript
// Fixture for testing conflict scenarios
const conflictScenarios = [
  {
    name: 'Same field, both edit description',
    setup: () => {
      const task = { id: 'task-1', description: 'Original' };
      return {
        initial: task,
        events: [
          { user: 'user-a', change: { description: 'Version A' }, delay: 0 },
          { user: 'user-b', change: { description: 'Version B' }, delay: 50 }
        ],
        expectedConflict: true,
        expectedResolution: 'modal'
      };
    }
  },
  {
    name: 'Different fields',
    setup: () => {
      const task = { id: 'task-1', description: 'Original', priority: 1 };
      return {
        initial: task,
        events: [
          { user: 'user-a', change: { description: 'Version A' }, delay: 0 },
          { user: 'user-b', change: { priority: 2 }, delay: 50 }
        ],
        expectedConflict: false,
        expectedResult: { description: 'Version A', priority: 2 }
      };
    }
  }
];
```

### 5.3 Reconnection Scenario Testing

```typescript
function createReconnectionScenario() {
  return {
    // User goes offline
    disconnect: () => {
      ws.close();
      networkStub.blockRequests = true;
    },

    // User makes changes while offline
    makeOfflineChanges: (changes: Partial<Task>) => {
      // Changes are queued locally
      pendingQueue.push(changes);
    },

    // Simulate external changes while offline
    simulateRemoteChanges: (remoteChanges: Partial<Task>) => {
      // Server-side state is updated
      serverState.tasks[taskId] = { ...serverState.tasks[taskId], ...remoteChanges };
    },

    // Reconnect
    reconnect: async () => {
      networkStub.blockRequests = false;
      ws.connect();

      // Pending queue should sync
      await waitForSync();

      // Should have merged changes
      const result = queryClient.getQueryData(['tasks', taskId]);
      return result;
    }
  };
}
```

### 5.4 Realistic Collaboration Event Generation

```typescript
class CollaborationFixture {
  generateRealisticSession(duration: number, userCount: number) {
    const events: SimulatedEvent[] = [];
    let timestamp = 0;

    // Random task edits over time
    while (timestamp < duration) {
      const user = randomUser(userCount);
      const task = randomTask();
      const field = randomField();

      events.push({
        timestamp,
        userId: user,
        type: 'task_edit',
        data: { taskId: task, changes: { [field]: generateValue(field) } }
      });

      // Probability of conflict: 15%
      if (Math.random() < 0.15) {
        const otherUser = randomOtherUser(user, userCount);
        events.push({
          timestamp: timestamp + randomDelay(10, 100), // Within 100ms
          userId: otherUser,
          type: 'task_edit',
          data: { taskId: task, changes: { [field]: generateValue(field) } },
          expectConflict: true
        });
      }

      timestamp += randomDelay(100, 2000);
    }

    return events;
  }
}
```

---

## 6. Edge Cases and Error Handling

### 6.1 Network Interruptions and Reconnection

**Detection**:
- Heartbeat timeout (no ack after 10s)
- TCP reset
- Browser visibility change (tab hidden)

**Recovery**:
- Exponential backoff reconnection (1s, 2s, 4s, 8s, 16s)
- Auto-reconnect on page focus
- Persist pending changes to localStorage
- Sync pending queue on reconnect

### 6.2 Server Restarts Mid-Session

**Handling**:
- Client detects restart (version mismatch)
- Invalidate all local optimistic updates
- Close WebSocket gracefully
- Show "Server restarted, reloading..." toast
- Re-establish connection
- Refetch all active queries

### 6.3 Stale Client State After Long Disconnect

**Strategy**:
- Track last sync timestamp
- If offline > 5 minutes, do full refresh on reconnect
- Show warning: "You've been offline for 10 minutes, refreshing..."

```typescript
function checkForStaleness() {
  const lastSync = localStorage.getItem('lastSync');
  const now = Date.now();
  const offline = now - parseInt(lastSync || '0');

  if (offline > 5 * 60 * 1000) {
    // Stale, do full refresh
    window.location.reload();
  }
}
```

### 6.4 Conflict Cascade Prevention

**Scenario**: User resolves conflict by choosing version A, which creates new conflict with version B.

**Prevention**:
- Track resolution history per entity
- If two conflicts on same field within 1s, mark as cascade
- Auto-resolve cascade using timestamp
- Notify user: "Multiple conflicts resolved automatically"

### 6.5 Version Mismatch Between Client and Server

**Detection**:
```typescript
interface SyncStatus {
  clientVersion: number;
  serverVersion: number;
  lastSyncTimestamp: number;
}

function detectVersionMismatch(sync: SyncStatus) {
  if (sync.clientVersion < sync.serverVersion - 2) {
    // Client is too far behind
    return 'stale';
  }

  if (sync.clientVersion > sync.serverVersion) {
    // Client has unconfirmed changes
    return 'pending';
  }

  return 'synced';
}
```

**Resolution**:
- Stale: Fetch full state from server
- Pending: Wait for server ack
- Synced: Continue normally

---

## 7. Implementation Phases

### Phase 1: WebSocket Connection Manager (1 sprint)

**Deliverables**:
- `useWebSocket()` hook with lifecycle management
- Connection state machine (CONNECTING, CONNECTED, DISCONNECTED, ERROR)
- Heartbeat mechanism (30s interval)
- Exponential backoff reconnection
- Message deduplication

**Files**:
- `src/hooks/useWebSocket.ts`
- `src/services/websocket/WebSocketManager.ts`
- `src/services/websocket/types.ts`

### Phase 2: Presence Indicators (0.5 sprint)

**Deliverables**:
- Presence broadcast every 5s
- Avatar list showing who's viewing
- "User X is viewing this task" indicator
- Presence cleanup on disconnect

**Files**:
- `src/hooks/usePresence.ts`
- `src/components/PresenceIndicators.tsx`
- `src/services/websocket/PresenceManager.ts`

### Phase 3: Real-Time Task Updates - Last-Write-Wins (1 sprint)

**Deliverables**:
- WebSocket handler for task updates
- Integration with TanStack Query
- Optimistic update rollback on version mismatch
- Simple LWW conflict resolution
- MSW mock handler for task events

**Files**:
- `src/hooks/useRealtimeTask.ts`
- `src/services/websocket/TaskSyncManager.ts`
- `src/mocks/handlers/websocket.ts`

### Phase 4: Advanced Conflict Resolution (1 sprint)

**Deliverables**:
- Conflict detection on same-field edits
- Conflict modal component
- Three-way merge for non-conflicting fields
- Conflict history tracking
- Test fixtures for conflict scenarios

**Files**:
- `src/hooks/useConflictResolution.ts`
- `src/components/ConflictModal.tsx`
- `src/services/collaboration/ConflictResolver.ts`

### Phase 5: Sprint Planning Collaboration (1 sprint)

**Deliverables**:
- Real-time task board updates
- Drag-drop assignment broadcasting
- Bulk operation real-time sync
- Sprint metadata live updates

**Files**:
- Integration with existing task board
- `src/hooks/useSprintSync.ts`

---

## 8. Performance and Scalability

### 8.1 Message Batching and Debouncing

**Debounce for High-Frequency Events**:

```typescript
function useDebounceWebSocketBroadcast(
  event: WebSocketEvent,
  debounceMs: number = 500
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (event: WebSocketEvent) => {
    clearTimeout(timerRef.current!);

    timerRef.current = setTimeout(() => {
      ws.send(event);
    }, debounceMs);
  };
}
```

**Message Batching** (up to 10 messages max):

```typescript
class MessageBatcher {
  private batch: WebSocketMessage[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  enqueue(msg: WebSocketMessage) {
    this.batch.push(msg);

    if (this.batch.length >= 10) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), 100);
    }
  }

  flush() {
    if (this.batch.length === 0) return;

    ws.send({
      type: 'batch',
      messages: this.batch
    });

    this.batch = [];
    clearTimeout(this.flushTimer!);
    this.flushTimer = null;
  }
}
```

### 8.2 Bandwidth Considerations

**Payload Optimization**:

```typescript
// Instead of sending full task
{
  taskId: 'task-123',
  description: 'Full description...',
  priority: 1,
  ...
}

// Send delta only
{
  id: 'evt-456',
  type: 'task_update',
  taskId: 'task-123',
  delta: {
    priority: 1 // Only changed field
  }
}
```

**Compression**:
- Enable permessage-deflate for WebSocket
- Use binary frames for large payloads
- Compress JSON on server side

### 8.3 Server-Side Filtering

Only send updates relevant to user:

```typescript
function shouldSendUpdateToUser(
  user: User,
  update: TaskUpdate,
  subscriptions: string[]
): boolean {
  // Check if user subscribed to this channel
  const channel = `sprint:${update.sprintId}:updates`;

  if (!subscriptions.includes(channel)) {
    return false;
  }

  // Check permissions (e.g., can see this task)
  return userCanAccessTask(user, update.taskId);
}
```

### 8.4 Client-Side Message Queue

```typescript
class WebSocketMessageQueue {
  private queue: WebSocketMessage[] = [];
  private maxQueueSize = 100;

  enqueue(msg: WebSocketMessage) {
    if (this.queue.length >= this.maxQueueSize) {
      // Drop oldest if queue full
      this.queue.shift();
    }
    this.queue.push(msg);
  }

  process() {
    while (this.queue.length > 0) {
      const msg = this.queue.shift()!;
      this.handleMessage(msg);
    }
  }
}
```

---

## 9. Risk Assessment and Mitigation

### 9.1 Data Loss Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| User loses work during network partition | Medium | High | Persist pending queue to localStorage |
| Optimistic update conflicts with server | Medium | Medium | Version tracking and rollback |
| Message loss during reconnect | Low | Medium | Message deduplication and ACK tracking |

### 9.2 Performance Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Message flood from clients | Low | High | Rate limiting on client and server |
| WebSocket connection per user costs | Low | High | Connection pooling, max 20 users per room |
| Query cache thrashing | Medium | Medium | Smart invalidation, batch updates |

### 9.3 Consistency Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Concurrent deletes create orphaned data | Low | High | Soft deletes, version tracking |
| Stale presence data | Medium | Low | 60s timeout, heartbeat validation |
| Conflict resolution bias towards one user | Low | Medium | Timestamp-based selection, user notification |

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Conflict detection logic
- Version comparison functions
- Message parsing and serialization

### 10.2 Integration Tests

- WebSocket connection lifecycle
- Query invalidation on updates
- Optimistic update rollback

### 10.3 E2E Scenarios

- Two users editing same task simultaneously
- User goes offline, makes changes, reconnects
- Network partition recovery
- Server restart during active session
- Presence indicators

### 10.4 Chaos Testing

- Random network delays (0-2s)
- Random disconnections
- Message loss (1-5%)
- Out-of-order message delivery

---

## 11. Success Metrics

1. **Conflict Detection**: Correctly identify 95%+ of same-field conflicts
2. **Update Latency**: Remote updates visible within 500ms (p95)
3. **Data Consistency**: Zero silent data loss in conflict scenarios
4. **Message Reliability**: 99.9%+ message delivery rate
5. **Presence Accuracy**: Presence data accurate within 5s
6. **Recovery Time**: Full sync after 5min+ disconnect within 3s
7. **User Experience**: Zero conflicts on non-overlapping edits

---

## 12. Future Enhancements

- **Operational Transformation** for advanced conflict resolution
- **Persistent History** of all collaboration events
- **Granular Permissions** for read-only vs edit access
- **Collaboration Awareness** (show cursor positions, selections)
- **Undo/Redo** with multi-user awareness
- **Analytics** on collaboration patterns

---

## 13. Appendix: JSON Schema Examples

### TaskUpdateEvent

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "type", "userId", "timestamp", "payload"],
  "properties": {
    "id": { "type": "string", "pattern": "^evt-[a-z0-9]+$" },
    "type": { "enum": ["task_update"] },
    "userId": { "type": "string" },
    "timestamp": { "type": "integer", "minimum": 0 },
    "payload": {
      "type": "object",
      "required": ["taskId", "sprintId", "changes"],
      "properties": {
        "taskId": { "type": "string" },
        "sprintId": { "type": "string" },
        "changes": {
          "type": "object",
          "properties": {
            "description": { "type": "string" },
            "priority": { "type": "integer", "minimum": 0, "maximum": 3 },
            "assigneeId": { "type": ["string", "null"] },
            "status": { "enum": ["todo", "in_progress", "done"] }
          }
        }
      }
    }
  }
}
```

### ConflictEvent

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "type", "taskId", "field", "conflict"],
  "properties": {
    "id": { "type": "string" },
    "type": { "enum": ["conflict_detected"] },
    "taskId": { "type": "string" },
    "field": { "type": "string" },
    "conflict": {
      "type": "object",
      "required": ["localValue", "remoteValue", "localUser", "remoteUser"],
      "properties": {
        "localValue": { "type": "string" },
        "remoteValue": { "type": "string" },
        "localUser": { "type": "string" },
        "remoteUser": { "type": "string" },
        "localTimestamp": { "type": "integer" },
        "remoteTimestamp": { "type": "integer" }
      }
    }
  }
}
```

---

## Document Metadata

- **Version**: 1.0
- **Last Updated**: 2026-03-08
- **Author**: Carlos (Senior Developer)
- **Status**: Ready for Implementation
- **Approval**: Pending Ana review

---

## References

- TanStack Query Documentation: https://tanstack.com/query/latest
- WebSocket Best Practices: RFC 6455
- Conflict Resolution Patterns: https://en.wikipedia.org/wiki/Operational_transformation
- Previous Sprint Documentation: `/docs/OPTIMISTIC_MUTATIONS.md`
