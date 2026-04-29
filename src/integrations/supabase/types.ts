export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contact_requests: {
        Row: {
          created_at: string
          email: string
          event_date: string | null
          event_type: string | null
          expected_guests: number | null
          id: string
          message: string | null
          name: string
          phone: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_date?: string | null
          event_type?: string | null
          expected_guests?: number | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_date?: string | null
          event_type?: string | null
          expected_guests?: number | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ecard_templates: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_global: boolean
          name: string
          overlay_style: string
          text_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_global?: boolean
          name: string
          overlay_style?: string
          text_color?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_global?: boolean
          name?: string
          overlay_style?: string
          text_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          budget: number | null
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          max_guests: number | null
          photo_url: string | null
          sms_allocation: number
          status: string
          subscription_amount: number | null
          subscription_package: string | null
          title: string
          updated_at: string
          user_id: string
          venue: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description?: string | null
          event_date: string
          event_type?: string
          id?: string
          max_guests?: number | null
          photo_url?: string | null
          sms_allocation?: number
          status?: string
          subscription_amount?: number | null
          subscription_package?: string | null
          title: string
          updated_at?: string
          user_id: string
          venue?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          max_guests?: number | null
          photo_url?: string | null
          sms_allocation?: number
          status?: string
          subscription_amount?: number | null
          subscription_package?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          venue?: string | null
        }
        Relationships: []
      }
      guests: {
        Row: {
          barcode: string | null
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
          email: string | null
          event_id: string
          full_name: string
          id: string
          phone: string | null
          rsvp_status: string
          table_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          email?: string | null
          event_id: string
          full_name: string
          id?: string
          phone?: string | null
          rsvp_status?: string
          table_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          email?: string | null
          event_id?: string
          full_name?: string
          id?: string
          phone?: string | null
          rsvp_status?: string
          table_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          contact_person: string | null
          created_at: string
          discount_amount: number
          discount_type: string | null
          discount_value: number
          event_id: string | null
          grand_total: number
          id: string
          invoice_number: string
          items: Json
          payment_due_days: number
          payment_method: string | null
          quotation_id: string | null
          status: string
          subtotal: number
          updated_at: string
          user_id: string
          vat_amount: number
          vat_enabled: boolean
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          contact_person?: string | null
          created_at?: string
          discount_amount?: number
          discount_type?: string | null
          discount_value?: number
          event_id?: string | null
          grand_total?: number
          id?: string
          invoice_number: string
          items?: Json
          payment_due_days?: number
          payment_method?: string | null
          quotation_id?: string | null
          status?: string
          subtotal?: number
          updated_at?: string
          user_id: string
          vat_amount?: number
          vat_enabled?: boolean
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          contact_person?: string | null
          created_at?: string
          discount_amount?: number
          discount_type?: string | null
          discount_value?: number
          event_id?: string | null
          grand_total?: number
          id?: string
          invoice_number?: string
          items?: Json
          payment_due_days?: number
          payment_method?: string | null
          quotation_id?: string | null
          status?: string
          subtotal?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number
          vat_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          price: number
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          price?: number
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          price?: number
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          event_id: string
          id: string
          payer_name: string
          payment_method: string
          reference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          event_id: string
          id?: string
          payer_name: string
          payment_method?: string
          reference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          event_id?: string
          id?: string
          payer_name?: string
          payment_method?: string
          reference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      pledges: {
        Row: {
          amount: number
          created_at: string
          event_id: string
          guest_id: string | null
          guest_name: string
          id: string
          notes: string | null
          paid_amount: number
          payment_method: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          event_id: string
          guest_id?: string | null
          guest_name: string
          id?: string
          notes?: string | null
          paid_amount?: number
          payment_method?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          event_id?: string
          guest_id?: string | null
          guest_name?: string
          id?: string
          notes?: string | null
          paid_amount?: number
          payment_method?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pledges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledges_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          contact_person: string | null
          created_at: string
          discount_amount: number
          discount_type: string | null
          discount_value: number
          event_id: string | null
          grand_total: number
          id: string
          items: Json
          quotation_number: string
          status: string
          subtotal: number
          updated_at: string
          user_id: string
          validity_days: number
          vat_amount: number
          vat_enabled: boolean
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          contact_person?: string | null
          created_at?: string
          discount_amount?: number
          discount_type?: string | null
          discount_value?: number
          event_id?: string | null
          grand_total?: number
          id?: string
          items?: Json
          quotation_number: string
          status?: string
          subtotal?: number
          updated_at?: string
          user_id: string
          validity_days?: number
          vat_amount?: number
          vat_enabled?: boolean
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          contact_person?: string | null
          created_at?: string
          discount_amount?: number
          discount_type?: string | null
          discount_value?: number
          event_id?: string | null
          grand_total?: number
          id?: string
          items?: Json
          quotation_number?: string
          status?: string
          subtotal?: number
          updated_at?: string
          user_id?: string
          validity_days?: number
          vat_amount?: number
          vat_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "quotations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount_in_words: string | null
          amount_paid: number
          created_at: string
          id: string
          invoice_id: string | null
          payment_method: string
          receipt_number: string
          remarks: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_in_words?: string | null
          amount_paid?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          payment_method?: string
          receipt_number: string
          remarks?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_in_words?: string | null
          amount_paid?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          payment_method?: string
          receipt_number?: string
          remarks?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          beem_response: Json | null
          created_at: string
          event_id: string | null
          id: string
          message: string
          recipient_name: string | null
          recipient_phone: string
          scheduled_at: string | null
          sent_at: string | null
          sms_count: number
          status: string
          user_id: string
        }
        Insert: {
          beem_response?: Json | null
          created_at?: string
          event_id?: string | null
          id?: string
          message: string
          recipient_name?: string | null
          recipient_phone: string
          scheduled_at?: string | null
          sent_at?: string | null
          sms_count?: number
          status?: string
          user_id: string
        }
        Update: {
          beem_response?: Json | null
          created_at?: string
          event_id?: string | null
          id?: string
          message?: string
          recipient_name?: string | null
          recipient_phone?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sms_count?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          beem_response: Json | null
          channel: string
          created_at: string
          event_id: string | null
          id: string
          media_url: string | null
          message_content: string | null
          message_type: string
          recipient_name: string | null
          recipient_phone: string
          status: string
          template_id: number | null
          template_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          beem_response?: Json | null
          channel?: string
          created_at?: string
          event_id?: string | null
          id?: string
          media_url?: string | null
          message_content?: string | null
          message_type?: string
          recipient_name?: string | null
          recipient_phone: string
          status?: string
          template_id?: number | null
          template_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          beem_response?: Json | null
          channel?: string
          created_at?: string
          event_id?: string | null
          id?: string
          media_url?: string | null
          message_content?: string | null
          message_type?: string
          recipient_name?: string | null
          recipient_phone?: string
          status?: string
          template_id?: number | null
          template_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_invoice_number: { Args: never; Returns: string }
      next_quotation_number: { Args: never; Returns: string }
      next_receipt_number: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
