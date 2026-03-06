import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TextInput } from '../TextInput'

const createMockField = (value = '', errors = [] as string[]) => ({
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
  handleChange: vi.fn(),
  handleBlur: vi.fn(),
})

describe('TextInput Component', () => {
  it('renders input element', () => {
    const field = createMockField()

    render(<TextInput field={field as any} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    const field = createMockField()

    render(<TextInput field={field as any} label="Email" />)

    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('renders placeholder when provided', () => {
    const field = createMockField()

    render(<TextInput field={field as any} placeholder="Enter your email" />)

    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
  })

  it('supports different input types', () => {
    const field = createMockField()

    const { rerender } = render(<TextInput field={field as any} type="password" />)

    let input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.type).toBe('password')

    rerender(<TextInput field={field as any} type="email" />)
    input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.type).toBe('email')
  })

  it('displays validation errors', () => {
    const field = createMockField('', ['Email is required'])

    render(<TextInput field={field as any} label="Email" />)

    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('calls handleChange when value changes', () => {
    const mockHandleChange = vi.fn()
    const field = createMockField()
    field.handleChange = mockHandleChange

    render(<TextInput field={field as any} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test@example.com' } })

    expect(mockHandleChange).toHaveBeenCalledWith('test@example.com')
  })

  it('calls handleBlur on blur event', () => {
    const mockHandleBlur = vi.fn()
    const field = createMockField()
    field.handleBlur = mockHandleBlur

    render(<TextInput field={field as any} />)

    const input = screen.getByRole('textbox')
    fireEvent.blur(input)

    expect(mockHandleBlur).toHaveBeenCalled()
  })

  it('displays input value from field state', () => {
    const field = createMockField('john@example.com')

    render(<TextInput field={field as any} />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('john@example.com')
  })

  it('renders help text when provided', () => {
    const field = createMockField()

    render(
      <TextInput
        field={field as any}
        label="Email"
        helpText="We never share your email"
      />
    )

    expect(screen.getByText("We never share your email")).toBeInTheDocument()
  })

  it('supports number input type', () => {
    const mockHandleChange = vi.fn()
    const field = createMockField()
    field.handleChange = mockHandleChange

    render(<TextInput field={field as any} type="number" />)

    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input.type).toBe('number')

    fireEvent.change(input, { target: { value: '42' } })
    expect(mockHandleChange).toHaveBeenCalledWith(42)
  })

  it('handles empty number input', () => {
    const mockHandleChange = vi.fn()
    const field = createMockField()
    field.handleChange = mockHandleChange

    render(<TextInput field={field as any} type="number" />)

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '' } })
    expect(mockHandleChange).toHaveBeenCalledWith('')
  })
})
