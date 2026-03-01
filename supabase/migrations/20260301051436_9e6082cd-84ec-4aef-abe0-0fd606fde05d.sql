
-- Adicionar coluna volumes e canteiro no laudo para nova estrutura de volumes
ALTER TABLE public.laudos 
  ADD COLUMN IF NOT EXISTS volumes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS canteiro_volume jsonb DEFAULT NULL;
