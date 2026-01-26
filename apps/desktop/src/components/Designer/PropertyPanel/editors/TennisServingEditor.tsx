/**
 * TennisServingEditor - Property editor for TENNIS_SERVING_INDICATOR components.
 */
import React from 'react';
import { TextStyleSection } from '../shared/TextStyleSection';
import { EditorProps } from './types';

export const TennisServingEditor: React.FC<EditorProps> = ({
  component,
  onDataChange,
  onStyleChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Player to Track</label>
        <select
          value={component?.data.playerNumber || 1}
          onChange={(e) => onDataChange('playerNumber', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>Player 1</option>
          <option value={2}>Player 2</option>
        </select>
        <div className="text-xs text-gray-500 mt-1">
          The tennis ball emoji will appear when this player is serving
        </div>
      </div>

      <TextStyleSection component={component} onStyleChange={onStyleChange} />
    </div>
  );
};
