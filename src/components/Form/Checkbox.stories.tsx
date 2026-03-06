import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Checkbox } from './Checkbox'
import { Form } from './Form'

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockField = (value = false, errors: string[] = []) => ({
  name: 'agree',
  state: {
    value,
    meta: {
      errors,
      isTouched: false,
      isDirty: false,
      isValidating: false,
    },
  },
  handleChange: () => {},
  handleBlur: () => {},
})

export const Default: Story = {
  render: () => {
    const field = mockField(false, [])
    return (
      <Checkbox field={field as any} label="I agree to the terms and conditions" />
    )
  },
}

export const WithDescription: Story = {
  render: () => {
    const field = mockField(false, [])
    return (
      <Checkbox
        field={field as any}
        label="Subscribe to newsletter"
        description="Receive updates about new features and announcements"
      />
    )
  },
}

export const Checked: Story = {
  render: () => {
    const field = mockField(true, [])
    return (
      <Checkbox
        field={field as any}
        label="I agree to the terms and conditions"
      />
    )
  },
}

export const WithError: Story = {
  render: () => {
    const field = mockField(false, ['You must agree to continue'])
    return (
      <Checkbox
        field={field as any}
        label="I agree to the terms and conditions"
      />
    )
  },
}

export const Indeterminate: Story = {
  render: () => {
    const field = mockField(false, [])
    return (
      <Checkbox
        field={field as any}
        label="Select all items"
        description="Indeterminate state shown as mixed selection"
        indeterminate
      />
    )
  },
}

export const MultipleCheckboxes: Story = {
  render: () => {
    const field1 = mockField(true, [])
    const field2 = mockField(false, [])
    const field3 = mockField(true, [])

    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Permissions</h3>
        <Checkbox
          field={field1 as any}
          label="Read access"
          description="Can view and download files"
        />
        <Checkbox
          field={field2 as any}
          label="Write access"
          description="Can create and edit files"
        />
        <Checkbox
          field={field3 as any}
          label="Admin access"
          description="Full control over workspace"
        />
      </div>
    )
  },
}

export const InForm: Story = {
  render: () => {
    const schema = z.object({
      agreeTerms: z.boolean().refine((val) => val === true, {
        message: 'You must agree to the terms and conditions',
      }),
      newsletter: z.boolean(),
      notifications: z.boolean(),
    })

    const form = useForm({
      defaultValues: {
        agreeTerms: false,
        newsletter: true,
        notifications: false,
      },
      onSubmit: async ({ value }) => {
        console.log('Form submitted:', value)
      },
      validatorAdapter: zodValidator(),
      validators: {
        onChange: schema,
      },
    })

    return (
      <Form form={form} submitLabel="Create Account">
        <form.Field name="agreeTerms">
          {(field) => (
            <Checkbox
              field={field}
              label="I agree to the terms and conditions"
            />
          )}
        </form.Field>
        <form.Field name="newsletter">
          {(field) => (
            <Checkbox
              field={field}
              label="Subscribe to our newsletter"
              description="Receive monthly updates and announcements"
            />
          )}
        </form.Field>
        <form.Field name="notifications">
          {(field) => (
            <Checkbox
              field={field}
              label="Enable notifications"
              description="Get alerts for important updates"
            />
          )}
        </form.Field>
      </Form>
    )
  },
}
