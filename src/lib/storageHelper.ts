import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'laudo-fotos';

export async function uploadImage(file: File, path: string): Promise<string> {
  // Compress before uploading
  const compressed = await compressFile(file);
  
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: 'image/jpeg', upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function deleteImage(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

function compressFile(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob!);
        },
        'image/jpeg',
        0.7
      );
    };
    img.src = url;
  });
}
