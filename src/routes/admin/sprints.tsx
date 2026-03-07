import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { SprintFormDialog } from '../../components/SprintFormDialog/SprintFormDialog'
import { useSprintsQuery } from '../../hooks/queries/useSprintsQuery'
import { useCreateSprint } from '../../hooks/mutations/useCreateSprint'
import { useUpdateSprint } from '../../hooks/mutations/useUpdateSprint'
import { useToastApi } from '../../hooks/useToastApi'
import type { Sprint } from '../../types/sprint'

function AdminSprintsPage() {
  const { data: sprintsData, isLoading } = useSprintsQuery(1, 100)
  const createMutation = useCreateSprint()
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedSprint, setSelectedSprint] = useState<Sprint | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { showSuccess, showError } = useToastApi()
  const updateMutation = useUpdateSprint(selectedSprint?.id || '')

  const sprints = sprintsData?.data || []

  const handleCreateClick = () => {
    setSelectedSprint(undefined)
    setDialogMode('create')
    setIsDialogOpen(true)
  }

  const handleEditClick = (sprint: Sprint) => {
    setSelectedSprint(sprint)
    setDialogMode('edit')
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedSprint(undefined)
  }

  const handleFormSubmit = async (data: {
    name: string
    goals: string
    status: 'planning' | 'active' | 'completed'
    estimatedPoints: number
    startDate?: string
    endDate?: string
  }) => {
    try {
      if (dialogMode === 'create') {
        await createMutation.mutateAsync(data)
        showSuccess('Sprint created successfully')
      } else {
        await updateMutation.mutateAsync(data)
        showSuccess('Sprint updated successfully')
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An error occurred'
      showError(message)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sprint Management</h1>
            <p className="text-gray-600 mt-1">Create and manage sprints</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Create Sprint
          </button>
        </div>

        {/* Sprints List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-400">Loading sprints...</p>
          </div>
        ) : sprints.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No sprints yet</p>
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create your first sprint
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sprints.map((sprint) => (
              <div
                key={sprint.id}
                className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sprint.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        sprint.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : sprint.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {sprint.status}
                    </span>
                  </div>
                  {sprint.goals && (
                    <p className="text-gray-600 text-sm mb-2">{sprint.goals}</p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>{sprint.taskCount} tasks</span>
                    <span>{sprint.estimatedPoints} points</span>
                    {sprint.startDate && <span>Starts: {sprint.startDate}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleEditClick(sprint)}
                  className="px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-sm"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sprint Form Dialog */}
      <SprintFormDialog
        isOpen={isDialogOpen}
        mode={dialogMode}
        sprint={selectedSprint}
        onClose={handleDialogClose}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}

export const Route = createFileRoute('/admin/sprints')({
  component: () => (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-400">Loading sprints...</p>
        </div>
      }
    >
      <AdminSprintsPage />
    </Suspense>
  ),
})
