
-- Create storage bucket for laudo photos (public for easy access)
INSERT INTO storage.buckets (id, name, public) VALUES ('laudo-fotos', 'laudo-fotos', true);

-- Allow anyone to read photos (public bucket)
CREATE POLICY "Public read access for laudo photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'laudo-fotos');

-- Allow anyone to upload photos (no auth required since app has no auth yet)
CREATE POLICY "Allow upload laudo photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'laudo-fotos');

-- Allow anyone to delete their photos
CREATE POLICY "Allow delete laudo photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'laudo-fotos');
