-- Create availability_blocks table
CREATE TABLE IF NOT EXISTS availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  title TEXT DEFAULT 'Unavailable',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- For future expansion (RRULE)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent end_time before start_time
  CONSTRAINT availability_check_dates CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Staff can view their own blocks
DROP POLICY IF EXISTS "Users can view their own blocks" ON availability_blocks;
CREATE POLICY "Users can view their own blocks"
  ON availability_blocks
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Staff can insert their own blocks
DROP POLICY IF EXISTS "Users can insert their own blocks" ON availability_blocks;
CREATE POLICY "Users can insert their own blocks"
  ON availability_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Staff can update their own blocks
DROP POLICY IF EXISTS "Users can update their own blocks" ON availability_blocks;
CREATE POLICY "Users can update their own blocks"
  ON availability_blocks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Staff can delete their own blocks
DROP POLICY IF EXISTS "Users can delete their own blocks" ON availability_blocks;
CREATE POLICY "Users can delete their own blocks"
  ON availability_blocks
  FOR DELETE
  USING (auth.uid() = user_id);


-- 5. Public/System read access (for slot calculation)
-- 5. Public/System read access (for slot calculation)
-- allowing all authenticated users to read is often easiest for the client-side fetch,
-- but strictly we might want to hide "title". For now, we allow read.
DROP POLICY IF EXISTS "All authenticated users can view blocks" ON availability_blocks;
CREATE POLICY "All authenticated users can view blocks"
  ON availability_blocks
  FOR SELECT
  USING (auth.role() = 'authenticated');

