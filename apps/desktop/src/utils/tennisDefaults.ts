/**
 * tennisDefaults - Default values for tennis components.
 *
 * Provides sensible defaults for display when no live data is available.
 */
import { ComponentType } from '../types/scoreboard';

/**
 * Gets default display text for a tennis component type.
 *
 * @param componentType - The type of tennis component
 * @param componentData - Component data including playerNumber and teamSelection
 * @returns Default text string for the component type
 */
export function getDefaultTennisText(
  componentType: ComponentType,
  componentData: { playerNumber?: number; teamSelection?: number; text?: string }
): string {
  switch (componentType) {
    case ComponentType.TENNIS_PLAYER_NAME:
      return `Player ${componentData.playerNumber || 1}`;
    case ComponentType.TENNIS_DOUBLES_PLAYER_NAME: {
      const playerNum = componentData.playerNumber || 1;
      if (playerNum === 1 || playerNum === 2) return 'Smith / Johnson';
      if (playerNum === 3 || playerNum === 4) return 'Williams / Brown';
      return 'Smith / Johnson';
    }
    case ComponentType.TENNIS_TEAM_NAMES: {
      const teamSelection = componentData.teamSelection || 0;
      if (teamSelection === 1) return 'Team 1';
      if (teamSelection === 2) return 'Team 2';
      return 'Team 1 vs Team 2';
    }
    case ComponentType.TENNIS_ADAPTIVE_TEAM_DISPLAY: {
      const adaptiveTeamSelection = componentData.teamSelection || 0;
      if (adaptiveTeamSelection === 1) return 'School A';
      if (adaptiveTeamSelection === 2) return 'School B';
      return 'School A - Smith vs School B - Johnson';
    }
    case ComponentType.TENNIS_GAME_SCORE:
      return '0';
    case ComponentType.TENNIS_SET_SCORE:
      return '0';
    case ComponentType.TENNIS_MATCH_SCORE:
      return '0';
    case ComponentType.TENNIS_DETAILED_SET_SCORE:
      return '0';
    case ComponentType.TENNIS_SERVING_INDICATOR:
      return '●';
    // Player-specific set score components
    case ComponentType.PLAYER1_SET1:
    case ComponentType.PLAYER2_SET1:
      return '0';
    case ComponentType.PLAYER1_SET2:
    case ComponentType.PLAYER2_SET2:
    case ComponentType.PLAYER1_SET3:
    case ComponentType.PLAYER2_SET3:
    case ComponentType.PLAYER1_SET4:
    case ComponentType.PLAYER2_SET4:
    case ComponentType.PLAYER1_SET5:
    case ComponentType.PLAYER2_SET5:
      return '';
    // Individual set components
    case ComponentType.TENNIS_SET_1:
      return '0-0';
    case ComponentType.TENNIS_SET_2:
    case ComponentType.TENNIS_SET_3:
    case ComponentType.TENNIS_SET_4:
    case ComponentType.TENNIS_SET_5:
      return '';
    default:
      return 'Tennis Data';
  }
}

/**
 * Gets the text alignment CSS classes for a component.
 *
 * @param textAlign - Text alignment value ('left', 'center', 'right')
 * @returns Object with justify and textAlign classes
 */
export function getAlignmentClasses(textAlign: string = 'center'): {
  justify: string;
  textAlign: string;
} {
  switch (textAlign) {
    case 'left':
      return { justify: 'justify-start', textAlign: 'text-left' };
    case 'right':
      return { justify: 'justify-end', textAlign: 'text-right' };
    case 'center':
    default:
      return { justify: 'justify-center', textAlign: 'text-center' };
  }
}
