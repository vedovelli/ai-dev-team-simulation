# Reusable Form Validation Pattern

A comprehensive form validation architecture supporting sync validators, async validators with debouncing, typed errors, and multiple error display variants.

## Overview

The form validation pattern provides:

- **`useFormValidation`**: Custom hook for managing form validation state and logic
- **`FormError`**: Component for displaying validation errors in multiple styles
- **MSW Handlers**: Mock server endpoints for async validation testing

## Core Concepts

### Validators

Validators are functions that check field values and return either `true` (valid) or a string error message.

```typescript
// Sync validator
const syncValidator = (value: string): true | string => {
  if (!value) return 'This field is required'
  if (value.length < 3) return 'Minimum 3 characters'
  return true
}

// Async validator (e.g., checking server)
const asyncValidator = async (email: string): Promise<true | string> => {
  const response = await fetch('/api/validate/email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
  const result = await response.json()
  return result.available ? true : 'Email already registered'
}
```

### Field Configuration

Each field can have multiple sync validators, async validators, and a debounce delay:

```typescript
interface FieldValidation {
  sync?: SyncValidator[]        // Array of sync validators
  async?: AsyncValidator[]      // Array of async validators
  debounce?: number             // Milliseconds to debounce async (default: 300)
}
```

### Validation State

The hook manages typed validation state:

```typescript
interface FormValidationState {
  errors: Record<string, string[]>           // Field errors
  isValidating: Record<string, boolean>       // Currently validating
  isDirty: Record<string, boolean>            // User has interacted
}
```

## Usage

### Basic Setup

```typescript
import { useFormValidation } from '@/hooks/forms'

function SignupForm() {
  const { state, validateField, getFieldErrors } = useFormValidation({
    validators: {
      email: {
        sync: [
          (value) => !value ? 'Email is required' : true,
          (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? true
            : 'Invalid email format',
        ],
        async: [
          async (value) => {
            const response = await fetch('/api/validate/email', {
              method: 'POST',
              body: JSON.stringify({ email: value }),
            })
            const { available } = await response.json()
            return available ? true : 'Email already registered'
          },
        ],
        debounce: 500,
      },
    },
  })

  const handleEmailChange = async (email: string) => {
    await validateField('email', email)
  }

  return (
    <div>
      <input
        type="email"
        onChange={(e) => handleEmailChange(e.target.value)}
        onBlur={() => markFieldDirty('email')}
      />
      {getFieldErrors('email').length > 0 && (
        <FormError errors={getFieldErrors('email')} />
      )}
    </div>
  )
}
```

### With Zod Schema

Combine custom validators with Zod schema validation:

```typescript
import { z } from 'zod'
import { useFormValidation } from '@/hooks/forms'

const userSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
})

function RegisterForm() {
  const { validateForm, state } = useFormValidation({
    schema: userSchema,
    validators: {
      email: {
        async: [
          async (value) => {
            const response = await fetch('/api/validate/email', {
              method: 'POST',
              body: JSON.stringify({ email: value }),
            })
            const { available } = await response.json()
            return available ? true : 'Email already registered'
          },
        ],
        debounce: 300,
      },
    },
  })

  const handleSubmit = async (formData: z.infer<typeof userSchema>) => {
    const isValid = await validateForm(formData)
    if (isValid) {
      // Submit form
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  )
}
```

## API Reference

### useFormValidation Hook

#### Options

```typescript
interface UseFormValidationOptions<T> {
  schema?: ZodSchema              // Optional Zod schema
  validators?: Partial<Record<keyof T, FieldValidation>>
  validateOnChange?: boolean      // Auto-validate on field change
  validateOnBlur?: boolean        // Auto-validate on blur
  validateOnSubmit?: boolean      // Validate on form submit
}
```

#### Return Value

```typescript
interface FormValidationReturn<T> {
  // State
  state: FormValidationState

  // Validation methods
  validateField(fieldName: keyof T, value: any): Promise<boolean>
  validateForm(formValues: T): Promise<boolean>

  // Error management
  setFieldError(fieldName: string, errors: string[]): void
  clearFieldError(fieldName: string): void
  clearErrors(): void
  getFieldErrors(fieldName: string): string[]

  // State queries
  isFieldValidating(fieldName: string): boolean
  isFieldDirty(fieldName: string): boolean
  markFieldDirty(fieldName: string): void
}
```

### FormError Component

Displays validation errors with multiple style variants.

#### Props

```typescript
interface FormErrorProps {
  errors?: string | string[]      // Single error or array
  className?: string              // Additional CSS classes
  showIcon?: boolean              // Show error icon (default: true)
  onDismiss?: () => void          // Dismiss callback
  variant?: 'inline' | 'summary' | 'alert'  // Display style
}
```

#### Variants

**Inline** (single error):
```tsx
<FormError errors={['Email is required']} variant="inline" />
// Output: ⚠ Email is required
```

**Summary** (styled card with multiple errors):
```tsx
<FormError
  errors={['Email is required', 'Invalid format']}
  variant="summary"
  showIcon
/>
// Output: styled card with all errors listed
```

