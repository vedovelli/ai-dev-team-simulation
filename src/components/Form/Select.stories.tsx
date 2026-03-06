import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Select } from './Select'
import { Form } from './Form'

const meta: Meta<typeof Select> = {
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockField = (value = '', errors: string[] = []) => ({
  name: 'status',
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

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const tagsOptions = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'database', label: 'Database' },
  { value: 'devops', label: 'DevOps' },
  { value: 'testing', label: 'Testing' },
]

export const Default: Story = {
  render: () => {
    const field = mockField('', [])
    return (
      <Select
        field={field as any}
        label="Status"
        options={statusOptions}
        placeholder="Select a status"
      />
    )
  },
}

export const WithHelpText: Story = {
  render: () => {
    const field = mockField('', [])
    return (
      <Select
        field={field as any}
        label="Priority"
        options={priorityOptions}
        placeholder="Select priority level"
        helpText="Choose the priority level for this task"
      />
    )
  },
}

export const Filled: Story = {
  render: () => {
    const field = mockField('active', [])
    return (
      <Select
        field={field as any}
        label="Status"
        options={statusOptions}
        placeholder="Select a status"
      />
    )
  },
}

export const WithError: Story = {
  render: () => {
    const field = mockField('', ['Status is required'])
    return (
      <Select
        field={field as any}
        label="Status"
        options={statusOptions}
        placeholder="Select a status"
      />
    )
  },
}

export const MultiSelect: Story = {
  render: () => {
    const field = mockField([], [])
    return (
      <Select
        field={field as any}
        label="Tags"
        options={tagsOptions}
        multiple
        helpText="Select one or more tags"
      />
    )
  },
}

export const MultiSelectFilled: Story = {
  render: () => {
    const field = mockField(['frontend', 'backend'], [])
    return (
      <Select
        field={field as any}
        label="Tags"
        options={tagsOptions}
        multiple
        helpText="Select one or more tags"
      />
    )
  },
}

export const InForm: Story = {
  render: () => {
    const schema = z.object({
      status: z.string().min(1, 'Status is required'),
      priority: z.string().min(1, 'Priority is required'),
      tags: z.array(z.string()).min(1, 'Select at least one tag'),
    })

    const form = useForm({
      defaultValues: {
        status: '',
        priority: '',
        tags: [],
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
      <Form form={form} submitLabel="Save">
        <form.Field name="status">
          {(field) => (
            <Select
              field={field}
              label="Status"
              options={statusOptions}
              placeholder="Select a status"
              helpText="Current status of the item"
            />
          )}
        </form.Field>
        <form.Field name="priority">
          {(field) => (
            <Select
              field={field}
              label="Priority"
              options={priorityOptions}
              placeholder="Select priority"
              helpText="Priority level for this task"
            />
          )}
        </form.Field>
        <form.Field name="tags">
          {(field) => (
            <Select
              field={field}
              label="Tags"
              options={tagsOptions}
              multiple
              helpText="Select relevant tags"
            />
          )}
        </form.Field>
      </Form>
    )
  },
}
