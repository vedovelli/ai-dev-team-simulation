import { z } from 'zod'

export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Must be a valid email address'),
  role: z
    .string()
    .min(1, 'Role is required')
    .refine((val) => ['admin', 'user', 'viewer'].includes(val), {
      message: 'Invalid role selected',
    }),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const userProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Must be a valid email address'),
  bio: z
    .string()
    .min(0)
    .max(500, 'Bio must not exceed 500 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  role: z
    .enum(['admin', 'user', 'viewer'])
    .default('user'),
})

export type UserProfileInput = z.infer<typeof userProfileSchema>

export const createUserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  createdAt: z.string().datetime(),
})

export type CreateUserResponse = z.infer<typeof createUserResponseSchema>

export const userProfileResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  role: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>
