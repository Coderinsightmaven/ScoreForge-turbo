/**
 * TennisNameRenderer - Renders tennis player/team name components with live data.
 *
 * Handles: TENNIS_PLAYER_NAME, TENNIS_DOUBLES_PLAYER_NAME,
 * TENNIS_TEAM_NAMES, TENNIS_ADAPTIVE_TEAM_DISPLAY
 */
import React from 'react';
import { ComponentType, TennisLiveData } from '../../../../types/scoreboard';
import { TennisPlayerNameDisplay } from '../TennisPlayerNameDisplay';
import { getDefaultTennisText, getAlignmentClasses } from '../../../../utils/tennisDefaults';

interface TennisNameRendererProps {
  componentType: ComponentType;
  componentData: {
    playerNumber?: number;
    teamSelection?: number;
    separator?: string;
    text?: string;
  };
  componentStyle: {
    fontSize?: number;
    textColor?: string;
    fontWeight?: string;
    textAlign?: string;
  };
  componentId: string;
  tennisMatch: TennisLiveData | null;
}

export const TennisNameRenderer: React.FC<TennisNameRendererProps> = ({
  componentType,
  componentData,
  componentStyle,
  componentId,
  tennisMatch,
}) => {
  const { justify, textAlign: textAlignClass } = getAlignmentClasses(componentStyle.textAlign);
  const fallbackText = componentData.text || getDefaultTennisText(componentType, componentData);

  // Simple player name rendering
  if (componentType === ComponentType.TENNIS_PLAYER_NAME) {
    const displayValue = tennisMatch
      ? componentData.playerNumber === 2
        ? tennisMatch.player2?.name || 'Player 2'
        : tennisMatch.player1?.name || 'Player 1'
      : fallbackText;

    return (
      <div
        className={`w-full h-full flex items-center ${justify} ${textAlignClass} px-2 relative score-change-base tennis-component`}
        style={{
          fontSize: `${componentStyle.fontSize || 16}px`,
          color: componentStyle.textColor || '#ffffff',
          fontWeight: componentStyle.fontWeight || 'bold',
          wordWrap: 'break-word',
          overflow: 'hidden',
          transition: 'transform 0.2s ease',
        }}
        data-component-id={componentId}
        data-component-type={componentType}
        data-player-number={componentData.playerNumber || 1}
      >
        {displayValue}
      </div>
    );
  }

  // Use TennisPlayerNameDisplay for complex name rendering
  // (doubles, team names, adaptive display)
  return (
    <div
      className={`w-full h-full flex items-center ${justify} ${textAlignClass} px-2 relative score-change-base tennis-component`}
      style={{
        fontSize: `${componentStyle.fontSize || 16}px`,
        color: componentStyle.textColor || '#ffffff',
        fontWeight: componentStyle.fontWeight || 'bold',
        wordWrap: 'break-word',
        overflow: 'hidden',
        transition: 'transform 0.2s ease',
      }}
      data-component-id={componentId}
      data-component-type={componentType}
      data-player-number={componentData.playerNumber || 1}
    >
      {tennisMatch ? (
        <TennisPlayerNameDisplay
          tennisMatch={tennisMatch}
          componentType={componentType}
          componentData={componentData}
          fallbackText={fallbackText}
        />
      ) : (
        fallbackText
      )}
    </div>
  );
};
