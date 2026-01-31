/**
 * TennisServingRenderer - Renders tennis serving indicator components.
 *
 * Shows a dot indicator when the specified player is serving.
 */
import React from 'react';
import { ComponentType, TennisLiveData } from '../../../../types/scoreboard';
import { getDefaultTennisText, getAlignmentClasses } from '../../../../utils/tennisDefaults';

interface TennisServingRendererProps {
  componentData: {
    playerNumber?: number;
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

export const TennisServingRenderer: React.FC<TennisServingRendererProps> = ({
  componentData,
  componentStyle,
  componentId,
  tennisMatch,
}) => {
  const { justify, textAlign: textAlignClass } = getAlignmentClasses(componentStyle.textAlign);

  const getDisplayValue = (): string => {
    if (!tennisMatch) {
      return componentData.text || getDefaultTennisText(ComponentType.TENNIS_SERVING_INDICATOR, componentData);
    }

    // Only show serve indicator when match is live (in_progress)
    if (tennisMatch.matchStatus !== 'in_progress') {
      return '';
    }

    const servingPlayer = tennisMatch.servingPlayer;
    const selectedPlayer = componentData.playerNumber || 1;

    if (servingPlayer === selectedPlayer) {
      return '●'; // Dot when selected player is serving
    }
    return ''; // Empty when selected player is not serving
  };

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
      data-component-type={ComponentType.TENNIS_SERVING_INDICATOR}
      data-player-number={componentData.playerNumber || 1}
    >
      {getDisplayValue()}
    </div>
  );
};
