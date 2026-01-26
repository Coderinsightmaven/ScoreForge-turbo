/**
 * TennisAdaptiveDisplayEditor - Property editor for TENNIS_ADAPTIVE_TEAM_DISPLAY components.
 */
import React from 'react';
import { TextStyleSection } from '../shared/TextStyleSection';
import { EditorProps } from './types';

export const TennisAdaptiveDisplayEditor: React.FC<EditorProps> = ({
  component,
  onDataChange,
  onStyleChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Team Selection</label>
        <select
          value={component?.data.teamSelection || 0}
          onChange={(e) => onDataChange('teamSelection', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0}>Both Teams (Team 1 vs Team 2)</option>
          <option value={1}>Team 1 Only</option>
          <option value={2}>Team 2 Only</option>
        </select>
        <div className="text-xs text-gray-500 mt-1">Select which team(s) to display</div>
      </div>

      <div className="bg-blue-50 p-3 rounded-md">
        <div className="text-sm text-blue-800">
          <strong>Adaptive Display Logic:</strong>
          <ul className="mt-2 space-y-1 text-xs">
            <li>
              • <strong>Doubles:</strong> Shows school name from sides[].note
            </li>
            <li>
              • <strong>Singles:</strong> Shows school name + player's last name
            </li>
            <li>• Example: "Georgia" (doubles) or "Georgia - Smith" (singles)</li>
          </ul>
        </div>
      </div>

      <TextStyleSection component={component} onStyleChange={onStyleChange} />
    </div>
  );
};
