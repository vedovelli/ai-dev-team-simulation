# React Hook Form Abstraction Pattern Guide

This document outlines the form abstraction pattern used in the application with React Hook Form (RHF).

## Overview

The form abstraction provides:
- **Reusable form hook** (`useFormHandler`) for consistent form handling
- **Error boundary component** for graceful error handling in forms
- **Typed form field components** (Input, Select, Textarea, Checkbox)
- **MSW integration** for realistic form submission responses
- **Zod validation** for TypeScript-first validation schemas

## Architecture

### 1. Custom Form Hook (`useFormHandler`)

The `useFormHandler` is a wrapper around React Hook Form's `useForm` that provides:
- Automatic Zod schema resolver integration
- Consistent form state management
- Type-safe field handling

**Location:** `src/hooks/useFormHandler.ts`

**Usage:**

```tsx
import { useFormHandler } from '@/hooks/useFormHandler'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

function MyForm() {
  const form = useFormHandler({
    schema,
    defaultValues: { name: '', email: '' },
    onSubmit: async (data) => {
      await submitForm(data)
    },
  })

  return (
    <form onSubmit={form.handleSubmit}>
      {/* form content */}
    </form>
  )
}
```

### 2. Error Boundary Component

Wraps form sections to catch and display errors gracefully.

**Location:** `src/components/FormErrorBoundary.tsx`

**Features:**
- Catches form-level errors
- Displays error UI with icon and message
- Supports custom fallback UI
- Logs errors for debugging

**Usage:**

```tsx
<FormErrorBoundary onError={(error) => logToService(error)}>
  <FormSection />
</FormErrorBoundary>
```

### 3. RHF Field Components

Pre-built, type-safe field components that integrate with React Hook Form's Controller:

- **RHFInput** - Text inputs with validation
- **RHFSelect** - Dropdown selects
- **RHFTextarea** - Multi-line text inputs
- **RHFCheckbox** - Checkbox inputs

**Location:** `src/components/RHFComponents/`

**Features:**
- Built-in error display
- Helper text support
- Consistent styling
- TypeScript support with generics

**Usage:**

```tsx
import { RHFInput, RHFSelect } from '@/components/RHFComponents'

<RHFInput
  control={control}
  name="email"
  label="Email"
  type="email"
  placeholder="user@example.com"
/>

<RHFSelect
  control={control}
  name="role"
  label="Role"
  options={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
  ]}
/>
```

### 4. Field Arrays for Dynamic Fields

React Hook Form's `useFieldArray` enables dynamic field management:

```tsx
import { useFieldArray } from 'react-hook-form'

const { fields, append, remove } = useFieldArray({
  control,
  name: 'skills',
})

// In JSX:
{fields.map((field, index) => (
  <div key={field.id}>
    <RHFInput
      control={control}
      name={`skills.${index}.name`}
      label="Skill Name"
    />
    <button type="button" onClick={() => remove(index)}>
      Remove
    </button>
  </div>
))}

<button
  type="button"
  onClick={() => append({ name: '', level: 'beginner' })}
>
  Add Skill
</button>
```

### 5. MSW Form Handlers

MSW handlers provide realistic form submission endpoints:

**Location:** `src/mocks/handlers.ts`

**Endpoints:**
- `POST /api/forms/user-profile` - Create user profile
- `PATCH /api/forms/user-profile/:id` - Update user profile

**Example Response:**

```json
{
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "updatedAt": "2026-03-04T00:00:00.000Z"
  }
}
```

## Validation Pattern

Use Zod for schema-based validation:

```tsx
import { z } from 'zod'

const userSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(3, 'Name must be at least 3 characters'),
  email: z
    .string()
    .email('Invalid email format'),
  skills: z
    .array(z.object({
      name: z.string().min(1, 'Skill name required'),
      level: z.enum(['beginner', 'intermediate', 'advanced']),
    }))
    .min(1, 'Add at least one skill'),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to terms'),
})

type UserFormData = z.infer<typeof userSchema>
```

## Complete Example

See `src/components/ExampleRHFForm.tsx` for a complete working example that includes:
- Field validation with Zod
- Error boundary wrapper
- Dynamic field arrays
- Form submission with MSW
- Success/error messaging
- Type-safe form data

## Key Advantages

1. **Type Safety** - Full TypeScript support with Zod schemas
2. **DRY Code** - Reusable hook and components prevent duplication
3. **Consistency** - Unified form handling across the application
4. **Error Handling** - Error boundaries and built-in error display
5. **Testability** - Separation of concerns with composable patterns
6. **Performance** - Efficient re-rendering with React Hook Form
7. **Developer Experience** - Clear patterns and comprehensive components

## Migration Guide

To migrate existing forms to this abstraction:

1. Replace `useForm` with `useFormHandler`
2. Add Zod validation schema
3. Replace field inputs with RHF components
4. Wrap form in `FormErrorBoundary`
5. Update MSW handlers for form endpoints
6. Test validation and submission flows

## Best Practices

1. **Always define validation schemas** - Use Zod for runtime validation
2. **Wrap forms in error boundaries** - Gracefully handle form-level errors
3. **Use field components** - Never access field values directly
4. **Handle loading states** - Use `isSubmitting` for button disable state
5. **Provide user feedback** - Show success/error messages on submission
6. **Test field arrays** - Complex dynamic forms need thorough testing
7. **Keep schemas DRY** - Define schemas once and reuse them

## File Structure

```
src/
├── hooks/
│   └── useFormHandler.ts          # Custom form hook
├── components/
│   ├── FormErrorBoundary.tsx      # Error boundary
│   ├── RHFComponents/
│   │   ├── RHFInput.tsx
│   │   ├── RHFSelect.tsx
│   │   ├── RHFTextarea.tsx
│   │   ├── RHFCheckbox.tsx
│   │   └── index.ts
│   └── ExampleRHFForm.tsx         # Complete example
└── mocks/
    └── handlers.ts                # MSW form handlers
```
