import { z } from 'zod'

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Invalid username')
    .transform((v) => v.toLowerCase())
    .optional(),
  department_id: z.string().uuid().optional().nullable(),
  team_id: z.string().uuid().optional().nullable(),
})

export const deactivateUserSchema = z.object({
  confirm: z.literal('DEACTIVATE'),
})

export const reassignTeamSchema = z.object({
  department_id: z.string().uuid(),
  team_id: z.string().uuid(),
})

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  username: z.string(),
  role: z.enum(['admin', 'user']),
  status: z.enum(['active', 'deactivated']),
  employee_id: z.string().nullable(),
  department_id: z.string().uuid().nullable(),
  team_id: z.string().uuid().nullable(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ReassignTeamInput = z.infer<typeof reassignTeamSchema>
export type UserProfile = z.infer<typeof userProfileSchema>
