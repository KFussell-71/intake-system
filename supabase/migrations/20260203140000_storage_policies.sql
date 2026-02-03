-- Storage Policies Migration
-- Created: 2026-02-03
-- Purpose: Setup 'documents' bucket and restrict access

-- 1. Create Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents', 
    'documents', 
    false, -- Private bucket (requires signed URLs or RLS)
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- Allow READ for Authenticated Users (Staff/Admins)
-- Ideally limited to 'assigned_to' but for now 'authenticated' is a safe baseline for internal tools
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'documents' );

-- Allow UPLOAD for Authenticated Users
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'documents' );

-- Allow UPDATE/DELETE for Owners or Admins
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'documents' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'documents' AND owner = auth.uid() );
