-- Add status and status_changed_at columns to lists table
ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz NOT NULL DEFAULT now();

-- Backfill existing rows: set status_changed_at to created_at
UPDATE public.lists SET status_changed_at = created_at WHERE status_changed_at IS NOT NULL;

-- Add a check constraint for valid status values
ALTER TABLE public.lists
  ADD CONSTRAINT lists_status_check CHECK (status IN ('active', 'inactive'));
