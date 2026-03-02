# TanStack Form Patterns & Implementation Notes

This document captures patterns discovered while implementing concrete forms with TanStack Form, without a schema abstraction layer.

## Overview

This project uses TanStack Form directly for form management without wrapping it in a custom schema abstraction layer (following YAGNI principle). Two concrete forms have been implemented:

1. **AgentProfileForm** - Agent profile management
2. **SprintConfigurationForm** - Sprint planning and configuration

## Key Patterns

### 1. Field-Level Validation

TanStack Form handles validation through the `validators` option in `Field`. Each field can define its own validation logic:

```typescript
<form.Field
  name="email"
  validators={{
    onBlur: ({ value }) => validateEmail(value),
  }}
>
  {(field) => (
    <div>
      {/* field UI */}
      {field.state.meta.errors && field.state.meta.errors.length > 0 && (
        <p className="text-red-400 text-sm mt-1">{field.state.meta.errors[0]}</p>
      )}
    </div>
  )}
</form.Field>
```

**Pattern Notes:**
- Validation happens on blur by default (avoids excessive validation during typing)
- Return `undefined` for valid fields
- Return error string for invalid fields
- Multiple validators can be chained
- Async validators work (e.g., server-side uniqueness checks)

### 2. Type Safety with TypeScript

Define a dedicated interface for form data:

```typescript
interface AgentProfileFormData {
  name: string
  role: AgentRole
  email: string
  startDate: string
  isActive: boolean
  bio?: string
  status: AgentStatus
}

const form = useForm<AgentProfileFormData>({
  defaultValues: { /* ... */ },
  onSubmit: async ({ value }) => {
    // value is fully typed as AgentProfileFormData
  },
})
```

**Pattern Notes:**
- Use explicit interfaces for form data
- Import types from existing domain types when available
- Optional fields use `?` in the interface
- TypeScript catches type mismatches at compile time

### 3. Common Field Types

The forms demonstrate several standard HTML field types integrated with TanStack Form:

#### Text Input
```typescript
<input
  type="text"
  value={field.state.value}
  onChange={(e) => field.setValue(e.target.value)}
  onBlur={field.handleBlur}
/>
```

#### Email Input
```typescript
<input
  type="email"
  value={field.state.value}
  onChange={(e) => field.setValue(e.target.value)}
/>
```

#### Select Dropdown
```typescript
<select
  value={field.state.value}
  onChange={(e) => field.setValue(e.target.value as AgentRole)}
>
  <option value="junior">Junior Developer</option>
  <option value="sr-dev">Senior Developer</option>
</select>
```

#### Date Input
```typescript
<input
  type="date"
  value={field.state.value}
  onChange={(e) => field.setValue(e.target.value)}
/>
```

#### Checkbox
```typescript
<input
  type="checkbox"
  checked={field.state.value}
  onChange={(e) => field.setValue(e.target.checked)}
/>
```

#### Textarea
```typescript
<textarea
  value={field.state.value ?? ''}
  onChange={(e) => field.setValue(e.target.value)}
/>
```

**Pattern Notes:**
- Each field type requires appropriate `type` attribute or element
- Date inputs return ISO string format (e.g., "2026-03-02")
- Checkboxes use `checked` instead of `value`
- Textareas use `value` like text inputs
- Always handle `undefined` for optional fields (use `??` or `?.`)

### 4. Cross-Field Validation

TanStack Form allows validation that depends on other field values:

```typescript
{(field) => (
  <div>
    <label>Is Active</label>
    <input
      type="checkbox"
      checked={field.state.value}
      onChange={(e) => field.setValue(e.target.checked)}
    />
    {field.state.meta.errors && (
      <p className="text-red-400">{field.state.meta.errors[0]}</p>
    )}
  </div>
)}
```

In validation, access other field values with `form.getFieldValue()`:

```typescript
validators={{
  onBlur: ({ value }) => {
    if (!value && form.getFieldValue('status') !== 'idle') {
      return 'Cannot deactivate an agent that is not idle'
    }
    return undefined
  },
}}
```

**Pattern Notes:**
- Use `form.getFieldValue()` to access other fields during validation
- Cross-field validation runs in context of the validating field
- Errors display alongside the dependent field

