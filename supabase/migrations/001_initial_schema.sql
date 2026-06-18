-- ============================================================
-- LVIF Group Control Center — Migration initiale
-- Phase 1 : CRM, Finance, Immobilier
-- Phase 2 préparée : pgvector pour RAG
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector; -- Phase 2 RAG, activé maintenant pour éviter une migration future

-- ============================================================
-- ENUM types
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'direction', 'commercial', 'immo', 'compta');
CREATE TYPE deal_status AS ENUM ('prospect', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu');
CREATE TYPE unit_status AS ENUM ('occupied', 'vacant');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'overdue');
CREATE TYPE document_type AS ENUM ('insurance', 'lease', 'other');
CREATE TYPE invoice_type AS ENUM ('receivable', 'payable');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE doc_access_level AS ENUM ('admin', 'direction', 'commercial', 'immo', 'compta', 'all');

-- ============================================================
-- TABLE: profiles (users étendus)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'commercial',
  company_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: companies
-- ============================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'led', 'events', 'advertising', 'real_estate', 'holding'
  color TEXT NOT NULL DEFAULT '#3b5ef5', -- Couleur dans l'UI
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Données initiales
INSERT INTO companies (name, short_name, type, color) VALUES
  ('LED Visual Innovation France', 'LVIF', 'led', '#3b5ef5'),
  ('Eno Events', 'ENO', 'events', '#7c3aed'),
  ('TJM Advertising Network', 'TJM', 'advertising', '#059669'),
  ('SCI Maya', 'SCI', 'real_estate', '#d97706'),
  ('Holding', 'HLD', 'holding', '#6b7280');

-- Foreign key maintenant que companies existe
ALTER TABLE profiles ADD CONSTRAINT profiles_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES companies(id);

-- ============================================================
-- MODULE 1 : COMMERCIAL (eWay CRM sync)
-- ============================================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eway_id TEXT UNIQUE, -- ID de synchronisation eWay CRM
  owner_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  title TEXT NOT NULL,
  client_name TEXT,
  amount DECIMAL(12,2),
  status deal_status NOT NULL DEFAULT 'prospect',
  next_action TEXT,
  next_action_date DATE,
  priority INTEGER DEFAULT 0 CHECK (priority BETWEEN 0 AND 3), -- 0=normal, 1=haute, 2=urgente, 3=critique
  notes TEXT,
  synced_at TIMESTAMPTZ, -- Dernière synchro depuis eWay
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'proposal', 'follow_up'
  description TEXT,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes critiques du dashboard commercial
CREATE INDEX idx_deals_next_action_date ON deals(next_action_date);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_no_action ON deals(id) WHERE next_action IS NULL AND status NOT IN ('gagne', 'perdu');

-- ============================================================
-- MODULE 2 : FINANCE
-- ============================================================

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  bank_name TEXT NOT NULL, -- 'Qonto', 'BNP', 'Crédit Mutuel'
  account_name TEXT NOT NULL,
  iban TEXT,
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  source TEXT, -- 'qonto_api', 'bnp_aggregator', 'pennylane', 'manual'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES bank_accounts(id),
  external_id TEXT, -- ID depuis la source (Qonto, agrégateur BNP)
  amount DECIMAL(12,2) NOT NULL, -- positif = crédit, négatif = débit
  label TEXT NOT NULL,
  category TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, external_id)
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  type invoice_type NOT NULL,
  counterparty TEXT NOT NULL, -- Client (receivable) ou Fournisseur (payable)
  amount DECIMAL(12,2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE,
  reference TEXT,
  notes TEXT,
  source TEXT DEFAULT 'pennylane', -- 'pennylane', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status != 'paid';

-- ============================================================
-- MODULE 3 : IMMOBILIER
-- ============================================================

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 'Saint-Rémy-de-Provence', 'Auxerre'
  city TEXT NOT NULL,
  address TEXT,
  total_surface DECIMAL(10,2) NOT NULL, -- m²
  company_id UUID REFERENCES companies(id), -- SCI Maya
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id),
  name TEXT NOT NULL, -- 'Bâtiment A - Lot 1', etc.
  surface DECIMAL(8,2) NOT NULL, -- m²
  floor TEXT,
  position_x DECIMAL(6,2), -- Pour la visualisation SVG (%)
  position_y DECIMAL(6,2),
  width DECIMAL(6,2),
  height DECIMAL(6,2),
  status unit_status NOT NULL DEFAULT 'vacant',
  monthly_rent DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  rent_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  lease_start DATE NOT NULL,
  lease_end DATE,
  lease_type TEXT DEFAULT 'bail_commercial', -- 'bail_commercial', 'bail_precaire', 'convention'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  file_url TEXT, -- URL Supabase Storage
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'missing', -- 'valid', 'expiring_soon', 'expired', 'missing'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rent_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  month CHAR(7) NOT NULL, -- Format 'YYYY-MM'
  expected_amount DECIMAL(10,2) NOT NULL,
  received_amount DECIMAL(10,2),
  payment_date DATE,
  status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, month)
);

