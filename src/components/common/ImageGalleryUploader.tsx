import React from 'react';
import { Upload, Star, Trash2, Image as ImageIcon, Check } from 'lucide-react';
import { ThemeImage, ThemeImageType } from './ThemeImage';

interface ImageGalleryUploaderProps {
  images: string[];
  mainImage: string;
  onImagesChange: (newImages: string[], newMainImage: string) => void;
  label?: string;
  description?: string;
  maxImages?: number;
  fallbackType?: ThemeImageType;
  singleMode?: boolean;
}

export const ImageGalleryUploader: React.FC<ImageGalleryUploaderProps> = ({
  images = [],
  mainImage = '',
  onImagesChange,
  label = 'Galería de Imágenes',
  description = 'Sube imágenes desde tu dispositivo local. Marca la principal que se mostrará en la tarjeta.',
  maxImages = 6,
  fallbackType = 'product',
  singleMode = false,
}) => {

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    let currentImages = [...images];
    let currentMain = mainImage;

    let processedCount = 0;

    fileList.forEach((file: File) => {
      if (file.size > 3 * 1024 * 1024) {
        alert(`El archivo ${file.name} supera el límite de 3MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          if (singleMode) {
            currentImages = [base64];
            currentMain = base64;
          } else {
            if (currentImages.length < maxImages) {
              currentImages.push(base64);
              if (!currentMain || currentImages.length === 1) {
                currentMain = base64;
              }
            }
          }
        }

        processedCount++;
        if (processedCount === fileList.length) {
          onImagesChange(currentImages, currentMain);
        }
      };
      reader.readAsDataURL(file);
    });

    // reset input
    e.target.value = '';
  };

  const handleSetMain = (imgUrl: string) => {
    onImagesChange(images, imgUrl);
  };

  const handleRemoveImage = (imgUrl: string) => {
    const updatedImages = images.filter((img) => img !== imgUrl);
    let updatedMain = mainImage;
    if (mainImage === imgUrl) {
      updatedMain = updatedImages[0] || '';
    }
    onImagesChange(updatedImages, updatedMain);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-slate-500">{description}</p>
          )}
        </div>

        {images.length < maxImages && (
          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors shrink-0">
            <Upload className="w-4 h-4" />
            <span>{singleMode ? 'Subir Imagen' : 'Añadir Imagen'}</span>
            <input
              type="file"
              accept="image/*"
              multiple={!singleMode}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Grid of uploaded images */}
      {images.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
          {images.map((img, idx) => {
            const isMain = img === mainImage || (idx === 0 && !mainImage);
            return (
              <div
                key={idx}
                className={`relative group aspect-square rounded-2xl overflow-hidden border-2 transition-all bg-slate-100 ${
                  isMain
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img
                  src={img}
                  alt={`Imagen ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Clickable Star Icon for Principal */}
                <button
                  type="button"
                  onClick={() => handleSetMain(img)}
                  title={isMain ? 'Imagen principal' : 'Marcar como principal'}
                  className={`absolute top-1.5 left-1.5 p-1.5 rounded-xl shadow-sm transition-all cursor-pointer ${
                    isMain
                      ? 'bg-slate-900/80 text-amber-400 border border-amber-400/40'
                      : 'bg-slate-900/40 text-white/70 hover:bg-slate-900/80 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isMain ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                {/* Delete Button */}
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img)}
                    title="Eliminar imagen"
                    className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback Default Illustration Preview when no images uploaded */
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/60 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs">
            <ThemeImage
              src="local:default"
              fallbackType={fallbackType}
              className="w-full h-full"
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-700 font-bold text-xs">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              <span>Sin imágenes subidas</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Actualmente se muestra la imagen por defecto minimalista del sistema. Haz clic en "Subir Imagen" para seleccionar fotos locales.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
