import React from 'react'
import { useUsersQuery, useUserQuery } from '../hooks/queries/useUserQuery'
import { useProjects, useProject } from '../hooks/queries/projects'
import { ErrorBoundary } from '../components/ErrorBoundary'

/**
 * Example component demonstrating TanStack Query hooks for users and projects.
 * Shows how to handle loading, error, and success states from custom hooks.
 * Uses the new useUserQuery hook for better caching and invalidation.
 */
export function UserProjectsExample() {
  return (
    <ErrorBoundary>
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Users & Projects Example</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AllUsersSection />
          <AllProjectsSection />
        </div>

        <div className="mt-8">
          <SingleUserExample userId="user-1" />
        </div>

        <div className="mt-8">
          <SingleProjectExample projectId="project-1" />
        </div>
      </div>
    </ErrorBoundary>
  )
}

/**
 * Demonstrates useUsersQuery hook with loading and error states
 */
function AllUsersSection() {
  const { data: users, isLoading, isError, error } = useUsersQuery()

  if (isLoading) {
    return (
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <div className="text-blue-600">Loading users...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <div className="text-red-600">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
      <h2 className="text-xl font-semibold mb-4">All Users ({users?.length || 0})</h2>
      <ul className="space-y-2">
        {users?.map((user) => (
          <li key={user.id} className="bg-white p-3 rounded">
            <div className="font-semibold">{user.name}</div>
            <div className="text-sm text-gray-600">{user.email}</div>
            <div className="text-sm text-gray-500">{user.role}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Demonstrates useProjects hook with loading and error states
 */
function AllProjectsSection() {
  const { data: projects, isLoading, isError, error } = useProjects()

  if (isLoading) {
    return (
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4">All Projects</h2>
        <div className="text-blue-600">Loading projects...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <h2 className="text-xl font-semibold mb-4">All Projects</h2>
        <div className="text-red-600">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
      <h2 className="text-xl font-semibold mb-4">All Projects ({projects?.length || 0})</h2>
      <ul className="space-y-2">
        {projects?.map((project) => (
          <li key={project.id} className="bg-white p-3 rounded">
            <div className="font-semibold">{project.name}</div>
            <div className="text-sm text-gray-600">{project.description}</div>
            <div className="text-xs text-gray-500 mt-1">Status: {project.status}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Demonstrates useUserQuery hook (single user by ID) with loading and error states.
 * Also shows how to use the invalidate function for cache invalidation.
 */
function SingleUserExample({ userId }: { userId: string }) {
  const { data: user, isLoading, isError, error, invalidate } = useUserQuery(userId)

  return (
    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
      <h2 className="text-xl font-semibold mb-4">Single User Example (ID: {userId})</h2>

      {isLoading && <div className="text-purple-600">Loading user...</div>}

      {isError && (
        <div className="text-red-600">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {user && (
        <div className="bg-white p-4 rounded">
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          <p>
            <strong>Status:</strong> {user.status}
          </p>
          <button
            onClick={() => invalidate()}
            className="mt-4 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Demonstrates useProject hook (single project by ID) with loading and error states
 */
function SingleProjectExample({ projectId }: { projectId: string }) {
  const { data: project, isLoading, isError, error } = useProject(projectId)

  return (
    <div className="bg-cyan-50 p-6 rounded-lg border border-cyan-200">
      <h2 className="text-xl font-semibold mb-4">Single Project Example (ID: {projectId})</h2>

      {isLoading && <div className="text-cyan-600">Loading project...</div>}

      {isError && (
        <div className="text-red-600">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {project && (
        <div className="bg-white p-4 rounded">
          <p>
            <strong>Name:</strong> {project.name}
          </p>
          <p>
            <strong>Description:</strong> {project.description}
          </p>
          <p>
            <strong>Status:</strong> {project.status}
          </p>
          <p>
            <strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  )
}
