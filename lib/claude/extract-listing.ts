import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { LOT_UNITS } from '@/lib/constants'
import { CATEGORY_SPECS, LOT_CATEGORIES, categorySpec, isLotCategory } from '@/lib/lots/categories'

// Turns a seller's WhatsApp message into listing fields. Only `category`, `quantity` and `unit` are
// needed to publish -- price can be "on request" and everything else is optional, so a seller can
// send two lines and still end up with a listing.

const extractedListingSchema = z.object({
  category: z.string().nullable(),
  title: z.string().nullable(),
  quantity: z.number().positive().nullable(),
  unit: z.enum(LOT_UNITS).nullable(),
  price_per_unit: z.number().positive().nullable(),
  price_unit: z.enum(LOT_UNITS).nullable(),
  currency: z.string(),
  location: z.string().nullable(),
  urgency_note: z.string().nullable(),
  notes: z.string().nullable(),
  // Category-specific details (GSM, count, size ratio...), keyed as in lib/lots/categories.ts.
  attributes: z.record(z.string(), z.string()),
})

export type ExtractedListing = z.infer<typeof extractedListingSchema>

export const REQUIRED_LISTING_FIELDS = ['category', 'quantity', 'unit'] as const

const TOOL_NAME = 'record_listing_fields'

let client: Anthropic | null = null
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return client
}

const emptyFields: ExtractedListing = {
  category: null,
  title: null,
  quantity: null,
  unit: null,
  price_per_unit: null,
  price_unit: null,
  currency: 'INR',
  location: null,
  urgency_note: null,
  notes: null,
  attributes: {},
}

// Every attribute key the model may use, with the category it belongs to, so the prompt can name
// them and anything invented gets dropped.
const ATTRIBUTE_GUIDE = LOT_CATEGORIES.map(
  (category) => `${category}: ${CATEGORY_SPECS[category].fields.map((field) => field.key).join(', ')}`
).join('\n')

export async function extractListingFields({
  newMessage,
  existingFields,
}: {
  newMessage: string
  existingFields?: Partial<ExtractedListing>
}): Promise<ExtractedListing> {
  const system =
    'You extract structured surplus-textile listing data from a WhatsApp message sent by a seller ' +
    '(mill owner, agent or broker). Call the record_listing_fields tool with ONLY the fields ' +
    'explicitly mentioned or corrected in this specific message -- omit anything not mentioned. ' +
    'Quantities and prices are plain numbers, with no currency symbols or unit text. Put ' +
    'category-specific details in `attributes`, using only these keys:\n' +
    ATTRIBUTE_GUIDE

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
            category: { type: 'string', enum: [...LOT_CATEGORIES] },
            title: { type: 'string', description: 'Short name buyers will see, e.g. "Organic cotton jersey"' },
            quantity: { type: 'number' },
            unit: { type: 'string', enum: [...LOT_UNITS] },
            price_per_unit: { type: 'number', description: 'Omit if the seller says price on request' },
            price_unit: { type: 'string', enum: [...LOT_UNITS], description: 'The unit the price is per' },
            currency: { type: 'string' },
            location: { type: 'string', description: 'City or region where the stock is' },
            urgency_note: { type: 'string', description: 'e.g. "need to clear by Friday"' },
            notes: { type: 'string' },
            attributes: {
              type: 'object',
              description: 'Category-specific details, as plain strings. Use only the listed keys.',
              additionalProperties: { type: 'string' },
            },
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

  const raw = toolUse.input as Record<string, unknown>
  const base = { ...emptyFields, ...existingFields }
  const category = normalizeCategory(raw.category) ?? base.category

  const merged: ExtractedListing = {
    category,
    title: (raw.title as string | undefined) ?? base.title,
    quantity: positiveNumber(raw.quantity) ?? base.quantity,
    unit: (raw.unit as ExtractedListing['unit']) ?? base.unit,
    price_per_unit: positiveNumber(raw.price_per_unit) ?? base.price_per_unit,
    price_unit: (raw.price_unit as ExtractedListing['price_unit']) ?? base.price_unit,
    currency: (raw.currency as string | undefined) ?? base.currency,
    location: (raw.location as string | undefined) ?? base.location,
    urgency_note: (raw.urgency_note as string | undefined) ?? base.urgency_note,
    notes: (raw.notes as string | undefined) ?? base.notes,
    // A correction replaces the fields it mentions and leaves the rest alone.
    attributes: { ...base.attributes, ...cleanAttributes(raw.attributes, category) },
  }

  return extractedListingSchema.parse(merged)
}

function normalizeCategory(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const match = LOT_CATEGORIES.find((category) => category.toLowerCase() === value.trim().toLowerCase())
  return match ?? 'Fabrics'
}

function positiveNumber(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined
}

// Keeps only keys the category actually defines, so a hallucinated field never reaches a listing.
function cleanAttributes(value: unknown, category: string | null): Record<string, string> {
  if (!value || typeof value !== 'object') return {}
  const allowed = new Set(
    (isLotCategory(category) ? categorySpec(category) : categorySpec('Fabrics')).fields.map((f) => f.key)
  )
  const out: Record<string, string> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!allowed.has(key)) continue
    const text = String(raw ?? '').trim()
    if (text) out[key] = text.slice(0, 200)
  }
  return out
}

export function computeMissingFields(fields: Partial<ExtractedListing>): string[] {
  return REQUIRED_LISTING_FIELDS.filter((field) => fields[field] === null || fields[field] === undefined)
}
