/**
 * MediaCard - Reusable card component for displaying media assets.
 *
 * Provides common card structure with preview area, action buttons, and info section.
 */
import { ReactNode } from 'react';
import { StoredMedia } from '../../../stores/createMediaStore';

export interface MediaCardProps<T extends StoredMedia> {
  item: T;
  onDelete: (id: string) => void;
  onSelect?: (item: T) => void;
  formatFileSize: (bytes: number) => string;
  /** Render function for the preview area */
  renderPreview: (item: T, loading: boolean) => ReactNode;
  /** Loading state for preview */
  isLoading: boolean;
  /** Aspect ratio class (e.g., 'aspect-square', 'aspect-video') */
  aspectRatio?: string;
  /** Optional badge to show on the preview */
  badge?: ReactNode;
}

export function MediaCard<T extends StoredMedia>({
  item,
  onDelete,
  onSelect,
  formatFileSize,
  renderPreview,
  isLoading,
  aspectRatio = 'aspect-square',
  badge,
}: MediaCardProps<T>) {
  const handleSelect = () => {
    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
      {/* Preview Area */}
      <div className={`${aspectRatio} relative bg-gray-100 dark:bg-gray-600`}>
        {renderPreview(item, isLoading)}

        {/* Action Buttons Overlay */}
        <div className="absolute top-2 right-2 space-x-1">
          {onSelect && (
            <button
              onClick={handleSelect}
              className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Select this item"
            >
              ✓
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            title="Delete item"
          >
            🗑️
          </button>
        </div>

        {/* Optional Badge */}
        {badge}
      </div>

      {/* Item Info */}
      <div className="p-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {item.originalName}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(item.size)}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(item.uploadedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
