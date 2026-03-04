import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { HookForm, HookFormInput, HookFormSelect } from '../index'

const settingsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
  theme: z.enum(['light', 'dark', 'auto'], {
    errorMap: () => ({ message: 'Please select a valid theme' }),
  }),
  notificationsEnabled: z.boolean().optional(),
  maxResults: z.number().min(1, 'Must be at least 1').max(100, 'Cannot exceed 100'),
})

type SettingsFormData = z.infer<typeof settingsSchema>

interface SettingsFormProps {
  onSubmit?: (data: SettingsFormData) => Promise<void> | void
  isLoading?: boolean
  initialData?: Partial<SettingsFormData>
}

export function SettingsForm({
  onSubmit,
  isLoading = false,
  initialData,
}: SettingsFormProps) {
  const { control, handleSubmit, formState } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      theme: initialData?.theme || 'auto',
      notificationsEnabled: initialData?.notificationsEnabled ?? true,
      maxResults: initialData?.maxResults || 50,
    },
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onFormSubmit = async (data: SettingsFormData) => {
    try {
      setError(null)
      setSuccess(false)
      setIsSubmitting(true)
      await onSubmit?.(data)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Settings</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Settings saved successfully!
        </div>
      )}

      <HookForm
        onSubmit={handleSubmit(onFormSubmit)}
        submitLabel="Save Settings"
        isLoading={isLoading || isSubmitting}
      >
        <HookFormInput
          control={control}
          name="fullName"
          label="Full Name"
          placeholder="Your full name"
          required
        />

        <HookFormInput
          control={control}
          name="email"
          label="Email Address"
          type="email"
          placeholder="your@email.com"
          required
        />

        <HookFormSelect
          control={control}
          name="theme"
          label="Theme"
          required
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' },
          ]}
        />

        <HookFormInput
          control={control}
          name="maxResults"
          label="Max Results Per Page"
          type="number"
          min="1"
          max="100"
          required
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            {...control.register('notificationsEnabled')}
          />
          <span>Enable notifications</span>
        </label>
      </HookForm>
    </div>
  )
}
