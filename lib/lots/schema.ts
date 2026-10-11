import { z } from 'zod'
import { LOT_UNITS } from '@/lib/constants'

// Optional positive whole number from a form field: '' / null / undefined all mean "not given"
// (z.coerce alone would turn those into 0 and fail the positive check).
const optionalWholeNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
  z.number().int().positive().nullable()
)

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || null)

export const createLotSchema = z.object({
  category: z.string().min(1),
  title: optionalText,
  spec: optionalText,
  gsm: optionalWholeNumber.optional(),
  width_cm: optionalWholeNumber.optional(),
  colour: optionalText,
  quantity: z.coerce.number().positive(),
  unit: z.enum(LOT_UNITS),
  price_per_unit: z.coerce.number().positive(),
  currency: z.string().default('INR'),
  location: optionalText,
  notes: optionalText,
  urgency_note: optionalText,
  photo_urls: z.array(z.string().url()).optional().default([]),
})

export type CreateLotInput = z.infer<typeof createLotSchema>
