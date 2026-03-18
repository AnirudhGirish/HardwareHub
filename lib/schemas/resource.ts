import { z } from 'zod'

// Base fields shared by all resource creation
const baseResourceFields = {
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['hardware', 'licence'], { message: 'Select a type' }),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .refine((v) => !v || !/<script/i.test(v), 'Invalid content'),
  serial_number: z.string().max(100, 'Serial number too long').optional().or(z.literal('')),
}

/**
 * Used when a regular user creates a resource.
 * Owner and team are auto-assigned from the session — not provided by the client.
 */
export const UserCreateResourceSchema = z.object({
  ...baseResourceFields,
})

/**
 * Used when an admin creates a resource.
 * Admin can freely specify owner and team.
 */
export const AdminCreateResourceSchema = z.object({
  ...baseResourceFields,
  name: z.string().min(1, 'Name is required').max(200), // admins get wider name limit
  team_id: z.string().uuid().optional().nullable(),
  permanent_owner_id: z.string().uuid().optional().nullable(),
})

/** Legacy schema — retains full shape for GET/update validation */
export const createResourceSchema = AdminCreateResourceSchema

export const updateResourceSchema = createResourceSchema.partial()

export const deleteResourceSchema = z.object({
  confirm: z.literal('DELETE'),
})

export type UserCreateResourceInput = z.infer<typeof UserCreateResourceSchema>
export type AdminCreateResourceInput = z.infer<typeof AdminCreateResourceSchema>
export type CreateResourceInput = z.infer<typeof createResourceSchema>
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>
