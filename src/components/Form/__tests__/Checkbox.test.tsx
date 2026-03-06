import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Checkbox } from '../Checkbox'

const createMockField = (value = false, errors = [] as string[]) => ({
  name: 'agreeToTerms',
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

describe('Checkbox Component', () => {
  it('renders checkbox input', () => {
    const field = createMockField()

    render(<Checkbox field={field as any} />)

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    const field = createMockField()

    render(<Checkbox field={field as any} label="I agree to terms" />)

    expect(screen.getByText('I agree to terms')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    const field = createMockField()

    render(
      <Checkbox field={field as any} label="Agree" description="Please read our terms" />
    )

    expect(screen.getByText('Please read our terms')).toBeInTheDocument()
  })

  it('calls handleChange with boolean value when checked', () => {
    const mockHandleChange = vi.fn()
    const field = createMockField()
    field.handleChange = mockHandleChange

    render(<Checkbox field={field as any} label="Test" />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(mockHandleChange).toHaveBeenCalledWith(true)
  })

  it('displays validation errors', () => {
    const field = createMockField(false, ['You must agree to proceed'])

    render(<Checkbox field={field as any} label="Agree" />)

    expect(screen.getByText('You must agree to proceed')).toBeInTheDocument()
  })

  it('reflects checked state from field', () => {
    const field = createMockField(true)

    render(<Checkbox field={field as any} />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('calls handleBlur on blur', () => {
    const mockHandleBlur = vi.fn()
    const field = createMockField()
    field.handleBlur = mockHandleBlur

    render(<Checkbox field={field as any} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.blur(checkbox)

    expect(mockHandleBlur).toHaveBeenCalled()
  })

  it('supports indeterminate state', () => {
    const field = createMockField(false)

    const { container } = render(
      <Checkbox field={field as any} indeterminate />
    )

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkbox.indeterminate).toBe(true)
  })

  it('updates indeterminate state when prop changes', () => {
    const field = createMockField(false)

    const { container, rerender } = render(
      <Checkbox field={field as any} indeterminate={false} />
    )

    let checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkbox.indeterminate).toBe(false)

    rerender(<Checkbox field={field as any} indeterminate={true} />)
    checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkbox.indeterminate).toBe(true)
  })

  it('handles unchecked state correctly', () => {
    const field = createMockField(false)

    render(<Checkbox field={field as any} />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })
})