### 5. Async Validation

TanStack Form supports async validators (e.g., for server-side checks):

```typescript
const validateEmail = async (email: string): Promise<string | undefined> => {
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

// In Field validator:
validators={{
  onBlur: async ({ value }) => validateEmail(value),
}}
```

**Pattern Notes:**
- Async validators work seamlessly with TanStack Form
- Handle loading state separately (not built into validator)
- Network errors should be caught and converted to user-friendly messages

### 6. Form State and Submission

Handle form submission with loading states:

```typescript
const [isSubmitting, setIsSubmitting] = useState(false)
const [submitError, setSubmitError] = useState<string | null>(null)

const form = useForm<FormData>({
  onSubmit: async ({ value }) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(value)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  },
})
```

**Pattern Notes:**
- Use separate state for submission loading/errors (not form state)
- Wrap submission in try/catch to handle unexpected errors
- Disable form fields during submission with `disabled={isSubmitting}`
- Show user-friendly error messages

### 7. Form Reset

TanStack Form provides built-in reset functionality:

```typescript
<button
  type="reset"
  onClick={() => form.reset()}
>
  Reset
</button>
```

**Pattern Notes:**
- `form.reset()` clears all fields back to `defaultValues`
- Useful for "Cancel" or "Reset" buttons
- Can be called after successful submission

### 8. Field Composition

No custom field components are created - all field logic is inline. This keeps the implementation simple and focused:

**Why no abstraction:**
- Each field type has slightly different APIs (checkbox vs input, etc.)
- Creating a generic component wrapper adds complexity
- Field-specific styling and validation varies per use case
- Following YAGNI: abstraction can come later when patterns are clearer

**When to abstract:**
- If 3+ similar fields are repeated exactly
- If field composition becomes a blocker for new features
- After establishing stable patterns across multiple forms

## Potential Patterns for Future Abstraction

### 1. Field Container Component

Once multiple forms exist, a reusable field wrapper could standardize:
- Label rendering
- Error message display
- Styling consistency
- Accessibility attributes

Example:
```typescript
<FormField
  label="Email"
  error={field.state.meta.errors?.[0]}
  required
>
  <input value={field.state.value} onChange={...} />
</FormField>
```

### 2. Validation Library

Common validation patterns could be extracted:
- Email validation
- URL validation
- Date range validation
- String length validation
- Number range validation

### 3. Field Builder Utilities

Helper functions for common patterns:
```typescript
const createSelectField = (name: string, options: Option[]) => ({
  name,
  validators: { /* default validators */ },
  component: SelectComponent,
})
```

### 4. Form Schema Definition

Once patterns stabilize, a schema could describe form structure without code:
```typescript
const agentFormSchema = {
  fields: [
    { name: 'email', type: 'email', required: true },
    { name: 'role', type: 'select', options: [...] },
  ],
}
```

But this should wait until:
- 3+ forms exist with clear patterns
- Benefits clearly outweigh added complexity
- Teams has established validation and UI patterns

## MSW Mock Setup

Form submissions are mocked via MSW handlers:

- `POST /api/agents/profile` - Agent profile form submission
- `POST /api/sprints/configure` - Sprint configuration form submission

Both handlers validate required fields and return appropriate responses.

## Best Practices Applied

1. **Type Safety** - All forms are fully typed with TypeScript
2. **Validation** - Client-side validation with user feedback
3. **Accessibility** - Proper labels, error messages, and form semantics
4. **Error Handling** - Graceful handling of submit errors
5. **User Feedback** - Loading states, error messages, character counters
6. **Pragmatism** - Direct TanStack Form usage, no premature abstraction

## Files Modified/Created

- `src/components/AgentProfileForm.tsx` - New form for agent profile management
- `src/components/SprintConfigurationForm.tsx` - New form for sprint configuration
- `src/mocks/handlers.ts` - Added form submission handlers
- `docs/TANSTACK_FORM_PATTERNS.md` - This documentation file

## References

- [TanStack Form Documentation](https://tanstack.com/form)
- [HTML Form Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input)
- [MSW (Mock Service Worker)](https://mswjs.io/)
