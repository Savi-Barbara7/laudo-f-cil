
-- 1. Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT DEFAULT '',
  empresa TEXT DEFAULT '',
  cargo TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Obras table
CREATE TABLE public.obras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own obras"
  ON public.obras FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Laudos table
CREATE TABLE public.laudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL DEFAULT 'Novo Laudo',
  status TEXT NOT NULL DEFAULT 'rascunho',
  dados_capa JSONB NOT NULL DEFAULT '{}'::jsonb,
  textos JSONB NOT NULL DEFAULT '{}'::jsonb,
  lindeiros JSONB NOT NULL DEFAULT '[]'::jsonb,
  croqui_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  croqui_rich_text TEXT DEFAULT '',
  art_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  art_rich_text TEXT DEFAULT '',
  documentacoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  documentacoes_rich_text TEXT DEFAULT '',
  conclusao TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own laudos"
  ON public.laudos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_obras_updated_at
  BEFORE UPDATE ON public.obras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_laudos_updated_at
  BEFORE UPDATE ON public.laudos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Storage policies for laudo-fotos bucket (authenticated users)
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'laudo-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'laudo-fotos');

CREATE POLICY "Authenticated users can update own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'laudo-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'laudo-fotos' AND auth.role() = 'authenticated');
