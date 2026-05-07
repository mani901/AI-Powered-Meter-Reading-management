import { X } from 'lucide-react';

export function ImageModal({
  src,
  alt,
  onClose,
}: {
  src: string | null;
  alt?: string;
  onClose: () => void;
}) {
  if (!src) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-2xl w-full">
        <button className="absolute -top-10 right-0 text-white hover:text-slate-300" onClick={onClose}>
          <X size={24} />
        </button>
        <img src={src} alt={alt ?? 'Image'} className="w-full rounded-xl" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}

