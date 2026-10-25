// Hand-written to match supabase/migrations/*.sql, in the same shape the Supabase CLI would
// generate. Once a real Supabase project exists, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > types/database.types.ts

export type UserRole = 'seller' | 'buyer' | 'both'
// 'reserved' is left over from the old claim flow and no longer used (see migration 0007).
export type LotStatus = 'available' | 'reserved' | 'sold' | 'expired'
export type LotUnit =
  | 'meters'
  | 'yards'
  | 'kg'
  | 'tonnes'
  | 'pieces'
  | 'rolls'
  | 'bales'
  | 'cones'
  | 'hanks'
  | 'cartons'
  | 'boxes'
  | 'gross'
  | 'sets'
export type VerificationStatus = 'none' | 'requested' | 'scheduled' | 'verified'
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
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          company_name?: string | null
          city?: string | null
          whatsapp_number?: string | null
          role?: UserRole
          is_admin?: boolean
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
          // Category-specific details; shape per category lives in lib/lots/categories.ts.
          attributes: Record<string, string>
          quantity: number
          unit: LotUnit
          // Null means "price on request".
          price_per_unit: number | null
          // Stock can be counted in one unit and priced in another (rolls held, sold per metre).
          price_unit: LotUnit | null
          currency: string
          location: string | null
          contact_phone: string | null
          contact_name: string | null
          notes: string | null
          urgency_note: string | null
          photo_urls: string[]
          status: LotStatus
          source: LotSource
          verification: VerificationStatus
          verification_requested_at: string | null
          verified_at: string | null
          verified_by: string | null
          verification_notes: string | null
          verification_photo_urls: string[]
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
          attributes?: Record<string, string>
          quantity: number
          unit: LotUnit
          price_per_unit?: number | null
          price_unit?: LotUnit | null
          currency?: string
          location?: string | null
          contact_phone?: string | null
          contact_name?: string | null
          notes?: string | null
          urgency_note?: string | null
          photo_urls?: string[]
          status?: LotStatus
          source?: LotSource
          verification?: VerificationStatus
          verification_requested_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verification_notes?: string | null
          verification_photo_urls?: string[]
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
      contact_views: {
        Row: {
          id: string
          lot_id: string
          viewer_id: string
          created_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          viewer_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['contact_views']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'contact_views_lot_id_fkey'
            columns: ['lot_id']
            referencedRelation: 'lots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_views_viewer_id_fkey'
            columns: ['viewer_id']
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
      verification_status: VerificationStatus
      draft_status: DraftStatus
    }
    CompositeTypes: Record<string, never>
  }
}
