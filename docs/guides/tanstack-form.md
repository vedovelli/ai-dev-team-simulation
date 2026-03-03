# TanStack Form Developer Guide

## Introduction

TanStack Form is a modern form state management library that handles validation, field state, and submission without HTML form submission. This guide covers implementation patterns used in this application.

## Creating New Forms

### Basic Form

```typescript
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'

interface TaskFormData {
  title: string
  description: string
  status: 'backlog' | 'in-progress' | 'done'
}

/**
 * Form for creating a new task
 *
 * @example
 * const [isSubmitting, setIsSubmitting] = useState(false)
 * const { form, isValid } = useCreateTaskForm({
 *   onSuccess: () => console.log('Task created')
 * })
 */
export function useCreateTaskForm(options: {
  onSuccess?: (data: TaskFormData) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      status: 'backlog',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      setSubmitError(null)

      try {
        // Call your API here
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        })

        if (!response.ok) {
          throw new Error('Failed to create task')
        }

        form.reset()
        options.onSuccess?.(value)
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'An error occurred'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return { form, isSubmitting, submitError }
}
```

## Field Components & Patterns

### Text Input Field

```typescript
import { FieldInfo } from '@tanstack/react-form'

interface TextFieldProps {
  form: Form<FormData>
  name: keyof FormData
  label: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'url'
  required?: boolean
  validators?: {
    onBlur?: (value: string) => string | undefined
    onChange?: (value: string) => string | undefined
  }
}

export function TextField({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
  validators,
}: TextFieldProps) {
  return (
    <form.Field
      name={name as any}
      validators={validators}
    >
      {(field) => (
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={type}
            placeholder={placeholder}
            value={field.state.value}
            onChange={(e) => field.setValue(e.target.value)}
            onBlur={field.handleBlur}
            className={`w-full p-2 border rounded ${
              field.state.meta.errors?.length
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          {field.state.meta.errors && field.state.meta.errors.length > 0 && (
            <p className="text-red-500 text-sm mt-1">
              {field.state.meta.errors[0]}
            </p>
          )}
        </div>
      )}
    </form.Field>
  )
}

// Usage
<TextField
  form={form}
  name="title"
  label="Task Title"
  placeholder="Enter task title"
  required
  validators={{
    onBlur: (value) => {
      if (!value) return 'Title is required'
      if (value.length < 3) return 'Title must be at least 3 characters'
      return undefined
    },
  }}
/>
```

### Select Dropdown Field

```typescript
interface SelectFieldProps<T> {
  form: Form<FormData>
  name: keyof FormData
  label: string
  options: Array<{ value: T; label: string }>
  required?: boolean
}

export function SelectField<T extends string | number>({
  form,
  name,
  label,
  options,
  required = false,
}: SelectFieldProps<T>) {
  return (
    <form.Field name={name as any}>
      {(field) => (
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={field.state.value}
            onChange={(e) => field.setValue(e.target.value as any)}
            onBlur={field.handleBlur}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">-- Select {label} --</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.state.meta.errors && field.state.meta.errors.length > 0 && (
            <p className="text-red-500 text-sm mt-1">
              {field.state.meta.errors[0]}
            </p>
          )}
        </div>
      )}
    </form.Field>
  )
}

