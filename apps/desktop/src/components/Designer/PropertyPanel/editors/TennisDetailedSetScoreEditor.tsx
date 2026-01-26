/**
 * TennisDetailedSetScoreEditor - Property editor for TENNIS_DETAILED_SET_SCORE components.
 */
import React, { useState, useEffect } from 'react';
import { TextStyleSection } from '../shared/TextStyleSection';
import { EditorProps } from './types';

export const TennisDetailedSetScoreEditor: React.FC<EditorProps> = ({
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

  // Determine available sets
  const getAvailableSets = () => {
    return [1, 2, 3];
  };

  const availableSets = getAvailableSets();
  const currentSetNumber = component?.data.setNumber || 1;

  // Reset to highest available if current is not available
  useEffect(() => {
    if (!availableSets.includes(currentSetNumber)) {
      const maxAvailableSet = Math.max(...availableSets);
      onDataChange('setNumber', maxAvailableSet);
    }
  }, [availableSets, currentSetNumber, onDataChange]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Set Number</label>
        <select
          value={component?.data.setNumber || 1}
          onChange={(e) => onDataChange('setNumber', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {availableSets.map((setNum) => (
            <option key={setNum} value={setNum}>
              Set {setNum}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-1">
          {availableSets.length < 3
            ? `Only shows sets that are in progress or completed (${availableSets.length} of 3 available)`
            : 'All sets available (no live data connection)'}
        </div>
      </div>

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
