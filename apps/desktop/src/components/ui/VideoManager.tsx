/**
 * VideoManager - Video asset management dialog.
 *
 * Uses the shared MediaManager component with video-specific configuration.
 */
import React, { useEffect, useState, useRef } from 'react';
import { useVideoStore, StoredVideo } from '../../stores/useVideoStore';
import { MediaManager, MediaManagerConfig, MediaCard } from './MediaManager';

const VIDEO_CONFIG: MediaManagerConfig = {
  title: 'Video Manager',
  selectTitle: 'Select Video',
  icon: '🎥',
  emptyIcon: '🎥',
  uploadText: 'Drop videos here or click to select',
  supportedTypes: 'Supports: MP4, WebM, MOV, AVI (Max 100MB)',
  buttonText: 'Select Videos',
  emptyText: 'No videos uploaded yet',
  emptySubtext: 'Upload some videos to get started',
  loadingText: 'Processing videos...',
  mimeTypePrefix: 'video/',
  accept: 'video/*',
};

interface VideoManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo?: (video: StoredVideo) => void;
  selectMode?: boolean;
}

export const VideoManager: React.FC<VideoManagerProps> = ({
  isOpen,
  onClose,
  onSelectVideo,
  selectMode = false,
}) => {
  const { videos, isLoading, lastError, loadVideos, uploadVideo, deleteVideo, clearError } =
    useVideoStore();

  return (
    <MediaManager<StoredVideo>
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelectVideo}
      selectMode={selectMode}
      config={VIDEO_CONFIG}
      items={videos}
      isLoading={isLoading}
      lastError={lastError}
      onLoad={loadVideos}
      onUpload={uploadVideo}
      onDelete={deleteVideo}
      onClearError={clearError}
      renderCard={(video, props) => (
        <VideoCard
          key={video.id}
          video={video}
          onDelete={props.onDelete}
          onSelect={props.onSelect}
          formatFileSize={props.formatFileSize}
        />
      )}
    />
  );
};

interface VideoCardProps {
  video: StoredVideo;
  onDelete: (id: string) => void;
  onSelect?: (video: StoredVideo) => void;
  formatFileSize: (bytes: number) => string;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onDelete, onSelect, formatFileSize }) => {
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    getVideoSrc(video).then((src) => {
      setVideoSrc(src);
      setLoading(false);
    });
  }, [video]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    if (videoSrc) {
      return (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          muted
          playsInline
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
        />
      );
    }
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400">🎥</div>
    );
  };

  const durationBadge = video.duration ? (
    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
      {formatDuration(video.duration)}
    </div>
  ) : null;

  return (
    <MediaCard<StoredVideo>
      item={video}
      onDelete={onDelete}
      onSelect={onSelect}
      formatFileSize={formatFileSize}
      renderPreview={renderPreview}
      isLoading={loading}
      aspectRatio="aspect-video"
      badge={durationBadge}
    />
  );
};

async function getVideoSrc(video: StoredVideo): Promise<string> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string>('get_video_data', { videoId: video.id });
  } catch (error) {
    console.error('Failed to load video:', error);
    return '';
  }
}
