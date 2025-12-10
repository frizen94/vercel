import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImageLightboxProps {
  images: Array<{
    id: number;
    url: string;
    originalName: string;
    size: number;
    createdAt: string;
  }>;
  initialIndex: number;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultiple) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && hasMultiple) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hasMultiple]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = currentImage.originalName;
    link.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Navigation buttons */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <ChevronLeft className="h-12 w-12" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <ChevronRight className="h-12 w-12" />
          </button>
        </>
      )}

      {/* Image container */}
      <div
        className="max-w-7xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.url}
          alt={currentImage.originalName}
          className="max-w-full max-h-full object-contain transition-transform"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>

      {/* Controls */}
      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 rounded-lg px-6 py-3 flex items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zoom controls */}
        <button
          onClick={handleZoomOut}
          className="text-white hover:text-gray-300 transition-colors"
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="text-white text-sm min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="text-white hover:text-gray-300 transition-colors"
          disabled={zoom >= 3}
        >
          <ZoomIn className="h-5 w-5" />
        </button>

        <div className="w-px h-6 bg-gray-600 mx-2" />

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="text-white hover:text-gray-300 transition-colors"
          title="Download"
        >
          <Download className="h-5 w-5" />
        </button>

        {/* Image info */}
        <div className="ml-4 text-white text-sm">
          <div className="font-medium truncate max-w-xs">
            {currentImage.originalName}
          </div>
          <div className="text-gray-400 text-xs">
            {formatFileSize(currentImage.size)} • {formatDate(currentImage.createdAt)}
          </div>
        </div>

        {/* Counter */}
        {hasMultiple && (
          <div className="ml-4 text-white text-sm">
            {currentIndex + 1} de {images.length}
          </div>
        )}
      </div>
    </div>
  );
}