CREATE INDEX idx_rent_payments_status ON rent_payments(status);
CREATE INDEX idx_rent_payments_month ON rent_payments(month);
CREATE INDEX idx_tenants_lease_end ON tenants(lease_end) WHERE lease_end IS NOT NULL;
CREATE INDEX idx_tenant_documents_expiry ON tenant_documents(expiry_date, status);

-- ============================================================
-- PHASE 2 : Documents RAG (activé maintenant, utilisé Phase 2)
-- ============================================================

CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  access_level doc_access_level[] DEFAULT '{all}', -- Contrôle d'accès granulaire
  source_type TEXT NOT NULL, -- 'devis_evoliz', 'fiche_technique', 'procedure', 'compte_rendu'
  source_id TEXT, -- Référence dans le système source
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index HNSW pour recherche vectorielle performante
CREATE INDEX idx_documents_embedding ON documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_documents_access ON documents USING GIN (access_level);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Helper function : récupérer le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES : chaque user voit son profil, admin voit tout
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR auth.user_role() IN ('admin', 'direction'));

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- COMPANIES : tout le monde voit les sociétés
CREATE POLICY "companies_select_all" ON companies FOR SELECT USING (true);
CREATE POLICY "companies_admin_only" ON companies FOR ALL
  USING (auth.user_role() = 'admin');

-- DEALS : commerciaux voient leurs deals + direction voit tout
CREATE POLICY "deals_select" ON deals FOR SELECT
  USING (
    auth.user_role() IN ('admin', 'direction')
    OR owner_id = auth.uid()
    OR auth.user_role() = 'compta' -- compta voit les montants
  );

CREATE POLICY "deals_insert_commercial" ON deals FOR INSERT
  WITH CHECK (auth.user_role() IN ('admin', 'direction', 'commercial'));

CREATE POLICY "deals_update" ON deals FOR UPDATE
  USING (
    auth.user_role() IN ('admin', 'direction')
    OR owner_id = auth.uid()
  );

-- FINANCE : direction + compta uniquement
CREATE POLICY "finance_select" ON bank_accounts FOR SELECT
  USING (auth.user_role() IN ('admin', 'direction', 'compta'));

CREATE POLICY "transactions_select" ON transactions FOR SELECT
  USING (auth.user_role() IN ('admin', 'direction', 'compta'));

CREATE POLICY "invoices_select" ON invoices FOR SELECT
  USING (auth.user_role() IN ('admin', 'direction', 'compta'));

-- IMMOBILIER : immo + direction + admin
CREATE POLICY "sites_select" ON sites FOR SELECT
  USING (auth.user_role() IN ('admin', 'direction', 'immo'));

CREATE POLICY "units_select" ON units FOR SELECT
  USING (auth.user_role() IN ('admin', 'direction', 'immo'));

CREATE POLICY "tenants_select" ON tenants FOR SELECT
  USING (auth.user_role() IN ('admin', 'direction', 'immo'));

CREATE POLICY "tenant_documents_select" ON tenant_documents FOR SELECT
  USING (auth.user_role() IN ('admin', 'direction', 'immo'));

CREATE POLICY "rent_payments_select" ON rent_payments FOR SELECT
  USING (auth.user_role() IN ('admin', 'direction', 'immo', 'compta'));

-- DOCUMENTS RAG : access_level contrôle ce que l'IA peut retourner
CREATE POLICY "documents_select" ON documents FOR SELECT
  USING (
    auth.user_role() = ANY(access_level::text[]::user_role[])
    OR 'all' = ANY(access_level::text[])
  );

-- ============================================================
-- TRIGGERS : updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Trigger : créer profile automatiquement à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
