import { useForm } from '@tanstack/react-form'
import type { FieldApi } from '@tanstack/react-form'
import { useState } from 'react'
import { useCreateTeamMember } from '../hooks/useCreateTeamMember'
import type { CreateTeamMemberInput } from '../types/team'

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <span className="text-sm text-red-500">
          {field.state.meta.errors.join(', ')}
        </span>
      ) : null}
    </>
  )
}

export function TeamMemberForm({ onSuccess }: { onSuccess?: () => void }) {
  const mutation = useCreateTeamMember()
  const [formMessage, setFormMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const form = useForm<CreateTeamMemberInput>({
    defaultValues: {
      name: '',
      email: '',
      role: '',
    },
    onSubmit: async ({ value }) => {
      try {
        setFormMessage(null)
        await mutation.mutateAsync(value)
        form.reset()
        setFormMessage({
          type: 'success',
          text: 'Team member added successfully!',
        })
        onSuccess?.()
      } catch (error) {
        setFormMessage({
          type: 'error',
          text:
            error instanceof Error ? error.message : 'Failed to create member',
        })
      }
    },
  })

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-md">
      <h2 className="text-xl font-semibold text-white mb-4">
        Add Team Member
      </h2>

      {formMessage && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            formMessage.type === 'success'
              ? 'bg-green-900 text-green-100'
              : 'bg-red-900 text-red-100'
          }`}
        >
          {formMessage.text}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Name is required'
              if (value.length < 2) return 'Name must be at least 2 characters'
              return undefined
            },
          }}
          children={(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm text-white">
                Name
              </label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="John Doe"
                className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Email is required'
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              if (!emailRegex.test(value)) return 'Invalid email address'
              return undefined
            },
          }}
          children={(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm text-white">
                Email
              </label>
              <input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="john@example.com"
                className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        <form.Field
          name="role"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Role is required'
              const validRoles = [
                'Frontend Developer',
                'Backend Developer',
                'Full Stack Developer',
                'DevOps Engineer',
                'Product Manager',
                'Designer',
              ]
              if (!validRoles.includes(value))
                return 'Please select a valid role'
              return undefined
            },
          }}
          children={(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm text-white">
                Role
              </label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a role</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Designer">Designer</option>
              </select>
              <FieldInfo field={field} />
            </div>
          )}
        />

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-md font-medium transition-colors"
        >
          {mutation.isPending ? 'Adding...' : 'Add Member'}
        </button>
      </form>
    </div>
  )
}
