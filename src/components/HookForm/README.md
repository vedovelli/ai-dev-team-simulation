# React Hook Form Components

This directory contains a complete form handling solution using React Hook Form with TypeScript support and Zod validation.

## Features

- **Reusable Components**: Pre-built form field components for common input types
- **TypeScript Support**: Full type safety for form data
- **Zod Validation**: Schema-based validation with clear error messages
- **Loading States**: Built-in support for loading/submitting states
- **Error Display**: Automatic error message rendering
- **Accessible**: Proper label associations and ARIA attributes

## Components

### HookForm

Main form wrapper component that handles form submission and loading states.

```typescript
import { useForm } from 'react-hook-form'
import { HookForm } from '@/components/HookForm'

export function MyForm() {
  const { handleSubmit } = useForm()

  return (
    <HookForm
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Save"
      isLoading={isLoading}
    >
      {/* Form fields go here */}
    </HookForm>
  )
}
```

### HookFormInput

Text input field with support for email, password, number, and text types.

```typescript
<HookFormInput
  control={control}
  name="email"
  label="Email"
  type="email"
  placeholder="you@example.com"
  required
/>
```

### HookFormSelect

Dropdown/select field with options.

```typescript
<HookFormSelect
  control={control}
  name="status"
  label="Status"
  required
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
  placeholder="Select a status"
/>
```

### HookFormCheckbox

Boolean checkbox field.

```typescript
<HookFormCheckbox
  control={control}
  name="terms"
  label="I agree to the terms"
  required
/>
```

### HookFormTextarea

Multi-line text input field.

```typescript
<HookFormTextarea
  control={control}
  name="description"
  label="Description"
  placeholder="Enter details..."
  rows={4}
  required
/>
```

## Validation

Validation is handled using Zod with the `@hookform/resolvers` package.

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
})

export function LoginForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  return (
    <HookForm onSubmit={handleSubmit(onSubmit)}>
      <HookFormInput control={control} name="email" type="email" required />
      <HookFormInput control={control} name="password" type="password" required />
    </HookForm>
  )
}
```

## Custom Validators

You can add custom validation logic:

```typescript
const schema = z.object({
  username: z
    .string()
    .min(3, 'Min 3 characters')
    .refine(
      (value) => !reservedNames.includes(value),
      'This username is reserved'
    ),
})
```

## Error Handling

Errors are automatically displayed below each field:

```typescript
export function MyForm() {
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      await api.save(data)
    } catch (error) {
      // Handle error
    }
  }

  return (
    <HookForm onSubmit={handleSubmit(onSubmit)}>
      {/* fields */}
    </HookForm>
  )
}
```

## Examples

### LoginForm

User authentication form with email and password validation.

```typescript
import { LoginForm } from '@/components/HookForm/examples'

export function LoginPage() {
  const handleLogin = async (data) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    // Handle response
  }

  return <LoginForm onSubmit={handleLogin} />
}
```

### SettingsForm

User preferences form with theme selection and notification toggle.

```typescript
import { SettingsForm } from '@/components/HookForm/examples'

export function SettingsPage() {
  const handleSave = async (data) => {
    await updateUserSettings(data)
  }

  return (
    <SettingsForm
      onSubmit={handleSave}
      initialData={currentSettings}
    />
  )
}
```

## Best Practices

1. **Use Zod schemas** for validation - easier to maintain and type-safe
2. **Always set default values** in useForm to prevent uncontrolled inputs
3. **Handle errors gracefully** - show user-friendly error messages
4. **Test validation** - test edge cases and error states
5. **Keep forms focused** - separate large forms into multiple steps if needed
6. **Use TypeScript** - leverage full type safety for form data

## Migration from TanStack React Form

If migrating from TanStack React Form, follow this pattern:

**Before (TanStack):**
```typescript
const form = useForm({
  defaultValues: { name: '' },
  onSubmit: async ({ value }) => { /* ... */ },
})

<form.Field name="name">
  {(field) => <input value={field.state.value} onChange={e => field.setValue(e.target.value)} />}
</form.Field>
```

**After (React Hook Form):**
```typescript
const { control, handleSubmit } = useForm({
  defaultValues: { name: '' },
})

<HookFormInput control={control} name="name" />
```

Much cleaner and more declarative!
