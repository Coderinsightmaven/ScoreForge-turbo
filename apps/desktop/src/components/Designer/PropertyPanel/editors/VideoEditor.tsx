/**
 * VideoEditor - Property editor for VIDEO components.
 */
import React from 'react';
import { useVideoStore } from '../../../../stores/useVideoStore';
import { EditorProps } from './types';

export const VideoEditor: React.FC<EditorProps> = ({
  component,
  onDataChange,
  onOpenVideoManager,
}) => {
  const { videos } = useVideoStore();
  const selectedVideo = videos.find((video) => video.id === component?.data.videoId);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
        {selectedVideo ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                🎥
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{selectedVideo.originalName}</div>
                <div className="text-xs text-gray-500">Video File</div>
              </div>
            </div>
            <button
              onClick={onOpenVideoManager}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Change Video
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenVideoManager}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Select Video
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Scale Mode</label>
        <select
          value={component?.data.videoData?.scaleMode || 'cover'}
          onChange={(e) =>
            onDataChange('videoData', {
              ...component?.data.videoData,
              scaleMode: e.target.value,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="cover">Cover (Fill entire area)</option>
          <option value="contain">Contain (Fit within area)</option>
          <option value="stretch">Stretch (Fill ignoring aspect ratio)</option>
          <option value="original">Original Size</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Playback Settings</label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={component?.data.videoData?.autoplay || false}
              onChange={(e) =>
                onDataChange('videoData', {
                  ...component?.data.videoData,
                  autoplay: e.target.checked,
                })
              }
              className="mr-2"
            />
            <span className="text-sm">Autoplay</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={component?.data.videoData?.loop || false}
              onChange={(e) =>
                onDataChange('videoData', {
                  ...component?.data.videoData,
                  loop: e.target.checked,
                })
              }
              className="mr-2"
            />
            <span className="text-sm">Loop</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={component?.data.videoData?.muted !== false}
              onChange={(e) =>
                onDataChange('videoData', {
                  ...component?.data.videoData,
                  muted: e.target.checked,
                })
              }
              className="mr-2"
            />
            <span className="text-sm">Muted</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={component?.data.videoData?.controls || false}
              onChange={(e) =>
                onDataChange('videoData', {
                  ...component?.data.videoData,
                  controls: e.target.checked,
                })
              }
              className="mr-2"
            />
            <span className="text-sm">Show Controls</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Volume: {Math.round((component?.data.videoData?.volume || 1) * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={component?.data.videoData?.volume || 1}
          onChange={(e) =>
            onDataChange('videoData', {
              ...component?.data.videoData,
              volume: parseFloat(e.target.value),
            })
          }
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Playback Speed: {component?.data.videoData?.playbackRate || 1}x
        </label>
        <select
          value={component?.data.videoData?.playbackRate || 1}
          onChange={(e) =>
            onDataChange('videoData', {
              ...component?.data.videoData,
              playbackRate: parseFloat(e.target.value),
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x (Normal)</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>
    </div>
  );
};
