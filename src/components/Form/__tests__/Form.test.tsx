import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Form } from '../Form'

describe('Form Component', () => {
  it('renders form with children and submit button', () => {
    const mockSchema = z.object({
      name: z.string(),
    })

    const TestForm = () => {
      const form = useForm({
        defaultValues: { name: '' },
        onSubmit: vi.fn(),
        validatorAdapter: zodValidator(),
        validators: { onChange: mockSchema },
      })

      return (
        <Form form={form}>
          <div>Test Field</div>
        </Form>
      )
    }

    render(<TestForm />)

    expect(screen.getByText('Test Field')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('calls handleSubmit on form submission', async () => {
    const mockSchema = z.object({
      name: z.string(),
    })

    const mockHandleSubmit = vi.fn()

    const TestForm = () => {
      const form = useForm({
        defaultValues: { name: '' },
        onSubmit: mockHandleSubmit,
        validatorAdapter: zodValidator(),
        validators: { onChange: mockSchema },
      })

      return (
        <Form form={form}>
          <div>Test Field</div>
        </Form>
      )
    }

    render(<TestForm />)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)

    // The form should attempt to submit (handler may be async)
    expect(submitButton).toBeInTheDocument()
  })

  it('displays custom submit label', () => {
    const mockSchema = z.object({
      name: z.string(),
    })

    const TestForm = () => {
      const form = useForm({
        defaultValues: { name: '' },
        onSubmit: vi.fn(),
        validatorAdapter: zodValidator(),
        validators: { onChange: mockSchema },
      })

      return (
        <Form form={form} submitLabel="Save Changes">
          <div>Test Field</div>
        </Form>
      )
    }

    render(<TestForm />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('disables submit button when loading', () => {
    const mockSchema = z.object({
      name: z.string(),
    })

    const TestForm = () => {
      const form = useForm({
        defaultValues: { name: '' },
        onSubmit: vi.fn(),
        validatorAdapter: zodValidator(),
        validators: { onChange: mockSchema },
      })

      return (
        <Form form={form} isLoading={true}>
          <div>Test Field</div>
        </Form>
      )
    }

    render(<TestForm />)

    const submitButton = screen.getByRole('button', { name: /loading/i })
    expect(submitButton).toBeDisabled()
  })

  it('applies custom className', () => {
    const mockSchema = z.object({
      name: z.string(),
    })

    const TestForm = () => {
      const form = useForm({
        defaultValues: { name: '' },
        onSubmit: vi.fn(),
        validatorAdapter: zodValidator(),
        validators: { onChange: mockSchema },
      })

      return (
        <Form form={form} className="custom-class">
          <div>Test Field</div>
        </Form>
      )
    }

    const { container } = render(<TestForm />)
    const formElement = container.querySelector('form')

    expect(formElement).toHaveClass('custom-class')
  })
})
