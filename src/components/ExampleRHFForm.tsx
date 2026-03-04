import { useForm, useFieldArray, FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { RHFInput, RHFSelect, RHFTextarea, RHFCheckbox } from './RHFComponents'
import { FormErrorBoundary } from './FormErrorBoundary'

// Define validation schema using Zod
const userProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  bio: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms',
  }),
  skills: z.array(
    z.object({
      name: z.string().min(1, 'Skill name is required'),
      level: z.string().min(1, 'Level is required'),
    })
  ).min(1, 'Add at least one skill'),
})

type UserProfileFormData = z.infer<typeof userProfileSchema>

/**
 * Example form demonstrating React Hook Form abstraction with:
 * - Generic form hook wrapper
 * - Error boundary pattern
 * - Field arrays for dynamic fields
 * - TypeScript-first approach
 * - MSW integration for submission
 *
 * @example
 * ```tsx
 * <FormErrorBoundary>
 *   <ExampleRHFForm />
 * </FormErrorBoundary>
 * ```
 */
export function ExampleRHFForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: '',
      email: '',
      bio: '',
      role: '',
      agreeToTerms: false,
      skills: [{ name: '', level: 'beginner' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skills',
  })

  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const onSubmit = async (data: UserProfileFormData) => {
    try {
      const response = await fetch('/api/forms/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setSubmitMessage({
          type: 'error',
          text: result.error || 'Failed to submit form',
        })
        return
      }

      setSubmitMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      })
      reset()
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: 'An error occurred. Please try again.',
      })
    }
  }

  return (
    <FormErrorBoundary>
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">User Profile Form</h1>

        {submitMessage && (
          <div
            className={`mb-4 p-4 rounded-md ${
              submitMessage.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {submitMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <RHFInput
            control={control}
            name="name"
            label="Full Name"
            placeholder="John Doe"
            type="text"
          />

          <RHFInput
            control={control}
            name="email"
            label="Email Address"
            placeholder="john@example.com"
            type="email"
          />

          <RHFSelect
            control={control}
            name="role"
            label="Role"
            options={[
              { value: 'developer', label: 'Developer' },
              { value: 'designer', label: 'Designer' },
              { value: 'manager', label: 'Manager' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <RHFTextarea
            control={control}
            name="bio"
            label="Bio (Optional)"
            placeholder="Tell us about yourself"
            rows={4}
          />

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Skills</label>
              <button
                type="button"
                onClick={() => append({ name: '', level: 'beginner' })}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add Skill
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <RHFInput
                      control={control}
                      name={`skills.${index}.name`}
                      placeholder="Skill name"
                      type="text"
                    />
                  </div>
                  <div className="flex-1">
                    <RHFSelect
                      control={control}
                      name={`skills.${index}.level`}
                      options={[
                        { value: 'beginner', label: 'Beginner' },
                        { value: 'intermediate', label: 'Intermediate' },
                        { value: 'advanced', label: 'Advanced' },
                        { value: 'expert', label: 'Expert' },
                      ]}
                    />
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.skills && (
              <p className="mt-2 text-sm text-red-600">{errors.skills.message}</p>
            )}
          </div>

          <RHFCheckbox
            control={control}
            name="agreeToTerms"
            label="I agree to the terms and conditions"
          />

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </FormErrorBoundary>
  )
}
