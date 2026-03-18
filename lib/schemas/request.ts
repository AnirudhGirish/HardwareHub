import { z } from 'zod'

export const createRequestSchema = z.object({
  resource_id: z.string().uuid('Invalid resource'),
  requested_duration_days: z
    .number()
    .int()
    .min(1, 'Minimum 1 day')
    .max(365, 'Maximum 365 days'),
  message: z
    .string()
    .max(500, 'Message too long')
    .optional()
    .refine((v) => !v || !/<script/i.test(v), 'Invalid content'),
})

export const approveRequestSchema = z.object({
  request_id: z.string().uuid(),
})

export const cancelRequestSchema = z.object({
  request_id: z.string().uuid(),
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>
