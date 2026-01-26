/**
 * TextEditor - Property editor for TEXT components.
 */
import React, { useState, useEffect } from 'react';
import { EditorProps } from './types';

export const TextEditor: React.FC<EditorProps> = ({ component, onDataChange, onStyleChange }) => {
  const [localText, setLocalText] = useState(component?.data.text || '');

  useEffect(() => {
    setLocalText(component?.data.text || '');
  }, [component?.id, component?.data.text]);

  const handleTextBlur = () => {
    if (localText !== component?.data.text) {
      onDataChange('text', localText);
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleTextBlur();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
        <textarea
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={handleTextBlur}
          onKeyDown={handleTextKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Enter text... (Ctrl+Enter to apply immediately)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Size: {component?.style.fontSize || 16}px
        </label>
        <input
          type="range"
          min="8"
          max="72"
          value={component?.style.fontSize || 16}
          onChange={(e) => onStyleChange('fontSize', parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
        <input
          type="color"
          value={component?.style.textColor || '#ffffff'}
          onChange={(e) => onStyleChange('textColor', e.target.value)}
          className="w-full h-10 rounded border border-gray-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Text Align</label>
        <select
          value={component?.style.textAlign || 'center'}
          onChange={(e) => onStyleChange('textAlign', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
        <select
          value={component?.style.fontWeight || 'normal'}
          onChange={(e) => onStyleChange('fontWeight', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="lighter">Light</option>
        </select>
      </div>
    </div>
  );
};