**Alert** (prominent alert box):
```tsx
<FormError
  errors={['Validation failed']}
  variant="alert"
  onDismiss={() => clearErrors()}
/>
// Output: alert box with dismiss button
```

## Common Validation Scenarios

### Email Uniqueness Check

```typescript
{
  email: {
    sync: [
      (value) => !value ? 'Email is required' : true,
      (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? true
        : 'Invalid email format',
    ],
    async: [
      async (value) => {
        const response = await fetch('/api/validate/email', {
          method: 'POST',
          body: JSON.stringify({ email: value }),
        })
        const { available } = await response.json()
        return available ? true : 'Email already registered'
      },
    ],
    debounce: 500,
  }
}
```

### Username Availability

```typescript
{
  username: {
    sync: [
      (value) => !value ? 'Username is required' : true,
      (value) => /^[a-zA-Z0-9_-]{3,20}$/.test(value)
        ? true
        : 'Username must be 3-20 characters (alphanumeric, _, -)',
    ],
    async: [
      async (value) => {
        const response = await fetch('/api/validate/username', {
          method: 'POST',
          body: JSON.stringify({ username: value }),
        })
        const { available } = await response.json()
        return available ? true : 'Username already taken'
      },
    ],
    debounce: 400,
  }
}
```

### Password Strength Validation

```typescript
{
  password: {
    sync: [
      (value) => !value ? 'Password is required' : true,
      (value) => value.length < 8 ? 'Minimum 8 characters' : true,
      (value) => !/[A-Z]/.test(value) ? 'Add uppercase letters' : true,
      (value) => !/[a-z]/.test(value) ? 'Add lowercase letters' : true,
      (value) => !/\d/.test(value) ? 'Add numbers' : true,
    ],
    async: [
      async (value) => {
        const response = await fetch('/api/validate/password', {
          method: 'POST',
          body: JSON.stringify({ password: value }),
        })
        const { strength } = await response.json()
        return strength === 'weak' ? 'Password is too weak' : true
      },
    ],
    debounce: 200,
  }
}
```

### Required Fields with Multiple Rules

```typescript
{
  name: {
    sync: [
      (value) => !value ? 'Name is required' : true,
      (value) => value.length < 2 ? 'Name too short' : true,
      (value) => value.length > 100 ? 'Name too long' : true,
    ],
  },
  bio: {
    sync: [
      (value) => value && value.length > 500
        ? 'Bio cannot exceed 500 characters'
        : true,
    ],
  }
}
```

## Testing

The validation handlers are exposed via MSW for testing:

```typescript
import { validationHandlers } from '@/mocks/validationHandlers'

describe('Form Validation', () => {
  it('should validate email uniqueness', async () => {
    const { validateField } = useFormValidation({
      validators: {
        email: {
          async: [
            async (value) => {
              const response = await fetch('/api/validate/email', {
                method: 'POST',
                body: JSON.stringify({ email: value }),
              })
              const { available } = await response.json()
              return available ? true : 'Email already registered'
            },
          ],
        },
      },
    })

    // Should fail for registered email
    const isValid = await validateField('email', 'alice@example.com')
    expect(isValid).toBe(false)

    // Should pass for new email
    const isValidNew = await validateField('email', 'new@example.com')
    expect(isValidNew).toBe(true)
  })
})
```

## Best Practices

1. **Sync First**: Always run sync validators before async to catch obvious errors early
2. **Debounce Wisely**: Set debounce delays to balance UX and server load (200-500ms typical)
3. **User Feedback**: Mark fields as dirty before showing errors
4. **Error Messages**: Keep messages concise and actionable
5. **TypeScript**: Leverage generic types for type-safe field names
6. **Combine Patterns**: Mix useFormValidation with React Hook Form or TanStack Form as needed

## Integration with React Hook Form

```typescript
import { useForm, Controller } from 'react-hook-form'
import { useFormValidation } from '@/hooks/forms'

function MyForm() {
  const { control } = useForm()
  const { validateField, getFieldErrors } = useFormValidation({...})

  return (
    <Controller
      control={control}
      name="email"
      render={({ field }) => (
        <>
          <input
            {...field}
            onChange={(e) => {
              field.onChange(e)
              validateField('email', e.target.value)
            }}
          />
          <FormError errors={getFieldErrors('email')} />
        </>
      )}
    />
  )
}
```

## Integration with TanStack Form

```typescript
import { useForm as useTanStackForm } from '@tanstack/react-form'
import { useFormValidation } from '@/hooks/forms'

function MyForm() {
  const form = useTanStackForm({...})
  const { validateField, getFieldErrors } = useFormValidation({...})

  return form.Field(
    { name: 'email' },
    (field) => (
      <>
        <input
          value={field.state.value}
          onChange={(e) => {
            field.setValue(e.target.value)
            validateField('email', e.target.value)
          }}
        />
        <FormError errors={getFieldErrors('email')} />
      </>
    ),
  )
}
```
