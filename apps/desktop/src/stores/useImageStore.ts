/**
 * useImageStore - Image asset management store.
 *
 * Manages image uploads, listing, and deletion via Tauri backend.
 * Built on the generic createMediaStore factory.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createMediaStore, StoredMedia } from './createMediaStore';

export interface StoredImage extends StoredMedia {
  // Image-specific fields can be added here
}

// Create base store with generic API
const baseStore = createMediaStore<StoredImage>({
  mediaName: 'images',
  stateKey: 'images',
  loadCommand: 'get_stored_images',
  uploadCommand: 'upload_image',
  deleteCommand: 'delete_image',
  deleteIdParam: 'imageId',
});

/**
 * Image store state with backward-compatible property names.
 */
interface ImageStoreState {
  // Generic API (new)
  items: StoredImage[];
  isLoading: boolean;
  lastError: string | null;
  load: () => Promise<void>;
  upload: (file: File) => Promise<StoredImage | null>;
  delete: (id: string) => Promise<boolean>;
  get: (id: string) => StoredImage | null;
  clearError: () => void;
  // Backward-compatible API (legacy)
  images: StoredImage[];
  loadImages: () => Promise<void>;
  uploadImage: (file: File) => Promise<StoredImage | null>;
  deleteImage: (id: string) => Promise<boolean>;
  getImage: (id: string) => StoredImage | null;
}

/**
 * Image store hook with both generic and backward-compatible APIs.
 */
export const useImageStore = create<ImageStoreState>()(
  subscribeWithSelector((set) => {
    // Get the base store state
    const base = baseStore.getState();

    // Subscribe to base store changes
    baseStore.subscribe((state) => {
      set({
        items: state.items,
        images: state.items,
        isLoading: state.isLoading,
        lastError: state.lastError,
      });
    });

    return {
      // Generic API
      items: base.items,
      isLoading: base.isLoading,
      lastError: base.lastError,
      load: base.load,
      upload: base.upload,
      delete: base.delete,
      get: base.get,
      clearError: base.clearError,
      // Backward-compatible aliases
      images: base.items,
      loadImages: base.load,
      uploadImage: base.upload,
      deleteImage: base.delete,
      getImage: base.get,
    };
  })
);
