import type { LotUnit } from '@/types/database.types'

// What a lot can be, and what's worth asking for each kind. Only the universal fields (category,
// quantity, unit, location, contact) are required -- everything here is optional, so a seller can
// list in a minute and fill in the rest later. Values are stored in lots.attributes (jsonb), so
// adding a field below needs no migration.

export const LOT_CATEGORIES = ['Fibre', 'Yarns', 'Fabrics', 'Trims & accessories', 'Garments'] as const

export type LotCategory = (typeof LOT_CATEGORIES)[number]

export type AttributeField = {
  key: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: readonly string[]
  placeholder?: string
  suffix?: string
  hint?: string
  // Shown on cards and in the spec line, in this order.
  summary?: boolean
}

export type CategorySpec = {
  blurb: string
  units: readonly LotUnit[]
  priceUnits: readonly LotUnit[]
  titlePlaceholder: string
  fields: readonly AttributeField[]
}

const GREIGE_DYED = ['Greige', 'Dyed', 'Melange', 'Mixed shades'] as const

export const CATEGORY_SPECS: Record<LotCategory, CategorySpec> = {
  Fibre: {
    blurb: 'Raw or processed fibre, in bales or loose.',
    units: ['kg', 'tonnes', 'bales'],
    priceUnits: ['kg'],
    titlePlaceholder: 'Combed cotton fibre',
    fields: [
      {
        key: 'fibre_type',
        label: 'Fibre',
        type: 'select',
        options: ['Cotton', 'Polyester', 'Viscose', 'Wool', 'Silk', 'Linen / flax', 'Acrylic', 'Recycled', 'Blend', 'Other'],
        summary: true,
      },
      {
        key: 'form',
        label: 'Form',
        type: 'select',
        options: ['Raw / ginned', 'Carded', 'Combed', 'Tow', 'Noil / waste', 'Recycled fibre'],
        summary: true,
      },
      { key: 'staple_length', label: 'Staple length', type: 'number', suffix: 'mm', summary: true },
      { key: 'micronaire', label: 'Micronaire', type: 'text', placeholder: '3.8', hint: 'Cotton only' },
      { key: 'denier', label: 'Denier', type: 'text', placeholder: '1.2D', hint: 'Man-made fibre' },
      { key: 'colour', label: 'Colour', type: 'select', options: [...GREIGE_DYED] },
      { key: 'bale_count', label: 'Bales', type: 'number' },
      { key: 'grade', label: 'Grade', type: 'text', placeholder: 'Shankar-6, J-34…' },
    ],
  },

  Yarns: {
    blurb: 'Spun yarn on cones, hanks or cheeses.',
    units: ['kg', 'tonnes', 'cones', 'hanks', 'cartons'],
    priceUnits: ['kg'],
    titlePlaceholder: '30s combed cotton yarn',
    fields: [
      // Counts are written several ways in the trade (Ne 30/1, 2/40, 1200/2 denier), so the number
      // is free text and the system sits beside it.
      { key: 'count', label: 'Count', type: 'text', placeholder: '30/1', summary: true },
      { key: 'count_system', label: 'System', type: 'select', options: ['Ne', 'Nm', 'Denier', 'Tex'], summary: true },
      { key: 'ply', label: 'Ply', type: 'select', options: ['Single', '2-ply', '3-ply', '4-ply or more'] },
      { key: 'composition', label: 'Composition', type: 'text', placeholder: '60% cotton 40% poly', summary: true },
      { key: 'spinning', label: 'Spinning', type: 'select', options: ['Ring', 'Open-end / rotor', 'Vortex', 'Air-jet', 'Hand spun'] },
      { key: 'form', label: 'Form', type: 'select', options: ['Cone', 'Hank', 'Cheese', 'Bobbin'] },
      { key: 'colour', label: 'Colour', type: 'select', options: [...GREIGE_DYED], summary: true },
      { key: 'shade', label: 'Shade / dye lot', type: 'text', placeholder: 'Sage, 2 lots' },
      { key: 'twist', label: 'Twist (TPI)', type: 'text' },
      { key: 'end_use', label: 'For', type: 'select', options: ['Knitting', 'Weaving', 'Hosiery', 'Industrial'] },
    ],
  },

  Fabrics: {
    blurb: 'Woven or knitted fabric, by the roll or by weight.',
    units: ['meters', 'yards', 'kg', 'rolls'],
    priceUnits: ['meters', 'yards', 'kg'],
    titlePlaceholder: 'Organic cotton jersey',
    fields: [
      { key: 'composition', label: 'Composition', type: 'text', placeholder: '100% cotton', summary: true },
      {
        key: 'construction',
        label: 'Construction',
        type: 'select',
        options: ['Knit — single jersey', 'Knit — interlock / rib', 'Knit — fleece / terry', 'Woven — plain', 'Woven — twill', 'Woven — satin', 'Woven — dobby / jacquard', 'Denim', 'Non-woven'],
        summary: true,
      },
      { key: 'gsm', label: 'GSM', type: 'number', suffix: 'GSM', summary: true },
      { key: 'width_cm', label: 'Width', type: 'number', suffix: 'cm', summary: true },
      { key: 'colour', label: 'Colour', type: 'text', placeholder: 'Ecru, undyed', summary: true },
      { key: 'dye_lot', label: 'Dye lots', type: 'text', placeholder: '2 lots' },
      { key: 'finish', label: 'Finish', type: 'text', placeholder: 'Bio-washed, mercerised…' },
      { key: 'rolls', label: 'Rolls', type: 'number' },
      { key: 'roll_length', label: 'Average roll', type: 'number', suffix: 'm' },
      { key: 'grade', label: 'Grade', type: 'select', options: ['A grade', 'Sorted / B grade', 'Mixed'] },
      { key: 'certificates', label: 'Certificates', type: 'text', placeholder: 'GOTS, OEKO-TEX…', hint: 'As supplied by the mill' },
    ],
  },

  'Trims & accessories': {
    blurb: 'Buttons, zips, labels, thread, elastic and the rest.',
    units: ['pieces', 'gross', 'boxes', 'cartons', 'rolls', 'cones', 'kg'],
    priceUnits: ['pieces', 'gross', 'kg'],
    titlePlaceholder: 'YKK metal zips, 18 cm',
    fields: [
      {
        key: 'trim_type',
        label: 'Type',
        type: 'select',
        options: ['Buttons', 'Zips', 'Labels / tags', 'Sewing thread', 'Elastic / tape', 'Interlining', 'Hooks / rivets', 'Drawcords', 'Lace', 'Packaging', 'Other'],
        summary: true,
      },
      { key: 'material', label: 'Material', type: 'text', placeholder: 'Metal, poly, horn…', summary: true },
      { key: 'size', label: 'Size', type: 'text', placeholder: '18 cm / 24 ligne / 20 mm', summary: true },
      { key: 'colour', label: 'Colour', type: 'text', placeholder: 'Antique brass' },
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'YKK, Coats…', summary: true },
      { key: 'packing', label: 'Packing', type: 'text', placeholder: '144 per box' },
    ],
  },

  Garments: {
    blurb: 'Finished garments: export surplus, cancelled orders, stocklots.',
    units: ['pieces', 'sets', 'cartons'],
    priceUnits: ['pieces', 'sets'],
    titlePlaceholder: "Men's cotton polo shirts",
    fields: [
      { key: 'product_type', label: 'Product', type: 'text', placeholder: 'Polo shirt, denim jacket…', summary: true },
      { key: 'audience', label: 'For', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls', 'Infants'], summary: true },
      { key: 'sizes', label: 'Sizes', type: 'text', placeholder: 'S–XXL', summary: true },
      { key: 'size_ratio', label: 'Size ratio', type: 'text', placeholder: 'S2 M4 L4 XL2' },
      { key: 'composition', label: 'Fabric', type: 'text', placeholder: '100% cotton, 180 GSM', summary: true },
      { key: 'labels', label: 'Labels', type: 'select', options: ['Branded', 'De-labelled', 'Unbranded', 'Own label possible'] },
      { key: 'grade', label: 'Grade', type: 'select', options: ['A grade', 'Seconds', 'Mixed stocklot'], summary: true },
      { key: 'packing', label: 'Packing', type: 'text', placeholder: 'Poly-bagged, 50 per carton' },
      { key: 'season', label: 'Season', type: 'text', placeholder: 'SS26' },
    ],
  },
}

