# Sprint Retrospective Data Layer Implementation Guide

## Overview

This guide documents the complete data infrastructure for sprint retrospective features, including types, MSW handlers, and TanStack Query hooks.

## Data Types

### RetroItemType
```typescript
type RetroItemType = 'went_well' | 'improvements' | 'action_item';
```

Three distinct retrospective item categories:
- `went_well` — positive feedback about the sprint
- `improvements` — areas needing improvement
- `action_item` — concrete action items with optional resolution tracking

### RetroItem
```typescript
interface RetroItem {
  id: string;
  sprintId: string;
  type: RetroItemType;
  text: string;
  author: Agent;
  votes: number;
  resolved?: boolean; // Only for action_item type
  createdAt: string;
  updatedAt: string;
}
```

Individual retrospective feedback entry with voting and resolution tracking for action items.

### SprintRetro
```typescript
interface SprintRetro {
  id: string;
  sprintId: string;
  items: RetroItem[];
  createdAt: string;
  updatedAt: string;
}
```

Container for all retrospective items for a specific sprint.

## Hooks

### useSprintRetro

Fetches retrospective data for a given sprint with caching and retry logic.

**Usage:**
```typescript
const { retro, isLoading, isError, refetch } = useSprintRetro(sprintId);
```

**Parameters:**
- `sprintId: string` — The sprint ID to fetch retro for

**Returns:**
- `retro: SprintRetro | undefined` — The retrospective data
- `isLoading: boolean` — Loading state
- `isError: boolean` — Error state
- `refetch: () => void` — Manual refetch function

**Cache Strategy:**
- Stale time: 5 minutes
- GC time: 10 minutes
- Retry: 3 attempts with exponential backoff (max 30s)

**Query Key:** `['sprints', sprintId, 'retro']`

### useRetroItemMutations

Provides mutations for creating, updating, deleting, and voting on retro items.

**Usage:**
```typescript
const {
  createItem,
  updateItem,
  deleteItem,
  voteItem,
  isCreating,
  isUpdating,
  isDeleting,
  isVoting,
} = useRetroItemMutations(sprintId);
```

**Parameters:**
- `sprintId: string` — The sprint ID for mutations

**Mutations:**

#### createItem
```typescript
createItem({ type: 'went_well', text: 'Great collaboration' });
```
- Creates a new retro item
- Optimistic update: immediately adds to cache
- Automatic invalidation on success

#### updateItem
```typescript
updateItem({ id: 'item-1', patch: { resolved: true } });
```
- Updates an existing retro item
- Supports partial updates (type, text, resolved)
- Optimistic update with rollback on error
- Automatic invalidation on success

#### deleteItem
```typescript
deleteItem('item-1');
```
- Removes a retro item
- Optimistic removal from cache
- Automatic invalidation on success

#### voteItem
```typescript
voteItem('item-1');
```
- Increments vote count for an item
- Optimistic vote increment
- Automatic invalidation on success

**Loading States:**
- `isCreating: boolean`
- `isUpdating: boolean`
- `isDeleting: boolean`
- `isVoting: boolean`

**Error Handling:**
- `createError`, `updateError`, `deleteError`, `voteError` available as `error` on each mutation
- All mutations support automatic rollback on error via optimistic updates

## MSW Endpoints

All endpoints simulate realistic delays of 100-300ms.

### GET /api/sprints/:sprintId/retro

Fetches the complete retrospective for a sprint.

**Response (200):**
```json
{
  "id": "retro-sprint-1",
  "sprintId": "sprint-1",
  "items": [
    {
      "id": "retro-item-1",
      "sprintId": "sprint-1",
      "type": "went_well",
      "text": "Great collaboration between frontend and backend teams",
      "author": { "id": "agent-1", "name": "Alice", "email": "alice@example.com" },
      "votes": 5,
      "createdAt": "2026-03-07T12:00:00Z",
      "updatedAt": "2026-03-07T12:00:00Z"
    }
  ],
  "createdAt": "2026-03-07T12:00:00Z",
  "updatedAt": "2026-03-07T12:00:00Z"
}
```

### POST /api/sprints/:sprintId/retro/items

Creates a new retro item for the sprint.

**Request:**
```json
{
  "type": "went_well",
  "text": "Great collaboration"
}
```

**Response (201):**
```json
{
  "id": "retro-item-123",
  "sprintId": "sprint-1",
  "type": "went_well",
  "text": "Great collaboration",
  "author": { "id": "agent-1", "name": "Alice", "email": "alice@example.com" },
  "votes": 0,
  "createdAt": "2026-03-14T10:30:00Z",
  "updatedAt": "2026-03-14T10:30:00Z"
}
```

### PUT /api/sprints/:sprintId/retro/items/:id

Updates an existing retro item.

**Request (supports partial updates):**
```json
{
  "text": "Updated text",
  "resolved": true
}
```

**Response (200):**
Updated RetroItem with changed fields and new `updatedAt` timestamp.

**Error Responses:**
- 404 — Item or sprint not found

### DELETE /api/sprints/:sprintId/retro/items/:id

Removes a retro item.

**Response (200):**
```json
{ "success": true }
```

**Error Responses:**
- 404 — Item or sprint not found

### PATCH /api/sprints/:sprintId/retro/items/:id/vote

Increments the vote count for a retro item.

**Response (200):**
Updated RetroItem with incremented `votes` and new `updatedAt` timestamp.

**Error Responses:**
- 404 — Item or sprint not found

## Optimistic Updates Pattern

All mutations use optimistic updates with automatic rollback:

1. **Mutate:** Optimistic cache update happens immediately
2. **Success:** Query invalidates for fresh server data
3. **Error:** Cache reverts to previous state automatically

Example flow for voting:
```typescript
// Before mutation
votes: 5

// Optimistic update (immediate UI)
votes: 6

// Success (refetch from server)
votes: 6 ✓

// Or error (rollback)
votes: 5
```

## Cache Invalidation

All mutations automatically invalidate the query with key `['sprints', sprintId, 'retro']` on success, ensuring data freshness.

## Integration Example

```typescript
import { useSprintRetro, useRetroItemMutations } from '@/hooks';

export function SprintRetroPanel({ sprintId }: { sprintId: string }) {
  const { retro, isLoading } = useSprintRetro(sprintId);
  const { createItem, voteItem, deleteItem } = useRetroItemMutations(sprintId);

  if (isLoading) return <div>Loading...</div>;
  if (!retro) return <div>No retro data</div>;

  return (
    <div>
      <h2>Sprint Retrospective</h2>
      <div>
        {retro.items.map((item) => (
          <div key={item.id}>
            <p>{item.text}</p>
            <button onClick={() => voteItem(item.id)}>
              👍 {item.votes}
            </button>
            <button onClick={() => deleteItem(item.id)}>Remove</button>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => {
        e.preventDefault();
        const text = new FormData(e.currentTarget).get('text') as string;
        createItem({ type: 'went_well', text });
      }}>
        <input type="text" name="text" placeholder="What went well?" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

## Files

- **Types:** `src/types/retro.ts`
- **Hooks:** `src/hooks/useSprintRetro.ts`, `src/hooks/useRetroItemMutations.ts`
- **MSW Handler:** `src/mocks/handlers/retro.ts`
- **Exports:** `src/hooks/index.ts`
