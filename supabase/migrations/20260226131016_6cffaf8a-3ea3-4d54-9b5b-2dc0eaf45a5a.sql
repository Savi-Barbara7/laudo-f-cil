
-- Add fichas columns to laudos table
ALTER TABLE public.laudos ADD COLUMN IF NOT EXISTS fichas jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.laudos ADD COLUMN IF NOT EXISTS fichas_rich_text text DEFAULT '';
