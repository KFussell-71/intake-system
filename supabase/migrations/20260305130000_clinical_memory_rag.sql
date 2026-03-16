-- Migration: 20260305130000_clinical_memory_rag
-- Description: Creates the foundation for Edge-RAG semantic search.

-- 1. Create the clinical_memory table
CREATE TABLE IF NOT EXISTS public.clinical_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,           -- The raw chunk of text
    metadata JSONB DEFAULT '{}',     -- Source info (doc_type, law_citation, etc.)
    embedding vector(768),          -- Semantic vector (matches existing Vanguard standard)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row-Level Security
ALTER TABLE public.clinical_memory ENABLE ROW LEVEL SECURITY;

-- 3. Standard RLS Policies (Readable by all staff/supervisors)
CREATE POLICY "Clinical memory is readable by all staff members"
    ON public.clinical_memory FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'supervisor', 'admin')));

-- 4. Admin-only management
CREATE POLICY "Admins can manage clinical memory"
    ON public.clinical_memory FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Semantic Index (HNSW for high-speed local retrieval)
-- Note: Requires enough data to build, using M=16, ef_construction=64 for NAS efficiency
CREATE INDEX IF NOT EXISTS idx_clinical_memory_embedding_hnsw 
    ON public.clinical_memory USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_clinical_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_clinical_memory_timestamp
    BEFORE UPDATE ON public.clinical_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_clinical_memory_updated_at();

-- 7. SEED DATA: Base Clinical Context (PLACEHOLDERS)
-- In production, the Discovery Agent will populate this from PDFs
INSERT INTO public.clinical_memory (content, metadata)
VALUES 
('DIGNITY OF RISK: The concept that individuals with disabilities have the right to take risks and make mistakes, foundational to person-centered planning in vocational rehabilitation.', '{"category": "Philosophy", "doc_type": "Directive"}'),
('ADA TITLE I: Prohibits private employers, state and local governments, employment agencies and labor unions from discriminating against qualified individuals with disabilities in job application procedures.', '{"category": "Law", "doc_type": "Legislation", "citation": "42 U.S.C. § 12112"}'),
('WIOA SECTION 511: Limits the use of subminimum wage by requiring youth with disabilities to be provided with transition services and pre-employment transition services.', '{"category": "Law", "doc_type": "Legislation", "citation": "29 U.S.C. § 794"}')
ON CONFLICT DO NOTHING;

-- 8. RPC: Vector Search Function
-- Allows the Edge-RAG service to find matching content chunks
CREATE OR REPLACE FUNCTION search_clinical_memory (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.metadata,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM clinical_memory m
  WHERE 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
