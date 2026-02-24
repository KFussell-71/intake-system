-- Migration: 20260215_adjust_vector_dims
-- Description: Adjusts note embeddings to 768 dimensions for Gemini/Ollama compatibility.

ALTER TABLE case_notes DROP COLUMN IF EXISTS embedding;
ALTER TABLE case_notes ADD COLUMN embedding vector(768);
