import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { LOT_CATEGORIES, LOT_UNITS } from '@/lib/constants'

const extractedListingSchema = z.object({
  category: z.string().nullable(),
  title: z.string().nullable(),
  spec: z.string().nullable(),
  gsm: z.number().int().positive().nullable(),
  width_cm: z.number().int().positive().nullable(),
  colour: z.string().nullable(),
  quantity: z.number().positive().nullable(),
  unit: z.enum(LOT_UNITS).nullable(),
  price_per_unit: z.number().positive().nullable(),
  currency: z.string(),
  location: z.string().nullable(),
  urgency_note: z.string().nullable(),
  notes: z.string().nullable(),
})

export type ExtractedListing = z.infer<typeof extractedListingSchema>

export const REQUIRED_LISTING_FIELDS = ['category', 'quantity', 'unit', 'price_per_unit'] as const

const TOOL_NAME = 'record_listing_fields'

let client: Anthropic | null = null
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return client
}

// Also the defaults for drafts saved before title/gsm/width_cm/colour existed: spreading an older
// draft's parsed_fields over this keeps the newer keys null instead of undefined.
const emptyFields: ExtractedListing = {
  category: null,
  title: null,
  spec: null,
  gsm: null,
  width_cm: null,
  colour: null,
  quantity: null,
  unit: null,
  price_per_unit: null,
  currency: 'INR',
  location: null,
  urgency_note: null,
  notes: null,
}

// Extracts structured listing fields from one WhatsApp message. Only reports
// fields explicitly present in `newMessage` -- merging with prior state is done
// deterministically in code below, not left to the model, so a correction like
// "actually 1800m not 2000" reliably overrides just that one field.
export async function extractListingFields({
  newMessage,
  existingFields,
}: {
  newMessage: string
  existingFields?: Partial<ExtractedListing>
}): Promise<ExtractedListing> {
  const system =
    'You extract structured textile/fabric surplus listing data from a WhatsApp message ' +
    'sent by a seller (mill owner or broker). Call the record_listing_fields tool with ONLY ' +
    'the fields explicitly mentioned or corrected in this specific message -- omit any field ' +
    'not mentioned. Quantities and prices must be plain numbers with no currency symbols or ' +
    'unit text mixed in. GSM and width are whole numbers; convert a width given in inches to ' +
    'centimetres (x 2.54, rounded).'

  const message = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: newMessage }],
    tools: [
      {
        name: TOOL_NAME,
        description: 'Record structured fields extracted from a surplus textile listing message.',
        input_schema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: [...LOT_CATEGORIES],
              description: 'Material category. Use Blended for mixed fibres and Other if none fit.',
            },
            title: {
              type: 'string',
              description:
                'Short name buyers will see, e.g. "Organic cotton jersey" or "Linen twill". Only ' +
                'if the message makes the fabric clear.',
            },
            spec: {
              type: 'string',
              description: 'Any other spec detail, e.g. yarn count, weave, composition, finish',
            },
            gsm: { type: 'integer', description: 'Fabric weight in GSM' },
            width_cm: { type: 'integer', description: 'Fabric width in centimetres' },
            colour: { type: 'string', description: 'Colour or shade, e.g. "ecru, undyed"' },
            quantity: { type: 'number' },
            unit: { type: 'string', enum: [...LOT_UNITS] },
            price_per_unit: { type: 'number', description: 'Price per single unit' },
            currency: { type: 'string' },
            location: { type: 'string', description: 'City or region' },
            urgency_note: { type: 'string', description: 'e.g. "need to clear by Friday"' },
            notes: { type: 'string' },
          },
          required: [],
        },
      },
    ],
    tool_choice: { type: 'tool', name: TOOL_NAME },
  })

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  )
  if (!toolUse) throw new Error('Claude did not return structured listing fields.')

  const raw = toolUse.input as Partial<Record<keyof ExtractedListing, unknown>>
  const base = { ...emptyFields, ...existingFields }

  const merged: ExtractedListing = {
    category: normalizeCategory(raw.category) ?? base.category,
    title: (raw.title as string | undefined) ?? base.title,
    spec: (raw.spec as string | undefined) ?? base.spec,
    gsm: wholeNumber(raw.gsm) ?? base.gsm,
    width_cm: wholeNumber(raw.width_cm) ?? base.width_cm,
    colour: (raw.colour as string | undefined) ?? base.colour,
    quantity: (raw.quantity as number | undefined) ?? base.quantity,
    unit: (raw.unit as ExtractedListing['unit']) ?? base.unit,
    price_per_unit: (raw.price_per_unit as number | undefined) ?? base.price_per_unit,
    currency: (raw.currency as string | undefined) ?? base.currency,
    location: (raw.location as string | undefined) ?? base.location,
    urgency_note: (raw.urgency_note as string | undefined) ?? base.urgency_note,
    notes: (raw.notes as string | undefined) ?? base.notes,
  }

  return extractedListingSchema.parse(merged)
}

// Keeps categories on the fixed list the feed's chips filter by, whatever casing the model uses.
function normalizeCategory(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  return LOT_CATEGORIES.find((category) => category.toLowerCase() === value.trim().toLowerCase()) ?? 'Other'
}

// The model occasionally sends 180.0 or "180"; anything that isn't a positive number is ignored
// rather than failing the whole extraction on an optional field.
function wholeNumber(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined
}

export function computeMissingFields(fields: Partial<ExtractedListing>): string[] {
  return REQUIRED_LISTING_FIELDS.filter((f) => fields[f] === null || fields[f] === undefined)
}
