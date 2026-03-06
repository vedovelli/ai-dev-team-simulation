import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { RHFInput } from './RHFInput'

const meta = {
  title: 'Forms/RHFInput',
  component: RHFInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RHFInput>

export default meta
type Story = StoryObj<typeof meta>

function RHFInputWrapper(props: any) {
  const { control } = useForm({
    defaultValues: {
      email: '',
    },
  })

  return (
    <div className="w-96">
      <RHFInput
        control={control}
        name="email"
        label="Email Address"
        type="email"
        placeholder="user@example.com"
        {...props}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => <RHFInputWrapper />,
}

export const WithHelperText: Story = {
  render: () => (
    <RHFInputWrapper helperText="We'll never share your email address" />
  ),
}

export const WithPlaceholder: Story = {
  render: () => (
    <RHFInputWrapper placeholder="Enter your email address" />
  ),
}

export const PasswordInput: Story = {
  render: () => {
    const { control } = useForm({
      defaultValues: {
        password: '',
      },
    })

    return (
      <div className="w-96">
        <RHFInput
          control={control}
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
        />
      </div>
    )
  },
}

export const NumberInput: Story = {
  render: () => {
    const { control } = useForm({
      defaultValues: {
        age: '',
      },
    })

    return (
      <div className="w-96">
        <RHFInput
          control={control}
          name="age"
          label="Age"
          type="number"
          placeholder="Enter your age"
        />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => <RHFInputWrapper disabled />,
}

export const Required: Story = {
  render: () => <RHFInputWrapper label="Email Address *" />,
}
