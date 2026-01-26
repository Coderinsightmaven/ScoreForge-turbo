/**
 * createMediaStore - Generic factory for creating media asset stores.
 *
 * This factory creates Zustand stores for managing media assets (images, videos, etc.)
 * with a consistent API for upload, delete, load, and retrieval operations.
 *
 * All media is stored via Tauri filesystem API.
 */
import { create, StateCreator } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Base interface for stored media assets.
 * Extended by specific media types (StoredImage, StoredVideo).
 */
export interface StoredMedia {
  id: string;
  name: string;
  originalName: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
  thumbnail?: string;
}

/**
 * Configuration for creating a media store.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface MediaStoreConfig<_T extends StoredMedia = StoredMedia> {
  /** Plural name for logging (e.g., 'images', 'videos') */
  mediaName: string;
  /** State property name (e.g., 'images', 'videos') */
  stateKey: string;
  /** Tauri command to load all media */
  loadCommand: string;
  /** Tauri command to upload media */
  uploadCommand: string;
  /** Tauri command to delete media */
  deleteCommand: string;
  /** Parameter name for delete command ID (e.g., 'imageId', 'videoId') */
  deleteIdParam: string;
}

/**
 * State interface for media stores.
 */
export interface MediaState<T extends StoredMedia> {
  items: T[];
  isLoading: boolean;
  lastError: string | null;
}

/**
 * Actions interface for media stores.
 */
export interface MediaActions<T extends StoredMedia> {
  load: () => Promise<void>;
  upload: (file: File) => Promise<T | null>;
  delete: (id: string) => Promise<boolean>;
  get: (id: string) => T | null;
  clearError: () => void;
}

export type MediaStore<T extends StoredMedia> = MediaState<T> & MediaActions<T>;

/**
 * Creates a media store with standard CRUD operations.
 *
 * @param config - Configuration specifying Tauri commands and naming
 * @returns A Zustand store hook for managing media assets
 *
 * @example
 * ```typescript
 * const useImageStore = createMediaStore<StoredImage>({
 *   mediaName: 'images',
 *   stateKey: 'images',
 *   loadCommand: 'get_stored_images',
 *   uploadCommand: 'upload_image',
 *   deleteCommand: 'delete_image',
 *   deleteIdParam: 'imageId',
 * });
 * ```
 */
export function createMediaStore<T extends StoredMedia>(config: MediaStoreConfig<T>) {
  const { mediaName, loadCommand, uploadCommand, deleteCommand, deleteIdParam } = config;

  const storeCreator: StateCreator<
    MediaStore<T>,
    [['zustand/subscribeWithSelector', never]],
    [],
    MediaStore<T>
  > = (set, get) => ({
    // Initial state
    items: [],
    isLoading: false,
    lastError: null,

    /**
     * Loads all stored media from the Tauri backend.
     */
    load: async () => {
      set({ isLoading: true, lastError: null });

      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const items = await invoke<T[]>(loadCommand);
        set({ items, isLoading: false });
      } catch (error) {
        console.error(`Failed to load ${mediaName}:`, error);
        set({
          lastError: error instanceof Error ? error.message : `Failed to load ${mediaName}`,
          isLoading: false
        });
      }
    },

    /**
     * Uploads a media file to the Tauri backend.
     */
    upload: async (file: File) => {
      set({ isLoading: true, lastError: null });

      try {
        const { invoke } = await import('@tauri-apps/api/core');

        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const storedMedia = await invoke<T>(uploadCommand, {
          fileName: file.name,
          fileData: base64,
          fileType: file.type,
          fileSize: file.size
        });

        set(state => ({
          items: [...state.items, storedMedia],
          isLoading: false
        }));

        return storedMedia;
      } catch (error) {
        console.error(`Failed to upload ${mediaName.slice(0, -1)}:`, error);
        set({
          lastError: error instanceof Error ? error.message : `Failed to upload ${mediaName.slice(0, -1)}`,
          isLoading: false
        });
        return null;
      }
    },

    /**
     * Deletes a media item from the Tauri backend and local state.
     */
    delete: async (id: string) => {
      set({ isLoading: true, lastError: null });

      try {
        const { invoke } = await import('@tauri-apps/api/core');

        await invoke(deleteCommand, { [deleteIdParam]: id });

        set(state => ({
          items: state.items.filter(item => item.id !== id),
          isLoading: false
        }));

        return true;
      } catch (error) {
        console.error(`Failed to delete ${mediaName.slice(0, -1)}:`, error);
        set({
          lastError: error instanceof Error ? error.message : `Failed to delete ${mediaName.slice(0, -1)}`,
          isLoading: false
        });
        return false;
      }
    },

    /**
     * Gets a media item by ID.
     */
    get: (id: string) => {
      const { items } = get();
      return items.find(item => item.id === id) || null;
    },

    /**
     * Clears the current error state.
     */
    clearError: () => {
      set({ lastError: null });
    },
  });

  return create<MediaStore<T>>()(subscribeWithSelector(storeCreator));
}
