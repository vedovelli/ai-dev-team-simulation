/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useActivityFeed } from '../hooks/useActivityFeed'
import { ActivityFeed } from '../components/ActivityFeed'

export const Route = createFileRoute('/feed')({
  component: FeedPage,
})

function FeedPage() {
  const { data: events = [], isLoading, isError } = useActivityFeed()

  return (
    <ActivityFeed
      events={events}
      isLoading={isLoading}
      isError={isError}
    />
  )
}
