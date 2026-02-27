import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tasks')({
  component: TasksPage,
})

function TasksPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
      <p className="mt-2 text-gray-600">Tasks list will be displayed here</p>
    </div>
  )
}