export function isLotCategory(value: unknown): value is LotCategory {
  return typeof value === 'string' && (LOT_CATEGORIES as readonly string[]).includes(value)
}

export function categorySpec(category: string): CategorySpec {
  return isLotCategory(category) ? CATEGORY_SPECS[category] : CATEGORY_SPECS.Fabrics
}

export type LotAttributes = Record<string, string>

// "180 GSM · 150 cm · Ecru" -- the handful of fields worth showing on a card, in spec order.
export function attributeSummary(category: string, attributes: LotAttributes | null): string[] {
  if (!attributes) return []
  return categorySpec(category)
    .fields.filter((field) => field.summary)
    .map((field) => {
      const value = attributes[field.key]?.trim()
      if (!value) return null
      if (field.key === 'count' && attributes.count_system) return null // paired below
      if (field.key === 'count_system') {
        const count = attributes.count?.trim()
        return count ? `${attributes.count_system} ${count}` : value
      }
      return field.suffix ? `${value} ${field.suffix}` : value
    })
    .filter((part): part is string => Boolean(part))
}

// Every filled-in field, for the detail page's spec table.
export function attributeRows(category: string, attributes: LotAttributes | null): [string, string][] {
  if (!attributes) return []
  const spec = categorySpec(category)
  const known = spec.fields
    .map((field): [string, string] | null => {
      const value = attributes[field.key]?.trim()
      if (!value) return null
      return [field.label, field.suffix ? `${value} ${field.suffix}` : value]
    })
    .filter((row): row is [string, string] => row !== null)

  // Anything the seller added themselves, or that an older listing carries.
  const knownKeys = new Set(spec.fields.map((field) => field.key))
  const extra = Object.entries(attributes)
    .filter(([key, value]) => !knownKeys.has(key) && String(value).trim())
    .map(([key, value]): [string, string] => [key.replace(/_/g, ' '), String(value)])

  return [...known, ...extra]
}
