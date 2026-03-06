# useFormState Hook Documentation

## Overview

The `useFormState` hook is a comprehensive form state management solution built on top of TanStack Form. It provides:

- **Client-side validation** with Zod schemas
- **Async field validation** (e.g., email uniqueness checks)
- **Server-side validation error handling**
- **Form submission with loading states**
- **Field-level error management**
- **Type-safe form handling with TypeScript generics**

## Installation

The hook is available in `src/hooks/forms`:

```tsx
import { useFormState } from '@/hooks/forms'
```

## Basic Usage

### Simple Form with Validation

```tsx
import { useFormState } from '@/hooks/forms'
import { z } from 'zod'

// Define form schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { form, handleSubmit, getFieldError, isSubmitting } = useFormState<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    schema: loginSchema,
    onSubmit: async (data) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            fieldErrors: result.fieldErrors || {},
            serverError: result.message,
          }
        }

        // Success
        localStorage.setItem('token', result.token)
        return { success: true, data: result.user }
      } catch (error) {
        return {
          success: false,
          serverError: 'Network error. Please try again.',
        }
      }
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.state.values.email}
          onChange={(e) => form.setFieldValue('email', e.target.value)}
          onBlur={() => form.validateFieldIfNeeded('email')}
        />
        {getFieldError('email') && <span className="error">{getFieldError('email')}</span>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.state.values.password}
          onChange={(e) => form.setFieldValue('password', e.target.value)}
          onBlur={() => form.validateFieldIfNeeded('password')}
        />
        {getFieldError('password') && <span className="error">{getFieldError('password')}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

## Async Field Validation

Use async validators for operations like checking email uniqueness:

```tsx
import { useFormState } from '@/hooks/forms'
import { z } from 'zod'

const registrationSchema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username too short'),
  password: z.string().min(8, 'Password too short'),
})

type RegistrationFormData = z.infer<typeof registrationSchema>

