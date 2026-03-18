import { z } from 'zod'

export const addDomainSchema = z.object({
  domain: z
    .string()
    .min(1)
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/,
      'Invalid domain format (e.g. example.com)'
    ),
})

export type AddDomainInput = z.infer<typeof addDomainSchema>
