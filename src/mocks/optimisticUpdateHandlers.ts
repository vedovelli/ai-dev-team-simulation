import { http, HttpResponse } from 'msw'

/**
 * Mock handlers for testing optimistic updates and error scenarios
 * These handlers demonstrate both success and failure cases for mutations
 */

// In-memory store for demo data
let demoItemsStore = [
  { id: '1', title: 'Item 1', description: 'First item', updatedAt: new Date().toISOString() },
  { id: '2', title: 'Item 2', description: 'Second item', updatedAt: new Date().toISOString() },
  { id: '3', title: 'Item 3', description: 'Third item', updatedAt: new Date().toISOString() },
]

export const optimisticUpdateHandlers = [
  /**
   * GET /api/items - Fetch paginated items
   * Query params: page=1&pageSize=10
   * Response: { data: Item[], total: number, page: number, pageSize: number, totalPages: number }
   */
  http.get('/api/items', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10)

    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedData = demoItemsStore.slice(start, end)
    const total = demoItemsStore.length
    const totalPages = Math.ceil(total / pageSize)

    return HttpResponse.json({
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages,
    })
  }),

  /**
   * GET /api/items/:id - Fetch single item
   * Response: Item
   */
  http.get('/api/items/:id', ({ params }) => {
    const item = demoItemsStore.find((i) => i.id === params.id)

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    return HttpResponse.json(item)
  }),

  /**
   * POST /api/items - Create new item
   * Body: { title: string, description: string }
   * Response: Item
   */
  http.post('/api/items', async ({ request }) => {
    const body = (await request.json()) as { title: string; description: string }

    // Validation error scenario
    if (!body.title || body.title.trim().length === 0) {
      return HttpResponse.json(
        { message: 'Title is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const newItem = {
      id: `${Date.now()}`,
      title: body.title,
      description: body.description || '',
      updatedAt: new Date().toISOString(),
    }

    demoItemsStore.push(newItem)
    return HttpResponse.json(newItem, { status: 201 })
  }),

  /**
   * PATCH /api/items/:id - Update item (optimistic update scenario)
   * Body: { title?: string, description?: string }
   * Response: Item
   * Can fail if item ID is "fail-mutation" to test error rollback
   */
  http.patch('/api/items/:id', async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as { title?: string; description?: string }

    // Simulate mutation failure for testing rollback
    if (id === 'fail-mutation') {
      return HttpResponse.json(
        { message: 'Network error: server temporarily unavailable', code: 'SERVER_ERROR' },
        { status: 500 }
      )
    }

    const itemIndex = demoItemsStore.findIndex((i) => i.id === id)

    if (itemIndex === -1) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    // Validation error
    if (body.title !== undefined && body.title.trim().length === 0) {
      return HttpResponse.json(
        { message: 'Title cannot be empty', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const updatedItem = {
      ...demoItemsStore[itemIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    demoItemsStore[itemIndex] = updatedItem
    return HttpResponse.json(updatedItem)
  }),

  /**
   * DELETE /api/items/:id - Delete item
   * Response: { success: boolean }
   * Can fail if item ID is "fail-delete" to test error scenarios
   */
  http.delete('/api/items/:id', ({ params }) => {
    const { id } = params

    // Simulate deletion failure for testing error handling
    if (id === 'fail-delete') {
      return HttpResponse.json(
        { message: 'Failed to delete item', code: 'DELETE_ERROR' },
        { status: 500 }
      )
    }

    const itemIndex = demoItemsStore.findIndex((i) => i.id === id)

    if (itemIndex === -1) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    demoItemsStore.splice(itemIndex, 1)
    return HttpResponse.json({ success: true })
  }),

  /**
   * POST /api/items/batch - Batch update items (demonstrates cache invalidation)
   * Body: { ids: string[], title?: string }
   * Response: { updated: Item[] }
   */
  http.post('/api/items/batch', async ({ request }) => {
    const body = (await request.json()) as { ids: string[]; title?: string }

    if (!body.ids || body.ids.length === 0) {
      return HttpResponse.json({ message: 'No items to update' }, { status: 400 })
    }

    const updated = demoItemsStore
      .filter((item) => body.ids.includes(item.id))
      .map((item) => ({
        ...item,
        ...(body.title ? { title: body.title } : {}),
        updatedAt: new Date().toISOString(),
      }))

    // Update store
    updated.forEach((updatedItem) => {
      const index = demoItemsStore.findIndex((i) => i.id === updatedItem.id)
      if (index !== -1) {
        demoItemsStore[index] = updatedItem
      }
    })

    return HttpResponse.json({ updated })
  }),

  /**
   * Reset handler for testing - clears and resets the mock store
   */
  http.post('/api/__test/reset', () => {
    demoItemsStore = [
      { id: '1', title: 'Item 1', description: 'First item', updatedAt: new Date().toISOString() },
      { id: '2', title: 'Item 2', description: 'Second item', updatedAt: new Date().toISOString() },
      { id: '3', title: 'Item 3', description: 'Third item', updatedAt: new Date().toISOString() },
    ]
    return HttpResponse.json({ success: true })
  }),
]
