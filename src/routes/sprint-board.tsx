import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sprint-board')({
  component: SprintBoardPage,
})

function SprintBoardPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900">Sprint Board</h2>
      <p className="mt-2 text-gray-600">Sprint board will be displayed here</p>
    </div>
  )
}
