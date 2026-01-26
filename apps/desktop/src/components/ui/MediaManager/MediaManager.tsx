/**
 * MediaManager - Reusable media asset manager component.
 *
 * Provides a modal interface for uploading, viewing, and managing media assets.
 * Used by ImageManager and VideoManager with type-specific configuration.
 */
import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { StoredMedia } from '../../../stores/createMediaStore';

export interface MediaManagerConfig {
  /** Modal title */
  title: string;
  /** Title when in select mode */
  selectTitle: string;
  /** Icon for the upload area */
  icon: string;
  /** Icon for empty state */
  emptyIcon: string;
  /** Placeholder text for upload area */
  uploadText: string;
  /** Supported file types description */
  supportedTypes: string;
  /** Button text */
  buttonText: string;
  /** Empty state text */
  emptyText: string;
  /** Empty state subtext */
  emptySubtext: string;
  /** Loading message */
  loadingText: string;
  /** MIME type prefix for filtering (e.g., 'image/', 'video/') */
  mimeTypePrefix: string;
  /** Accept attribute for file input */
  accept: string;
}

export interface MediaManagerProps<T extends StoredMedia> {
  /** Whether the manager is visible */
  isOpen: boolean;
  /** Callback when closed */
  onClose: () => void;
  /** Callback when an item is selected (in select mode) */
  onSelect?: (item: T) => void;
  /** Whether in select mode */
  selectMode?: boolean;
  /** Configuration for this media type */
  config: MediaManagerConfig;
  /** Media items to display */
  items: T[];
  /** Loading state */
  isLoading: boolean;
  /** Current error message */
  lastError: string | null;
  /** Load items from store */
  onLoad: () => void;
  /** Upload a file */
  onUpload: (file: File) => Promise<T | null>;
  /** Delete an item */
  onDelete: (id: string) => Promise<boolean>;
  /** Clear current error */
  onClearError: () => void;
  /** Render function for media card content */
  renderCard: (item: T, props: MediaCardRenderProps<T>) => ReactNode;
}

export interface MediaCardRenderProps<T extends StoredMedia> {
  item: T;
  onDelete: (id: string) => void;
  onSelect?: (item: T) => void;
  formatFileSize: (bytes: number) => string;
}

export function MediaManager<T extends StoredMedia>({
  isOpen,
  onClose,
  onSelect,
  selectMode = false,
  config,
  items,
  isLoading,
  lastError,
  onLoad,
  onUpload,
  onDelete,
  onClearError,
  renderCard,
}: MediaManagerProps<T>) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      onLoad();
    }
  }, [isOpen, onLoad]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.type.startsWith(config.mimeTypePrefix)) {
        await onUpload(file);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await onDelete(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectMode ? config.selectTitle : config.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center transition-colors
              ${
                dragOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              <div className="text-4xl">{config.icon}</div>
              <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {config.uploadText}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {config.supportedTypes}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {config.buttonText}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={config.accept}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Error Display */}
          {lastError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-red-700 dark:text-red-300 text-sm">{lastError}</span>
                <button onClick={onClearError} className="text-red-500 hover:text-red-700">
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-600 dark:text-gray-400">{config.loadingText}</div>
            </div>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) =>
              renderCard(item, {
                item,
                onDelete: handleDelete,
                onSelect: selectMode ? onSelect : undefined,
                formatFileSize,
              })
            )}
          </div>

          {items.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-4">{config.emptyIcon}</div>
              <div className="text-lg">{config.emptyText}</div>
              <div className="text-sm">{config.emptySubtext}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
