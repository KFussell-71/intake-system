-- Migration: 20260215_ai_foundations
-- Description: Adds schema support for AI Sentiment Analysis and Barrier Detection.

-- 1. Enable pgvector extension (if available)
-- Note: This might fail if the database doesn't support it (e.g. standard Postgres without vector).
-- We wrap it in a DO block to avoid breaking migration if not available, OR we just try CREATE EXTENSION IF NOT EXISTS.
-- Supabase supports it, so it should be fine.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- 2. Add AI columns to case_notes
ALTER TABLE case_notes ADD COLUMN IF NOT EXISTS sentiment_score FLOAT CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0);
ALTER TABLE case_notes ADD COLUMN IF NOT EXISTS sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative'));
ALTER TABLE case_notes ADD COLUMN IF NOT EXISTS detected_barriers TEXT[]; -- Array of barrier tags (e.g. ['housing', 'transportation'])

-- 3. Add embedding column for future RAG / Semantic Search
-- Using 1536 dimensions (OpenAI text-embedding-3-small standard)
ALTER TABLE case_notes ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 4. Index for vector search (IVFFlat)
-- Only create if we have enough data, but for now we can create it.
-- Note: IVFFlat requires some rows to be effective. We'll skip specific index creation for now until we have data.
-- Just adding the column is enough for the "Foundation".

-- 5. Index for sentiment querying
CREATE INDEX IF NOT EXISTS idx_case_notes_sentiment ON case_notes(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_case_notes_barriers ON case_notes USING GIN(detected_barriers);
