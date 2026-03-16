-- Migration: 20260212180000_accreditation.sql
-- Tier 4: Automated Accreditation Evidence (Institutional Intelligence)

-- 1. Accreditation Standards (The Checklist)
-- Defines what we are being audited against.
CREATE TABLE IF NOT EXISTS accreditation_standards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'STD_1_1'
  name TEXT NOT NULL, -- e.g. 'Intake Timeliness'
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g. 'PROCESS', 'OUTCOME', 'RIGHTS'
  query_def JSONB, -- Logic to prove compliance (e.g. { "sql": "SELECT...", "threshold": 0.9 })
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Evidence Packets (The Binder)
-- Frozen snapshots of compliance proof.
CREATE TABLE IF NOT EXISTS evidence_packets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('generating', 'complete', 'failed')),
  
  -- The Meat: A huge JSON blob containing the entire binder
  -- {
  --   "standards": [
  --     { "code": "STD_1_1", "status": "PASS", "compliance_rate": 0.95, "sample_cases": [...] }
  --   ]
  -- }
  content JSONB,
  
  -- Hash for tamper-evident verification
  packet_hash TEXT 
);

-- 3. Seed Data (Example Standards)
INSERT INTO accreditation_standards (code, name, description, category) VALUES
('STD_1_1', 'Timeliness of Assessment', 'All intakes must include a completed assessment within 10 days of initiation.', 'PROCESS'),
('STD_2_4', 'Consent Validity', '100% of files must have a valid, unexpired Consent to Release Information.', 'RIGHTS'),
('STD_3_9', 'Housing Stability', 'Agencies must screen for and document housing barriers for all applicants.', 'OUTCOME')
ON CONFLICT DO NOTHING;

-- 4. Evidence Generation Helper (Simple RPC)
-- Just records the packet creation, the heavy lifting is often done in Node/Server Actions
-- but we can have an RPC to finalize/seal the packet.
CREATE OR REPLACE FUNCTION seal_evidence_packet(packet_id UUID, packet_content JSONB, hash TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE evidence_packets
    SET status = 'complete',
        content = packet_content,
        packet_hash = hash,
        generated_at = NOW()
    WHERE id = packet_id;
END;
$$;