export function RegistrationForm() {
  const { form, handleSubmit, getFieldError, isValidating } = useFormState<RegistrationFormData>({
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
    schema: registrationSchema,
    onSubmit: async (data) => {
      const response = await fetch('/api/forms/registration/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()

      return result.success
        ? { success: true, data: result.data }
        : { success: false, fieldErrors: result.fieldErrors, serverError: result.serverError }
    },
    // Async validators for server-side checks
    onAsyncValidate: {
      email: async (email) => {
        const response = await fetch('/api/validate/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const result = await response.json()
        return result.available ? undefined : result.message
      },
      username: async (username) => {
        const response = await fetch('/api/validate/username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })
        const result = await response.json()
        return result.available ? undefined : result.message
      },
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <div>
        <label>Email</label>
        <input
          value={form.state.values.email}
          onChange={(e) => form.setFieldValue('email', e.target.value)}
        />
        {isValidating && <span>Checking availability...</span>}
        {getFieldError('email') && <span className="error">{getFieldError('email')}</span>}
      </div>

      {/* Other fields... */}

      <button type="submit">Register</button>
    </form>
  )
}
```

## Error Handling

### Field-Level Errors

```tsx
const { getFieldError } = useFormState({...})

// Get specific field error
const emailError = getFieldError('email')
```

### Server Errors

```tsx
const { submitError, fieldErrors } = useFormState({...})

// Submit error from server
{submitError && <div className="error">{submitError}</div>}

// All field errors
Object.entries(fieldErrors).forEach(([field, errors]) => {
  console.log(`${field}: ${errors.join(', ')}`)
})
```

### Error Callbacks

```tsx
const { ... } = useFormState({
  // ... other config
  onError: (error) => {
    console.error('Form error:', error)
    // Show toast notification, analytics, etc.
  },
})
```

## Advanced Usage

### Custom Form Wrapper Component

```tsx
interface FormWrapperProps<T> {
  schema: z.ZodSchema
  defaultValues: T
  onSubmit: (data: T) => Promise<FormSubmissionResult<T>>
  onAsyncValidate?: Record<string, (value: unknown) => Promise<string | undefined>>
  children: (form: UseFormStateReturn<T>) => React.ReactNode
}

export function FormWrapper<T>({
  schema,
  defaultValues,
  onSubmit,
  onAsyncValidate,
  children,
}: FormWrapperProps<T>) {
  const form = useFormState({
    schema,
    defaultValues,
    onSubmit,
    onAsyncValidate,
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      {children(form)}
    </form>
  )
}

// Usage
<FormWrapper
  schema={mySchema}
  defaultValues={initialValues}
  onSubmit={handleSubmit}
>
  {(form) => (
    <>
      <input
        value={form.form.state.values.email}
        onChange={(e) => form.setFieldValue('email', e.target.value)}
      />
      {form.getFieldError('email') && <span>{form.getFieldError('email')}</span>}
    </>
  )}
</FormWrapper>
```

### Multi-Step Forms

```tsx
const [step, setStep] = useState(1)

const { form, handleSubmit, getFieldError } = useFormState({
  defaultValues: { ...allSteps },
  schema: completeSchema, // Validates entire form
  onSubmit: async (data) => {
    if (step < 3) {
      // Validate current step
      const stepSchema = z.object({...stepValidation})
      const result = stepSchema.safeParse(form.state.values)
      if (!result.success) {
        return { success: false, fieldErrors: {} }
      }
      setStep(step + 1)
      return { success: true }
    }
    // Final submission
    return submitToServer(data)
  },
})
```

## Type Safety

The hook is fully typed with TypeScript generics:

```tsx
// Infer types from schema
type FormData = z.infer<typeof schema>

const { form, ... } = useFormState<FormData>({
  schema,
  // Now TypeScript will catch errors on field names
  defaultValues: {
    email: '', // ✓ correct
    wrongField: '', // ✗ TypeScript error
  },
  // Type-safe field operations
  onSubmit: async (data: FormData) => {
    console.log(data.email) // ✓ valid
    console.log(data.wrongField) // ✗ TypeScript error
  },
})
```

## Testing

### Unit Test Example

```tsx
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFormState } from '@/hooks/forms'

describe('MyForm', () => {
  it('should submit form data', async () => {
    const mockOnSubmit = vi.fn(async () => ({
      success: true,
      data: { email: 'test@example.com' },
    }))

    const { result } = renderHook(() =>
      useFormState({
        defaultValues: { email: '' },
        schema: z.object({ email: z.string().email() }),
        onSubmit: mockOnSubmit,
      }),
    )

    act(() => {
      result.current.setFieldValue('email', 'test@example.com')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockOnSubmit).toHaveBeenCalledWith({ email: 'test@example.com' })
  })
})
```

## API Reference

### Configuration Options

```typescript
interface UseFormStateConfig<T> {
  // Initial form values
  defaultValues: T

  // Zod validation schema
  schema: ZodSchema

  // Submit handler (required)
  onSubmit: (data: T) => Promise<FormSubmissionResult<T>>

  // Async field validators (optional)
  onAsyncValidate?: Record<string, (value: unknown) => Promise<string | undefined>>

  // Error handler callback (optional)
  onError?: (error: Error | string) => void
}
```

### Return Values

```typescript
interface UseFormStateReturn<T> {
  // TanStack Form instance
  form: FormInstance<T>

  // State flags
  isSubmitting: boolean
  isValidating: boolean

  // Error state
  submitError: string | null
  fieldErrors: Record<string, string[]>

  // Methods
  handleSubmit: () => Promise<void>
  getFieldError: (fieldName: string) => string | undefined
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  reset: () => void
}
```

## MSW Mocks

The library includes MSW mock handlers for testing. Mock endpoints:

- `POST /api/forms/submit` - Generic form submission
- `POST /api/forms/:formType/submit` - Form-specific submission (registration, login, profile)
- `POST /api/validate/email` - Email uniqueness check
- `POST /api/validate/username` - Username uniqueness check
- `POST /api/validate/password` - Password strength validation

See `src/mocks/formSubmissionHandlers.ts` for implementation details.

## Best Practices

1. **Always define a schema** - Use Zod for type-safe validation
2. **Handle async errors** - Use `onError` callback for error tracking
3. **Validate on blur** - Call `form.validateFieldIfNeeded()` on blur for better UX
4. **Reset after success** - Use `form.reset()` to clear form after successful submission
5. **Show loading states** - Use `isSubmitting` and `isValidating` flags in UI
6. **Type inference** - Use `z.infer<typeof schema>` for automatic type safety

## Comparison with Alternatives

| Feature | useFormState | React Hook Form | Formik |
|---------|--------------|-----------------|--------|
| Bundle Size | Small | Small | Medium |
| TypeScript Support | Excellent | Good | Good |
| Server Validation | Built-in | Manual | Manual |
| Async Field Validation | Built-in | Manual | Manual |
| Performance | Excellent | Excellent | Good |
| Learning Curve | Low | Low | Medium |
| TanStack Form Integration | Native | Adapter | N/A |

## See Also

- [TanStack Form Documentation](https://tanstack.com/form/latest)
- [Zod Documentation](https://zod.dev)
- [Form Architecture Guide](./FORM_ABSTRACTION_GUIDE.md)
