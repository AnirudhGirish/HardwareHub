import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .refine((v) => !/<[^>]*>/.test(v), 'Invalid characters in name'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .transform((v) => v.toLowerCase()),
  employee_id: z.string().min(1, 'Employee ID is required').max(50, 'Employee ID too long'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'),
  confirm_password: z.string(),
  department_id: z.string().uuid('Select a department'),
  team_id: z.string().uuid('Select a team'),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export const completeProfileSchema = z.object({
  full_name: z
    .string()
    .min(2)
    .max(100)
    .refine((v) => !/<[^>]*>/.test(v), 'Invalid characters'),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Invalid username format')
    .transform((v) => v.toLowerCase()),
  employee_id: z.string().min(1).max(50),
  department_id: z.string().uuid(),
  team_id: z.string().uuid(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>
