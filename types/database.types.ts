// Hand-written to match supabase/migrations/0001_init.sql, in the same shape the
// Supabase CLI would generate. Once a real Supabase project exists, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > types/database.types.ts

export type UserRole = 'seller' | 'buyer' | 'both'
export type LotStatus = 'available' | 'reserved' | 'sold' | 'expired'
export type LotUnit = 'meters' | 'kg' | 'pieces' | 'yards' | 'rolls'
export type ClaimStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired'
export type DraftStatus = 'collecting' | 'awaiting_confirmation' | 'confirmed' | 'abandoned'
export type LotSource = 'web' | 'whatsapp'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          company_name: string | null
          city: string | null
          whatsapp_number: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          company_name?: string | null
          city?: string | null
          whatsapp_number?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      lots: {
        Row: {
          id: string
          seller_id: string
          category: string
          title: string | null
          spec: string | null
          gsm: number | null
          width_cm: number | null
          colour: string | null
          quantity: number
          unit: LotUnit
          price_per_unit: number
          currency: string
          location: string | null
          notes: string | null
          urgency_note: string | null
          photo_urls: string[]
          status: LotStatus
          source: LotSource
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          category: string
          title?: string | null
          spec?: string | null
          gsm?: number | null
          width_cm?: number | null
          colour?: string | null
          quantity: number
          unit: LotUnit
          price_per_unit: number
          currency?: string
          location?: string | null
          notes?: string | null
          urgency_note?: string | null
          photo_urls?: string[]
          status?: LotStatus
          source?: LotSource
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['lots']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'lots_seller_id_fkey'
            columns: ['seller_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      claims: {
        Row: {
          id: string
          lot_id: string
          buyer_id: string
          status: ClaimStatus
          // Null until the seller accepts: the 48h hold starts then, not when the request is sent.
          reserved_until: string | null
          offer_price: number | null
          offer_quantity: number | null
          message: string | null
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          buyer_id: string
          status?: ClaimStatus
          reserved_until?: string | null
          offer_price?: number | null
          offer_quantity?: number | null
          message?: string | null
          responded_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['claims']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'claims_lot_id_fkey'
            columns: ['lot_id']
            referencedRelation: 'lots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'claims_buyer_id_fkey'
            columns: ['buyer_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      swatch_requests: {
        Row: {
          id: string
          lot_id: string
          buyer_id: string
          created_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          buyer_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['swatch_requests']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'swatch_requests_lot_id_fkey'
            columns: ['lot_id']
            referencedRelation: 'lots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'swatch_requests_buyer_id_fkey'
            columns: ['buyer_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      saved_searches: {
        Row: {
          id: string
          user_id: string
          name: string
          filters: Record<string, string>
          last_seen_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          filters?: Record<string, string>
          last_seen_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['saved_searches']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'saved_searches_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      pending_listing_drafts: {
        Row: {
          id: string
          whatsapp_number: string
          raw_messages: string[]
          parsed_fields: Record<string, unknown>
          missing_fields: string[]
          photo_urls: string[]
          status: DraftStatus
          last_bot_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          whatsapp_number: string
          raw_messages?: string[]
          parsed_fields?: Record<string, unknown>
          missing_fields?: string[]
          photo_urls?: string[]
          status?: DraftStatus
          last_bot_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['pending_listing_drafts']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      lot_status: LotStatus
      lot_unit: LotUnit
      claim_status: ClaimStatus
      draft_status: DraftStatus
    }
    CompositeTypes: Record<string, never>
  }
}
