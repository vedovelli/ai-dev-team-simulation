import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { useState } from 'react'
import { z } from 'zod'
import { TextInput } from './Form/TextInput'
import { Select } from './Form/Select'
import { Checkbox } from './Form/Checkbox'
import { Form } from './Form/Form'

const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  fontSize: z.number().min(12).max(24).default(14),
  itemsPerPage: z.number().min(5).max(100).default(20),
  emailNotifications: z.boolean().default(true),
  slackNotifications: z.boolean().default(false),
  notificationChannels: z.array(z.string()).min(1, 'Select at least one notification channel'),
  language: z.enum(['en', 'es', 'fr', 'de']).default('en'),
  compactMode: z.boolean().default(false),
  showHints: z.boolean().default(true),
})

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>

interface UserPreferencesFormProps {
  initialData?: Partial<UserPreferencesInput>
  onSubmit: (data: UserPreferencesInput) => Promise<void> | void
  isLoading?: boolean
}

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto (System)' },
]

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
]

const notificationChannelOptions = [
  { value: 'email', label: 'Email' },
  { value: 'slack', label: 'Slack' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push Notification' },
]

export function UserPreferencesForm({
  initialData,
  onSubmit,
  isLoading = false,
}: UserPreferencesFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UserPreferencesInput>({
    defaultValues: {
      theme: initialData?.theme ?? 'auto',
      fontSize: initialData?.fontSize ?? 14,
      itemsPerPage: initialData?.itemsPerPage ?? 20,
      emailNotifications: initialData?.emailNotifications ?? true,
      slackNotifications: initialData?.slackNotifications ?? false,
      notificationChannels: initialData?.notificationChannels ?? ['email'],
      language: initialData?.language ?? 'en',
      compactMode: initialData?.compactMode ?? false,
      showHints: initialData?.showHints ?? true,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(false)
      try {
        await onSubmit(value)
        setSubmitSuccess(true)
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'Failed to save preferences'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: userPreferencesSchema,
    },
  })

  return (
    <div className="space-y-6">
      {submitSuccess && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          Preferences saved successfully!
        </div>
      )}

      {submitError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {submitError}
        </div>
      )}

      <Form
        form={form}
        submitLabel="Save Preferences"
        isLoading={isSubmitting || isLoading}
      >
        <fieldset disabled={isSubmitting || isLoading} className="space-y-6">
          <div>
            <h3 className="mb-4 text-sm font-semibold">Appearance</h3>
            <div className="space-y-4">
              <form.Field name="theme">
                {(field) => (
                  <Select
                    field={field}
                    label="Theme"
                    options={themeOptions}
                    helpText="Choose your preferred color scheme"
                  />
                )}
              </form.Field>

              <form.Field name="fontSize">
                {(field) => (
                  <TextInput
                    field={field}
                    label="Font Size"
                    type="number"
                    helpText="Size in pixels (12-24)"
                  />
                )}
              </form.Field>

              <form.Field name="language">
                {(field) => (
                  <Select
                    field={field}
                    label="Language"
                    options={languageOptions}
                    helpText="Interface language preference"
                  />
                )}
              </form.Field>

              <form.Field name="compactMode">
                {(field) => (
                  <Checkbox
                    field={field}
                    label="Compact Mode"
                    description="Reduces spacing and padding throughout the interface"
                  />
                )}
              </form.Field>

              <form.Field name="showHints">
                {(field) => (
                  <Checkbox
                    field={field}
                    label="Show Helpful Hints"
                    description="Display tooltips and guidance throughout the application"
                  />
                )}
              </form.Field>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Content</h3>
            <div className="space-y-4">
              <form.Field name="itemsPerPage">
                {(field) => (
                  <TextInput
                    field={field}
                    label="Items Per Page"
                    type="number"
                    helpText="How many items to display per page (5-100)"
                  />
                )}
              </form.Field>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Notifications</h3>
            <div className="space-y-4">
              <form.Field name="notificationChannels">
                {(field) => (
                  <Select
                    field={field}
                    label="Notification Channels"
                    options={notificationChannelOptions}
                    multiple
                    helpText="Select how you want to receive notifications"
                  />
                )}
              </form.Field>

              <form.Field name="emailNotifications">
                {(field) => (
                  <Checkbox
                    field={field}
                    label="Email Notifications"
                    description="Receive important updates via email"
                  />
                )}
              </form.Field>

              <form.Field name="slackNotifications">
                {(field) => (
                  <Checkbox
                    field={field}
                    label="Slack Notifications"
                    description="Get notifications in your Slack workspace"
                  />
                )}
              </form.Field>
            </div>
          </div>
        </fieldset>
      </Form>
    </div>
  )
}
