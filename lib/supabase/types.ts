// ⚠️ Auto-généré depuis Supabase — ne pas modifier manuellement
// Régénéré le 2026-06-23 via MCP generate_typescript_types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      actions_log: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          type: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          type: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_log_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          balance: number
          bank_name: string
          company_id: string
          currency: string
          iban: string | null
          id: string
          source: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          balance?: number
          bank_name: string
          company_id: string
          currency?: string
          iban?: string | null
          id?: string
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          balance?: number
          bank_name?: string
          company_id?: string
          currency?: string
          iban?: string | null
          id?: string
          source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          short_name: string
          type: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          short_name: string
          type: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          short_name?: string
          type?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          amount: number | null
          client_name: string | null
          company_id: string | null
          created_at: string | null
          eway_id: string | null
          id: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          owner_id: string | null
          priority: number | null
          status: Database["public"]["Enums"]["deal_status"]
          synced_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          client_name?: string | null
          company_id?: string | null
          created_at?: string | null
          eway_id?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          owner_id?: string | null
          priority?: number | null
          status?: Database["public"]["Enums"]["deal_status"]
          synced_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          client_name?: string | null
          company_id?: string | null
          created_at?: string | null
          eway_id?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          owner_id?: string | null
          priority?: number | null
          status?: Database["public"]["Enums"]["deal_status"]
          synced_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_level: Database["public"]["Enums"]["doc_access_level"][] | null
          content: string
          created_at: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          source_id: string | null
          source_type: string
          title: string
        }
        Insert: {
          access_level?:
            | Database["public"]["Enums"]["doc_access_level"][]
            | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          source_id?: string | null
          source_type: string
          title: string
        }
        Update: {
          access_level?:
            | Database["public"]["Enums"]["doc_access_level"][]
            | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          source_id?: string | null
          source_type?: string
          title?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          company_id: string
          counterparty: string
          created_at: string | null
          due_date: string | null
          id: string
          issue_date: string
          notes: string | null
          reference: string | null
          source: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          type: Database["public"]["Enums"]["invoice_type"]
        }
        Insert: {
          amount: number
          company_id: string
          counterparty: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          issue_date: string
          notes?: string | null
          reference?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          type: Database["public"]["Enums"]["invoice_type"]
        }
        Update: {
          amount?: number
          company_id?: string
          counterparty?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          reference?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          type?: Database["public"]["Enums"]["invoice_type"]
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_payments: {
        Row: {
          created_at: string | null
          expected_amount: number
          id: string
          month: string
          notes: string | null
          payment_date: string | null
          received_amount: number | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          expected_amount: number
          id?: string
          month: string
          notes?: string | null
          payment_date?: string | null
          received_amount?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          expected_amount?: number
          id?: string
          month?: string
          notes?: string | null
          payment_date?: string | null
          received_amount?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          city: string
          company_id: string | null
          created_at: string | null
          id: string
          name: string
          total_surface: number
        }
        Insert: {
          address?: string | null
          city: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          total_surface: number
        }
        Update: {
          address?: string | null
          city?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          total_surface?: number
        }
        Relationships: [
          {
            foreignKeyName: "sites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_documents: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          file_url: string | null
          id: string
          notes: string | null
          status: string
          tenant_id: string
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: string
          tenant_id: string
          type: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tenant_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          deposit_amount: number | null
          id: string
          lease_end: string | null
          lease_start: string
          lease_type: string | null
          rent_amount: number
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          id?: string
          lease_end?: string | null
          lease_start: string
          lease_type?: string | null
          rent_amount: number
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          id?: string
          lease_end?: string | null
          lease_start?: string
          lease_type?: string | null
          rent_amount?: number
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string | null
          external_id: string | null
          id: string
          label: string
          transaction_date: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          label: string
          transaction_date: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          label?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string | null
          floor: string | null
          height: number | null
          id: string
          monthly_rent: number | null
          name: string
          position_x: number | null
          position_y: number | null
          site_id: string
          status: Database["public"]["Enums"]["unit_status"]
          surface: number
          width: number | null
        }
        Insert: {
          created_at?: string | null
          floor?: string | null
          height?: number | null
          id?: string
          monthly_rent?: number | null
          name: string
          position_x?: number | null
          position_y?: number | null
          site_id: string
          status?: Database["public"]["Enums"]["unit_status"]
          surface: number
          width?: number | null
        }
        Update: {
          created_at?: string | null
          floor?: string | null
          height?: number | null
          id?: string
          monthly_rent?: number | null
          name?: string
          position_x?: number | null
          position_y?: number | null
          site_id?: string
          status?: Database["public"]["Enums"]["unit_status"]
          surface?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "units_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      deal_status:
        | "prospect"
        | "qualification"
        | "proposition"
        | "negociation"
        | "gagne"
        | "perdu"
      doc_access_level:
        | "admin"
        | "direction"
        | "commercial"
        | "immo"
        | "compta"
        | "all"
      document_type: "insurance" | "lease" | "other"
      invoice_status: "draft" | "sent" | "paid" | "overdue"
      invoice_type: "receivable" | "payable"
      payment_status: "paid" | "pending" | "overdue"
      unit_status: "occupied" | "vacant"
      user_role: "admin" | "direction" | "commercial" | "immo" | "compta"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Database

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
      deal_status: [
        "prospect",
        "qualification",
        "proposition",
        "negociation",
        "gagne",
        "perdu",
      ],
      doc_access_level: [
        "admin",
        "direction",
        "commercial",
        "immo",
        "compta",
        "all",
      ],
      document_type: ["insurance", "lease", "other"],
      invoice_status: ["draft", "sent", "paid", "overdue"],
      invoice_type: ["receivable", "payable"],
      payment_status: ["paid", "pending", "overdue"],
      unit_status: ["occupied", "vacant"],
      user_role: ["admin", "direction", "commercial", "immo", "compta"],
    },
  },
} as const
