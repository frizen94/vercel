import { useState, useRef } from 'react';
import { Upload, X, File, Image } from 'lucide-react';
import { Button } from './ui/button';

interface AttachmentUploadProps {
  onUpload: (file: File) => Promise<void>;
  maxSize?: number; // em MB
  accept?: string;
  disabled?: boolean;
}

export function AttachmentUpload({ 
  onUpload, 
  maxSize = 10, 
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt",
  disabled = false 
}: AttachmentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSize * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeBytes) {
      return `Arquivo muito grande. Máximo: ${maxSize}MB`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div className="space-y-3">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors
            ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Arraste um arquivo aqui ou clique para selecionar
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Máximo {maxSize}MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileInputChange}
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {isImage ? (
                <Image className="h-10 w-10 text-primary" />
              ) : (
                <File className="h-10 w-10 text-gray-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-gray-600 ml-2"
              disabled={isUploading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Enviando...' : 'Anexar Arquivo'}
            </Button>
            <Button
              onClick={handleRemoveFile}
              variant="outline"
              disabled={isUploading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
