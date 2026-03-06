import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { TextInput } from './TextInput'
import { Form } from './Form'

const meta: Meta<typeof TextInput> = {
  component: TextInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockField = (value = '', errors: string[] = []) => ({
  name: 'email',
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
    const field = mockField('', [])
    return (
      <TextInput
        field={field as any}
        label="Email"
        placeholder="Enter your email"
      />
    )
  },
}

export const WithHelpText: Story = {
  render: () => {
    const field = mockField('', [])
    return (
      <TextInput
        field={field as any}
        label="Email"
        placeholder="Enter your email"
        helpText="We'll never share your email with anyone"
      />
    )
  },
}

export const Password: Story = {
  render: () => {
    const field = mockField('', [])
    return (
      <TextInput
        field={field as any}
        label="Password"
        type="password"
        placeholder="Enter your password"
        helpText="Must be at least 8 characters long"
      />
    )
  },
}

export const Number: Story = {
  render: () => {
    const field = mockField('', [])
    return (
      <TextInput
        field={field as any}
        label="Age"
        type="number"
        placeholder="Enter your age"
        helpText="Must be 18 or older"
      />
    )
  },
}

export const WithError: Story = {
  render: () => {
    const field = mockField('invalid-email', ['Invalid email format'])
    return (
      <TextInput
        field={field as any}
        label="Email"
        placeholder="Enter your email"
      />
    )
  },
}

export const Filled: Story = {
  render: () => {
    const field = mockField('john@example.com', [])
    return (
      <TextInput
        field={field as any}
        label="Email"
        placeholder="Enter your email"
        value="john@example.com"
      />
    )
  },
}

export const InForm: Story = {
  render: () => {
    const schema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    })

    const form = useForm({
      defaultValues: {
        email: '',
        password: '',
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
      <Form form={form} submitLabel="Sign In">
        <form.Field name="email">
          {(field) => (
            <TextInput
              field={field}
              label="Email"
              placeholder="Enter your email"
              type="email"
              helpText="Enter your registered email address"
            />
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <TextInput
              field={field}
              label="Password"
              type="password"
              placeholder="Enter your password"
              helpText="8 characters minimum"
            />
          )}
        </form.Field>
      </Form>
    )
  },
}
