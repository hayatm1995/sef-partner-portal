-- Migration: Contracts Workflow
-- Creates contracts table with full workflow support

-- TABLE: contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  contract_type TEXT CHECK (contract_type IN ('Sponsorship', 'Media', 'Retail', 'Partnership', 'Other')) DEFAULT 'Partnership',
  file_url_original TEXT,
  file_url_signed TEXT,
  status TEXT CHECK (status IN ('draft', 'sent', 'signed', 'approved', 'rejected')) DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES public.partner_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_partner_id ON public.contracts(partner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON public.contracts(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Partners can view their own contracts
DROP POLICY IF EXISTS "Partners can view own contracts" ON public.contracts;
CREATE POLICY "Partners can view own contracts"
  ON public.contracts
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Partners can update their own contracts (upload signed version, add notes)
DROP POLICY IF EXISTS "Partners can update own contracts" ON public.contracts;
CREATE POLICY "Partners can update own contracts"
  ON public.contracts
  FOR UPDATE
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all contracts
DROP POLICY IF EXISTS "Admins can view all contracts" ON public.contracts;
CREATE POLICY "Admins can view all contracts"
  ON public.contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin')
    )
  );

-- Admins can create contracts
DROP POLICY IF EXISTS "Admins can create contracts" ON public.contracts;
CREATE POLICY "Admins can create contracts"
  ON public.contracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin')
    )
  );

-- Admins can update all contracts
DROP POLICY IF EXISTS "Admins can update all contracts" ON public.contracts;
CREATE POLICY "Admins can update all contracts"
  ON public.contracts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin')
    )
  );

-- TABLE: contract_discussions (for comments/threads)
CREATE TABLE IF NOT EXISTS public.contract_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.partner_users(id) NOT NULL,
  sender_role TEXT CHECK (sender_role IN ('admin', 'partner')) NOT NULL,
  message TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contract_discussions_contract_id ON public.contract_discussions(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_discussions_created_at ON public.contract_discussions(created_at DESC);

-- Enable RLS
ALTER TABLE public.contract_discussions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discussions
-- Partners can view discussions for their contracts
DROP POLICY IF EXISTS "Partners can view own contract discussions" ON public.contract_discussions;
CREATE POLICY "Partners can view own contract discussions"
  ON public.contract_discussions
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Partners can create discussions for their contracts
DROP POLICY IF EXISTS "Partners can create own contract discussions" ON public.contract_discussions;
CREATE POLICY "Partners can create own contract discussions"
  ON public.contract_discussions
  FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
    AND sender_id IN (
      SELECT id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all discussions
DROP POLICY IF EXISTS "Admins can view all contract discussions" ON public.contract_discussions;
CREATE POLICY "Admins can view all contract discussions"
  ON public.contract_discussions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin')
    )
  );

-- Admins can create discussions for any contract
DROP POLICY IF EXISTS "Admins can create contract discussions" ON public.contract_discussions;
CREATE POLICY "Admins can create contract discussions"
  ON public.contract_discussions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin')
    )
    AND sender_id IN (
      SELECT id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

