/**
 * TennisNameRenderer - Renders tennis player/team name components with live data.
 *
 * Handles: TENNIS_PLAYER_NAME, TENNIS_DOUBLES_PLAYER_NAME,
 * TENNIS_TEAM_NAMES, TENNIS_ADAPTIVE_TEAM_DISPLAY
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
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

/**
 * Helper to format name as "F. LastName"
 */
function formatDoublesName(fullName: string | undefined): string {
  if (!fullName || typeof fullName !== 'string') return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return `${firstName.charAt(0)}. ${lastName}`;
}

/**
 * Calculates the display text for tennis name components.
 */
function getDisplayText(
  componentType: ComponentType,
  componentData: { playerNumber?: number; teamSelection?: number; separator?: string; text?: string },
  tennisMatch: TennisLiveData | null,
  fallbackText: string
): string {
  if (!tennisMatch) return fallbackText;

  switch (componentType) {
    case ComponentType.TENNIS_PLAYER_NAME:
      return componentData.playerNumber === 2
        ? tennisMatch.player2?.name || 'Player 2'
        : tennisMatch.player1?.name || 'Player 1';

    case ComponentType.TENNIS_DOUBLES_PLAYER_NAME: {
      const teamSelection = componentData.playerNumber || 1;
      const separator = componentData.separator || ' / ';

      if (tennisMatch.doublesPlayers) {
        if (teamSelection === 1) {
          const p1 = formatDoublesName(tennisMatch.doublesPlayers.team1?.player1?.name);
          const p2 = formatDoublesName(tennisMatch.doublesPlayers.team1?.player2?.name);
          if (p1 && p2) return `${p1}${separator}${p2}`;
          if (p1) return p1;
          if (p2) return p2;
          return tennisMatch.team1Name || 'Team 1';
        } else {
          const p1 = formatDoublesName(tennisMatch.doublesPlayers.team2?.player1?.name);
          const p2 = formatDoublesName(tennisMatch.doublesPlayers.team2?.player2?.name);
          if (p1 && p2) return `${p1}${separator}${p2}`;
          if (p1) return p1;
          if (p2) return p2;
          return tennisMatch.team2Name || 'Team 2';
        }
      }
      return componentData.playerNumber === 1
        ? tennisMatch.team1Name || 'Team 1'
        : tennisMatch.team2Name || 'Team 2';
    }

    case ComponentType.TENNIS_TEAM_NAMES: {
      const teamSel = componentData.teamSelection || 0;
      if (teamSel === 1) return tennisMatch.team1Name || 'Team 1';
      if (teamSel === 2) return tennisMatch.team2Name || 'Team 2';
      return `${tennisMatch.team1Name || 'Team 1'} vs ${tennisMatch.team2Name || 'Team 2'}`;
    }

    case ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY: {
      const adaptiveSel = componentData.teamSelection || 0;
      let team1Text = tennisMatch.team1Name || 'Team 1';
      let team2Text = tennisMatch.team2Name || 'Team 2';

      if (tennisMatch.matchType === 'singles') {
        const p1Name = tennisMatch.player1?.name;
        const p2Name = tennisMatch.player2?.name;
        if (p1Name && p1Name.includes(' ')) {
          team1Text += ' - ' + p1Name.split(' ').pop();
        }
        if (p2Name && p2Name.includes(' ')) {
          team2Text += ' - ' + p2Name.split(' ').pop();
        }
      }

      if (adaptiveSel === 1) return team1Text;
      if (adaptiveSel === 2) return team2Text;
      return `${team1Text} vs ${team2Text}`;
    }

    default:
      return fallbackText;
  }
}

export const TennisNameRenderer: React.FC<TennisNameRendererProps> = ({
  componentType,
  componentData,
  componentStyle,
  componentId,
  tennisMatch,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaledFontSize, setScaledFontSize] = useState(componentStyle.fontSize || 16);
  const { justify, textAlign: textAlignClass } = getAlignmentClasses(componentStyle.textAlign);
  const fallbackText = componentData.text || getDefaultTennisText(componentType, componentData);
  const baseFontSize = componentStyle.fontSize || 16;

  // Calculate display text
  const displayText = getDisplayText(componentType, componentData, tennisMatch, fallbackText);

  // Auto-scale font to fit container
  const calculateScaledFont = useCallback(() => {
    const container = containerRef.current;
    if (!container || !displayText) {
      setScaledFontSize(baseFontSize);
      return;
    }

    const containerWidth = container.offsetWidth;
    if (containerWidth === 0) {
      setScaledFontSize(baseFontSize);
      return;
    }

    // Create a temporary span to measure text width
    const measureSpan = document.createElement('span');
    measureSpan.style.visibility = 'hidden';
    measureSpan.style.position = 'absolute';
    measureSpan.style.whiteSpace = 'nowrap';
    measureSpan.style.fontSize = `${baseFontSize}px`;
    measureSpan.style.fontWeight = String(componentStyle.fontWeight || 'bold');
    measureSpan.textContent = displayText;
    document.body.appendChild(measureSpan);

    const textWidth = measureSpan.offsetWidth;
    document.body.removeChild(measureSpan);

    // Calculate available width (accounting for padding)
    const style = window.getComputedStyle(container);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const availableWidth = containerWidth - paddingLeft - paddingRight - 4;

    // Calculate scale factor if text is too wide
    if (textWidth > availableWidth && textWidth > 0) {
      const scaleFactor = availableWidth / textWidth;
      const newFontSize = Math.max(baseFontSize * scaleFactor, 10); // Minimum 10px
      setScaledFontSize(newFontSize);
    } else {
      setScaledFontSize(baseFontSize);
    }
  }, [displayText, baseFontSize, componentStyle.fontWeight]);

  // Recalculate on mount and when dependencies change
  useEffect(() => {
    calculateScaledFont();
  }, [calculateScaledFont]);

  // Also recalculate when container might resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateScaledFont();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [calculateScaledFont]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex items-center ${justify} ${textAlignClass} px-2 relative score-change-base tennis-component`}
      style={{
        fontSize: `${scaledFontSize}px`,
        color: componentStyle.textColor || '#ffffff',
        fontWeight: componentStyle.fontWeight || 'bold',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        transition: 'font-size 0.15s ease',
      }}
      data-component-id={componentId}
      data-component-type={componentType}
      data-player-number={componentData.playerNumber || 1}
    >
      {displayText}
    </div>
  );
};
