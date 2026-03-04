import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useInfiniteScroll, type PaginatedCursorResponse } from '../hooks/useInfiniteScroll'

interface Item {
  id: string
  title: string
  description: string
  createdAt: string
}

async function fetchItems(cursor: string | null): Promise<PaginatedCursorResponse<Item>> {
  const params = new URLSearchParams()
  if (cursor) {
    params.append('cursor', cursor)
  }
  params.append('pageSize', '10')

  const response = await fetch(`/api/items/paginated?${params}`)
  if (!response.ok) {
    const statusText = response.statusText || `HTTP ${response.status}`
    throw new Error(`Failed to fetch items: ${statusText}`)
  }
  return response.json()
}

export function InfiniteScrollDemo() {
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteScroll<Item>({
    queryKey: ['infinite-items'],
    queryFn: fetchItems,
    pageSize: 10,
  })

  const observerTarget = useRef<HTMLDivElement>(null)

  // Use a stable callback to avoid race conditions from changing fetchNextPage
  const handleIntersection = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleIntersection()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [handleIntersection])

  if (isPending) {
    return <div className="p-4 text-center">Loading items...</div>
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-600">
        Error loading items: {error?.message}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Infinite Scroll Demo</h2>

      <div className="space-y-4">
        {data.map((item) => (
          <div
            key={item.id}
            className="p-4 border border-gray-300 rounded-lg bg-white hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-gray-600">{item.description}</p>
            <p className="text-sm text-gray-400 mt-2">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Intersection observer target */}
      <div ref={observerTarget} className="py-8 text-center">
        {isFetchingNextPage && (
          <p className="text-gray-500">Loading more items...</p>
        )}
        {!hasNextPage && data.length > 0 && (
          <p className="text-gray-500">No more items to load</p>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-700">
          Loaded {data.length} items • {hasNextPage ? 'More items available' : 'All items loaded'}
        </p>
      </div>
    </div>
  )
}