// Usage
<SelectField
  form={form}
  name="status"
  label="Status"
  options={[
    { value: 'backlog', label: 'Backlog' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ]}
/>
```

### Checkbox Field

```typescript
interface CheckboxFieldProps {
  form: Form<FormData>
  name: keyof FormData
  label: string
}

export function CheckboxField({
  form,
  name,
  label,
}: CheckboxFieldProps) {
  return (
    <form.Field name={name as any}>
      {(field) => (
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.setValue(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-medium">{label}</span>
          </label>
          {field.state.meta.errors && field.state.meta.errors.length > 0 && (
            <p className="text-red-500 text-sm mt-1">
              {field.state.meta.errors[0]}
            </p>
          )}
        </div>
      )}
    </form.Field>
  )
}

// Usage
<CheckboxField
  form={form}
  name="isActive"
  label="Mark as active"
/>
```

### Textarea Field

```typescript
interface TextareaFieldProps {
  form: Form<FormData>
  name: keyof FormData
  label: string
  placeholder?: string
  rows?: number
  validators?: {
    onBlur?: (value: string) => string | undefined
  }
}

export function TextareaField({
  form,
  name,
  label,
  placeholder,
  rows = 4,
  validators,
}: TextareaFieldProps) {
  return (
    <form.Field name={name as any} validators={validators}>
      {(field) => (
        <div className="mb-4">
          <label className="block mb-2 font-medium">{label}</label>
          <textarea
            placeholder={placeholder}
            rows={rows}
            value={field.state.value}
            onChange={(e) => field.setValue(e.target.value)}
            onBlur={field.handleBlur}
            className={`w-full p-2 border rounded ${
              field.state.meta.errors?.length
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          {field.state.meta.errors && field.state.meta.errors.length > 0 && (
            <p className="text-red-500 text-sm mt-1">
              {field.state.meta.errors[0]}
            </p>
          )}
        </div>
      )}
    </form.Field>
  )
}

// Usage
<TextareaField
  form={form}
  name="description"
  label="Description"
  placeholder="Enter task description"
  rows={5}
/>
```

### Date Input Field

```typescript
interface DateFieldProps {
  form: Form<FormData>
  name: keyof FormData
  label: string
  required?: boolean
}

export function DateField({
  form,
  name,
  label,
  required = false,
}: DateFieldProps) {
  return (
    <form.Field name={name as any}>
      {(field) => (
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="date"
            value={field.state.value}
            onChange={(e) => field.setValue(e.target.value)}
            onBlur={field.handleBlur}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {field.state.meta.errors && field.state.meta.errors.length > 0 && (
            <p className="text-red-500 text-sm mt-1">
              {field.state.meta.errors[0]}
            </p>
          )}
        </div>
      )}
    </form.Field>
  )
}

// Usage
<DateField
  form={form}
  name="dueDate"
  label="Due Date"
  required
/>
```

## Validation Patterns

### Field-Level Validation

```typescript
<form.Field
  name="email"
  validators={{
    onBlur: ({ value }) => {
      if (!value) return 'Email is required'
      if (!value.includes('@')) return 'Invalid email format'
      return undefined
    },
  }}
>
  {(field) => (
    <input
      value={field.state.value}
      onChange={(e) => field.setValue(e.target.value)}
      onBlur={field.handleBlur}
    />
  )}
</form.Field>
```

### Async Validation

```typescript
const validateEmailUnique = async (email: string): Promise<string | undefined> => {
  const response = await fetch('/api/validate-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
  const data = await response.json()
  if (!data.isUnique) {
    return 'This email is already registered'
  }
  return undefined
}

<form.Field
  name="email"
  validators={{
    onBlur: async ({ value }) => {
      return await validateEmailUnique(value)
    },
  }}
>
  {(field) => (
    <div>
      <input
        type="email"
        value={field.state.value}
        onChange={(e) => field.setValue(e.target.value)}
        onBlur={field.handleBlur}
      />
      {field.state.meta.isTouched && field.state.meta.isValidating && (
        <p className="text-blue-500 text-sm">Validating...</p>
      )}
      {field.state.meta.errors?.length > 0 && (
        <p className="text-red-500 text-sm">{field.state.meta.errors[0]}</p>
      )}
    </div>
  )}
</form.Field>
```

### Cross-Field Validation

```typescript
const form = useForm<FormData>({
  onSubmit: async ({ value }) => {
    // Validation that depends on multiple fields
    if (value.status === 'done' && !value.completedDate) {
      // Show error to user
      return
    }
    // Submit...
  },
})

// Or validate within a field
<form.Field
  name="completedDate"
  validators={{
    onBlur: ({ value }) => {
      const status = form.getFieldValue('status')
      if (status === 'done' && !value) {
        return 'Completed date is required for done tasks'
      }
      return undefined
    },
  }}
>
  {/* field UI */}
</form.Field>
```

### Multiple Validators

```typescript
<form.Field
  name="password"
  validators={{
    onBlur: [
      ({ value }) => {
        if (!value) return 'Password is required'
        return undefined
      },
      ({ value }) => {
        if (value.length < 8) return 'Password must be at least 8 characters'
        return undefined
      },
      ({ value }) => {
        if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter'
        return undefined
      },
    ],
  }}
>
  {(field) => (
    <div>
      <input
        type="password"
        value={field.state.value}
        onChange={(e) => field.setValue(e.target.value)}
        onBlur={field.handleBlur}
      />
      {field.state.meta.errors && (
        <ul className="text-red-500 text-sm mt-1">
          {field.state.meta.errors.map((error, i) => (
            <li key={i}>• {error}</li>
          ))}
        </ul>
      )}
    </div>
  )}
</form.Field>
```

## Advanced Patterns

### Form with Array Fields

```typescript
interface TaskFormData {
  title: string
  steps: Array<{ description: string; completed: boolean }>
}

export function TaskFormWithSteps() {
  const form = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      steps: [{ description: '', completed: false }],
    },
    onSubmit: async ({ value }) => {
      await submitTask(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field name="title">
        {(field) => (
          <input
            value={field.state.value}
            onChange={(e) => field.setValue(e.target.value)}
          />
        )}
      </form.Field>

      {form.getFieldValue('steps').map((_, i) => (
        <div key={i}>
          <form.Field name={`steps[${i}].description` as any}>
            {(field) => (
              <input
                value={field.state.value}
                onChange={(e) => field.setValue(e.target.value)}
                placeholder="Step description"
              />
            )}
          </form.Field>

          <form.Field name={`steps[${i}].completed` as any}>
            {(field) => (
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(e) => field.setValue(e.target.checked)}
              />
            )}
          </form.Field>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          const currentSteps = form.getFieldValue('steps')
          form.setFieldValue('steps', [
            ...currentSteps,
            { description: '', completed: false },
          ] as any)
        }}
      >
        Add Step
      </button>

      <button type="submit">Submit</button>
    </form>
  )
}
```

### Form with Conditional Fields

```typescript
export function TaskFormWithConditions() {
  const form = useForm<{ status: string; reason?: string }>({
    defaultValues: { status: 'open', reason: '' },
    onSubmit: async ({ value }) => {
      await submitTask(value)
    },
  })

  const status = form.getFieldValue('status')

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field name="status">
        {(field) => (
          <select
            value={field.state.value}
            onChange={(e) => field.setValue(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        )}
      </form.Field>

      {status === 'closed' && (
        <form.Field name="reason" validators={{
          onBlur: ({ value }) => {
            if (!value) return 'Please provide a reason for closing'
            return undefined
          },
        }}>
          {(field) => (
            <textarea
              placeholder="Why are you closing this task?"
              value={field.state.value ?? ''}
              onChange={(e) => field.setValue(e.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
      )}

      <button type="submit">Submit</button>
    </form>
  )
}
```

### Form with Dynamic Validators

```typescript
export function TaskFormWithDynamicValidation() {
  const [requireAssignee, setRequireAssignee] = useState(false)

  const form = useForm<{ title: string; assignee?: string }>({
    defaultValues: { title: '', assignee: '' },
    onSubmit: async ({ value }) => {
      await submitTask(value)
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <label>
        <input
          type="checkbox"
          checked={requireAssignee}
          onChange={(e) => setRequireAssignee(e.target.checked)}
        />
        Require assignee
      </label>

      <form.Field
        name="assignee"
        validators={{
          onBlur: ({ value }) => {
            if (requireAssignee && !value) {
              return 'Assignee is required'
            }
            return undefined
          },
        }}
      >
        {(field) => (
          <input
            placeholder="Assigned to"
            value={field.state.value}
            onChange={(e) => field.setValue(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <button type="submit">Submit</button>
    </form>
  )
}
```

## Error Handling

### Display Form-Level Errors

```typescript
const [submitError, setSubmitError] = useState<string | null>(null)

const form = useForm<FormData>({
  onSubmit: async ({ value }) => {
    try {
      await submitTask(value)
      form.reset()
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  },
})

return (
  <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
    {submitError && (
      <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
        {submitError}
      </div>
    )}
    {/* ... fields ... */}
  </form>
)
```

### Field-Level Debounce

```typescript
import { debounce } from 'lodash'

const debouncedValidate = debounce(
  async (value: string) => {
    return await validateOnServer(value)
  },
  500
)

<form.Field
  name="username"
  validators={{
    onChange: async ({ value }) => {
      return await debouncedValidate(value)
    },
  }}
>
  {(field) => (
    <input
      value={field.state.value}
      onChange={(e) => field.setValue(e.target.value)}
    />
  )}
</form.Field>
```

## Best Practices

### 1. Always Type Form Data

```typescript
// ✅ Good
interface TaskFormData {
  title: string
  status: TaskStatus
  priority: TaskPriority
}

const form = useForm<TaskFormData>({
  // ...
})

// ❌ Avoid
const form = useForm({  // Unknown type
  // ...
})
```

### 2. Handle Loading and Error States

```typescript
const [isSubmitting, setIsSubmitting] = useState(false)
const [submitError, setSubmitError] = useState<string | null>(null)

return (
  <>
    {submitError && <ErrorAlert message={submitError} />}
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save'}
    </button>
  </>
)
```

### 3. Reset Form After Success

```typescript
const form = useForm<FormData>({
  onSubmit: async ({ value }) => {
    try {
      await submitTask(value)
      form.reset()  // Clear form after success
      showSuccessToast('Task created')
    } catch (error) {
      showErrorToast(error.message)
    }
  },
})
```

### 4. Validate on Blur for Better UX

```typescript
<form.Field
  name="email"
  validators={{
    onBlur: ({ value }) => {
      // Validation runs when user leaves the field
      // Avoids showing errors while user is still typing
      return validateEmail(value)
    },
  }}
>
  {(field) => (
    <input
      value={field.state.value}
      onChange={(e) => field.setValue(e.target.value)}
      onBlur={field.handleBlur}
    />
  )}
</form.Field>
```

### 5. Use Mutation Hooks with Forms

```typescript
const { mutate: createTask, isPending, error } = useCreateTask()

const form = useForm<TaskFormData>({
  onSubmit: async ({ value }) => {
    createTask(value, {
      onSuccess: () => {
        form.reset()
        showSuccessToast()
      },
    })
  },
})

return (
  <>
    {error && <ErrorAlert message={error.message} />}
    <button type="submit" disabled={isPending}>
      {isPending ? 'Creating...' : 'Create Task'}
    </button>
  </>
)
```

## Common Mistakes

### Mistake 1: Not Handling Submission Errors

```typescript
// ❌ Wrong
const form = useForm<FormData>({
  onSubmit: async ({ value }) => {
    await submitTask(value)  // No error handling
  },
})

// ✅ Correct
const form = useForm<FormData>({
  onSubmit: async ({ value }) => {
    try {
      await submitTask(value)
    } catch (error) {
      setSubmitError(error.message)
    }
  },
})
```

### Mistake 2: Validators with Side Effects

```typescript
// ❌ Wrong
validators={{
  onBlur: ({ value }) => {
    localStorage.setItem('draft', value)  // Side effect!
    return undefined
  },
}}

// ✅ Correct
validators={{
  onBlur: ({ value }) => {
    if (!value) return 'Required'
    return undefined
  },
}}

// Handle side effects separately
useEffect(() => {
  const title = form.getFieldValue('title')
  localStorage.setItem('draft', title)
}, [form.getFieldValue('title')])
```

### Mistake 3: Not Using onBlur for Validation

```typescript
// ❌ Acceptable but can show errors during typing
validators={{
  onChange: ({ value }) => {
    if (!value) return 'Required'
    return undefined
  },
}}

// ✅ Better UX: validate on blur
validators={{
  onBlur: ({ value }) => {
    if (!value) return 'Required'
    return undefined
  },
}}
```

## References

- [TanStack Form Documentation](https://tanstack.com/form/latest)
- [Form State Management](https://tanstack.com/form/latest/docs/guide/field-state)
- [Validation Guide](https://tanstack.com/form/latest/docs/guide/validation)
- [Zod Integration](https://zod.dev/) (for schema-based validation)
