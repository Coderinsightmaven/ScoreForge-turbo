/**
 * LogoEditor - Property editor for LOGO components.
 */
import React from 'react';
import { useImageStore } from '../../../../stores/useImageStore';
import { EditorProps } from './types';

export const LogoEditor: React.FC<EditorProps> = ({
  component,
  onDataChange,
  onOpenImageManager,
}) => {
  const { images } = useImageStore();
  const selectedImage = images.find((img) => img.id === component?.data.imageId);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo Image</label>
        {selectedImage ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <img
                src={selectedImage.thumbnail}
                alt={selectedImage.name}
                className="w-12 h-12 object-cover rounded border"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{selectedImage.name}</div>
                <div className="text-xs text-gray-500">Logo Image</div>
              </div>
            </div>
            <button
              onClick={onOpenImageManager}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Change Logo
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenImageManager}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Select Logo
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Scale Mode</label>
        <select
          value={component?.data.scaleMode || 'contain'}
          onChange={(e) => onDataChange('scaleMode', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="cover">Cover (Fill entire area)</option>
          <option value="contain">Contain (Fit within area)</option>
          <option value="stretch">Stretch (Fill ignoring aspect ratio)</option>
          <option value="original">Original Size</option>
        </select>
      </div>
    </div>
  );
};
