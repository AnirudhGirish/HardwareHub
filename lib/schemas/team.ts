import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  department_id: z.string().uuid('Select a department'),
})

export const updateTeamSchema = createTeamSchema.partial()

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
