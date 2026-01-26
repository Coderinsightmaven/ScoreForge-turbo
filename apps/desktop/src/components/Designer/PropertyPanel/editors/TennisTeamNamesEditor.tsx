/**
 * TennisTeamNamesEditor - Property editor for TENNIS_TEAM_NAMES components.
 */
import React, { useState, useEffect } from 'react';
import { TextStyleSection } from '../shared/TextStyleSection';
import { EditorProps } from './types';

export const TennisTeamNamesEditor: React.FC<EditorProps> = ({
  component,
  onDataChange,
  onStyleChange,
}) => {
  const [localText, setLocalText] = useState(component?.data.text || '');
  const [separator, setSeparator] = useState(component?.data.separator || ' vs ');

  useEffect(() => {
    setLocalText(component?.data.text || '');
    setSeparator(component?.data.separator || ' vs ');
  }, [component?.id, component?.data.text, component?.data.separator]);

  const handleTextBlur = () => {
    if (localText !== component?.data.text) {
      onDataChange('text', localText);
    }
  };

  const handleSeparatorBlur = () => {
    if (separator !== component?.data.separator) {
      onDataChange('separator', separator);
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
          <option value={1}>Player 1 (Team 1)</option>
          <option value={2}>Player 2 (Team 2)</option>
        </select>
        <div className="text-xs text-gray-500 mt-1">
          Select which player/team this component represents
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Team Display</label>
        <select
          value={component?.data.teamSelection || 0}
          onChange={(e) => onDataChange('teamSelection', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0}>Both Teams (Team 1 vs Team 2)</option>
          <option value={1}>Team 1 Only</option>
          <option value={2}>Team 2 Only</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Separator (for both teams)
        </label>
        <input
          type="text"
          value={separator}
          onChange={(e) => setSeparator(e.target.value)}
          onBlur={handleSeparatorBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder=" vs "
        />
        <div className="text-xs text-gray-500 mt-1">
          Text to display between team names (e.g., " vs ", " - ", " | ")
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fallback Text</label>
        <input
          type="text"
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={handleTextBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Team 1 vs Team 2"
        />
        <div className="text-xs text-gray-500 mt-1">Text to show when no live data is available</div>
      </div>

      <TextStyleSection component={component} onStyleChange={onStyleChange} />
    </div>
  );
};
