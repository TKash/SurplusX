import { z } from 'zod'
import { LOT_UNITS } from '@/lib/constants'
import { LOT_CATEGORIES, categorySpec } from './categories'
import { normalizePhone } from '@/lib/auth/phone'

const unitEnum = z.enum(LOT_UNITS)

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || null)

const optionalWholeNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
  z.number().int().positive().nullable()
)

// Attribute values arrive as strings from the form; blank ones are dropped so a lot only carries
// what the seller actually filled in.
const attributes = z
  .record(z.string(), z.union([z.string(), z.number()]))
  .optional()
  .transform((raw) => {
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(raw ?? {})) {
      const text = String(value).trim()
      if (text) out[key.slice(0, 40)] = text.slice(0, 200)
    }
    return out
  })

export const createLotSchema = z
  .object({
    category: z.enum(LOT_CATEGORIES),
    title: optionalText,
    attributes,
    quantity: z.coerce.number().positive(),
    unit: unitEnum,
    // Null = price on request.
    price_per_unit: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
      z.number().positive().nullable()
    ),
    price_unit: unitEnum.optional().nullable(),
    currency: z.string().default('INR'),
    location: optionalText,
    // Required: this is how a buyer reaches the seller now.
    contact_phone: z.string().transform((value, ctx) => {
      const phone = normalizePhone(value)
      if (!phone) {
        ctx.addIssue({ code: 'custom', message: 'Enter a valid contact number.' })
        return z.NEVER
      }
      return phone
    }),
    contact_name: optionalText,
    notes: optionalText,
    urgency_note: optionalText,
    photo_urls: z.array(z.string().url()).optional().default([]),
    // Kept so older fabric listings and the WhatsApp bot keep working.
    spec: optionalText,
    gsm: optionalWholeNumber.optional(),
    width_cm: optionalWholeNumber.optional(),
    colour: optionalText,
  })
  .transform((lot) => ({
    ...lot,
    // Price is quoted per unit; default it to the quantity's unit.
    price_unit: lot.price_per_unit ? (lot.price_unit ?? lot.unit) : null,
    // Keep only attributes this category knows about, plus anything the seller added by hand.
    attributes: lot.attributes,
  }))

export type CreateLotInput = z.infer<typeof createLotSchema>

// Units a category offers, for validating a form post against the right list.
export function unitsFor(category: string) {
  const spec = categorySpec(category)
  return { units: spec.units, priceUnits: spec.priceUnits }
}
