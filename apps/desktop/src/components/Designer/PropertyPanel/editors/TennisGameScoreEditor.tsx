/**
 * TennisGameScoreEditor - Property editor for TENNIS_GAME_SCORE components.
 */
import React, { useState, useEffect } from 'react';
import { TextStyleSection } from '../shared/TextStyleSection';
import { EditorProps } from './types';

export const TennisGameScoreEditor: React.FC<EditorProps> = ({
  component,
  onDataChange,
  onStyleChange,
}) => {
  const [localText, setLocalText] = useState(component?.data.text || '');

  useEffect(() => {
    setLocalText(component?.data.text || '');
  }, [component?.id, component?.data.text]);

  const handleTextBlur = () => {
    if (localText !== component?.data.text) {
      onDataChange('text', localText);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Player Number</label>
        <select
          value={component?.data.playerNumber || 1}
          onChange={(e) => onDataChange('playerNumber', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>Player 1</option>
          <option value={2}>Player 2</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fallback Score</label>
        <input
          type="text"
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={handleTextBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0"
        />
        <div className="text-xs text-gray-500 mt-1">Shown when no live data is available</div>
      </div>

      <TextStyleSection component={component} onStyleChange={onStyleChange} />
    </div>
  );
};
