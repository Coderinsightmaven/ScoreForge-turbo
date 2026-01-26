/**
 * useVideoStore - Video asset management store.
 *
 * Manages video uploads, listing, and deletion via Tauri backend.
 * Built on the generic createMediaStore factory.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createMediaStore, StoredMedia } from './createMediaStore';

export interface StoredVideo extends StoredMedia {
  /** Duration in seconds */
  duration?: number;
}

// Create base store with generic API
const baseStore = createMediaStore<StoredVideo>({
  mediaName: 'videos',
  stateKey: 'videos',
  loadCommand: 'get_stored_videos',
  uploadCommand: 'upload_video',
  deleteCommand: 'delete_video',
  deleteIdParam: 'videoId',
});

/**
 * Video store state with backward-compatible property names.
 */
interface VideoStoreState {
  // Generic API (new)
  items: StoredVideo[];
  isLoading: boolean;
  lastError: string | null;
  load: () => Promise<void>;
  upload: (file: File) => Promise<StoredVideo | null>;
  delete: (id: string) => Promise<boolean>;
  get: (id: string) => StoredVideo | null;
  clearError: () => void;
  // Backward-compatible API (legacy)
  videos: StoredVideo[];
  loadVideos: () => Promise<void>;
  uploadVideo: (file: File) => Promise<StoredVideo | null>;
  deleteVideo: (id: string) => Promise<boolean>;
  getVideo: (id: string) => StoredVideo | null;
}

/**
 * Video store hook with both generic and backward-compatible APIs.
 */
export const useVideoStore = create<VideoStoreState>()(
  subscribeWithSelector((set) => {
    // Get the base store state
    const base = baseStore.getState();

    // Subscribe to base store changes
    baseStore.subscribe((state) => {
      set({
        items: state.items,
        videos: state.items,
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
      videos: base.items,
      loadVideos: base.load,
      uploadVideo: base.upload,
      deleteVideo: base.delete,
      getVideo: base.get,
    };
  })
);
