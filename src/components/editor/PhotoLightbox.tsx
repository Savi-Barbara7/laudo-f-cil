import { createPortal } from 'react-dom';
import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PhotoLightboxProps {
  images: { url: string; label?: string }[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({ images, currentIndex, onClose, onNavigate }: PhotoLightboxProps) {
  const current = images[currentIndex];

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goPrev, goNext]);

  if (!current) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <button className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
        <X className="h-5 w-5" />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white">
        {currentIndex + 1} / {images.length}
      </div>

      {currentIndex > 0 && (
        <button className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); goPrev(); }}>
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <img src={current.url} alt={current.label || `Foto ${currentIndex + 1}`} className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />

      {currentIndex < images.length - 1 && (
        <button className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); goNext(); }}>
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {current.label && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white">
          {current.label}
        </div>
      )}
    </div>,
    document.body
  );
}
