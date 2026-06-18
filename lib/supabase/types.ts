// Types générés à partir du schéma Supabase
// Régénérer avec : npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
//
// NOTE: chaque table expose un champ `Relationships` (même vide). Il est requis par
// le contrat `GenericSchema` de @supabase/supabase-js (>= 2.x). Sans lui, la totalité
// du schéma cesse d'être reconnue et toutes les requêtes retournent le type `never`.

export type UserRole = "admin" | "direction" | "commercial" | "immo" | "compta";

export type DealStatus =
  | "prospect"
  | "qualification"
  | "proposition"
  | "negociation"
  | "gagne"
  | "perdu";

export type UnitStatus = "occupied" | "vacant";

export type PaymentStatus = "paid" | "pending" | "overdue";

export type DocumentType = "insurance" | "lease" | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          type: string;
          color: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["companies"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          eway_id: string | null;
          owner_id: string | null;
          company_id: string | null;
          title: string;
          client_name: string | null;
          amount: number | null;
          status: DealStatus;
          next_action: string | null;
          next_action_date: string | null;
          notes: string | null;
          synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deals"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "deals_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bank_accounts: {
        Row: {
          id: string;
          company_id: string;
          bank_name: string;
          account_name: string;
          balance: number;
          currency: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bank_accounts"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["bank_accounts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          company_id: string;
          type: "receivable" | "payable";
          counterparty: string;
          amount: number;
          status: "draft" | "sent" | "paid" | "overdue";
          issue_date: string;
          due_date: string | null;
          reference: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      sites: {
        Row: {
          id: string;
          name: string;
          city: string;
          total_surface: number;
          address: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sites"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["sites"]["Insert"]>;
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          surface: number;
          floor: string | null;
          status: UnitStatus;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["units"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "units_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          id: string;
          unit_id: string;
          company_name: string;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          rent_amount: number;
          deposit_amount: number | null;
          lease_start: string;
          lease_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tenants"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "tenants_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_documents: {
        Row: {
          id: string;
          tenant_id: string;
          type: DocumentType;
          file_url: string | null;
          expiry_date: string | null;
          status: "valid" | "expiring_soon" | "expired" | "missing";
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tenant_documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["tenant_documents"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "tenant_documents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      rent_payments: {
        Row: {
          id: string;
          tenant_id: string;
          month: string; // YYYY-MM
          expected_amount: number;
          received_amount: number | null;
          payment_date: string | null;
          status: PaymentStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["rent_payments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["rent_payments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "rent_payments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      // Préparé pour Phase 2 RAG
      documents: {
        Row: {
          id: string;
          title: string;
          content: string;
          metadata: Record<string, unknown>;
          embedding: number[] | null; // vector(1536) via pgvector
          access_level: UserRole[];
          source_type: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
