/**
 * ImageManager - Image asset management dialog.
 *
 * Uses the shared MediaManager component with image-specific configuration.
 */
import React, { useEffect, useState } from 'react';
import { useImageStore, StoredImage } from '../../stores/useImageStore';
import { MediaManager, MediaManagerConfig, MediaCard } from './MediaManager';

const IMAGE_CONFIG: MediaManagerConfig = {
  title: 'Image Manager',
  selectTitle: 'Select Image',
  icon: '📁',
  emptyIcon: '🖼️',
  uploadText: 'Drop images here or click to select',
  supportedTypes: 'Supports: PNG, JPG, GIF, WebP (Max 10MB)',
  buttonText: 'Select Images',
  emptyText: 'No images uploaded yet',
  emptySubtext: 'Upload some images to get started',
  loadingText: 'Processing images...',
  mimeTypePrefix: 'image/',
  accept: 'image/*',
};

interface ImageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (image: StoredImage) => void;
  selectMode?: boolean;
}

export const ImageManager: React.FC<ImageManagerProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  selectMode = false,
}) => {
  const { images, isLoading, lastError, loadImages, uploadImage, deleteImage, clearError } =
    useImageStore();

  return (
    <MediaManager<StoredImage>
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelectImage}
      selectMode={selectMode}
      config={IMAGE_CONFIG}
      items={images}
      isLoading={isLoading}
      lastError={lastError}
      onLoad={loadImages}
      onUpload={uploadImage}
      onDelete={deleteImage}
      onClearError={clearError}
      renderCard={(image, props) => (
        <ImageCard
          key={image.id}
          image={image}
          onDelete={props.onDelete}
          onSelect={props.onSelect}
          formatFileSize={props.formatFileSize}
        />
      )}
    />
  );
};

interface ImageCardProps {
  image: StoredImage;
  onDelete: (id: string) => void;
  onSelect?: (image: StoredImage) => void;
  formatFileSize: (bytes: number) => string;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onDelete, onSelect, formatFileSize }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getImageSrc(image).then((src) => {
      setImageSrc(src);
      setLoading(false);
    });
  }, [image]);

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    if (imageSrc) {
      return (
        <img src={imageSrc} alt={image.originalName} className="w-full h-full object-cover" />
      );
    }
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400">🖼️</div>
    );
  };

  return (
    <MediaCard<StoredImage>
      item={image}
      onDelete={onDelete}
      onSelect={onSelect}
      formatFileSize={formatFileSize}
      renderPreview={renderPreview}
      isLoading={loading}
      aspectRatio="aspect-square"
    />
  );
};

async function getImageSrc(image: StoredImage): Promise<string> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string>('get_image_data', { imageId: image.id });
  } catch (error) {
    console.error('Failed to load image:', error);
    return '';
  }
}
