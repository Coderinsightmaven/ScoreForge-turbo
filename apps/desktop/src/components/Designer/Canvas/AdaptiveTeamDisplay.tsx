import React from 'react';
import { TennisLiveData } from '../../../types/scoreboard';

interface AdaptiveTeamDisplayProps {
  tennisMatch: TennisLiveData | null;
  teamSelection?: number; // 0 for both teams, 1 for team 1 only, 2 for team 2 only
  separator?: string; // separator between team names when showing both
  fallbackText?: string;
}

export const AdaptiveTeamDisplay: React.FC<AdaptiveTeamDisplayProps> = ({
  tennisMatch,
  teamSelection = 0, // Default to showing both teams
  separator = " vs ",
  fallbackText = "Team 1 vs Team 2",
}) => {
  const getTeamDisplayName = (sideIndex: number): string => {
    if (!tennisMatch) return `Team ${sideIndex + 1}`;

    const liveMatch = tennisMatch;

    // Check for team names (school names)
    const teamNameKey = sideIndex === 0 ? 'team1Name' : 'team2Name';
    if (liveMatch[teamNameKey]) {
      let displayText = liveMatch[teamNameKey]!;

      // For singles matches, append player last name
      if (liveMatch.matchType === 'singles') {
        const player = sideIndex === 0 ? liveMatch.player1 : liveMatch.player2;
        if (player?.name && player.name.includes(' ')) {
          const lastName = player.name.split(' ').pop();
          displayText += ` - ${lastName}`;
        }
      }

      return displayText;
    }

    // Fallback to player names
    if (liveMatch.player1 || liveMatch.player2) {
      const player = sideIndex === 0 ? liveMatch.player1 : liveMatch.player2;
      if (player?.name) {
        return player.name;
      }
    }

    return `Team ${sideIndex + 1}`;
  };

  const getDisplayValue = (): string => {
    if (!tennisMatch) {
      return fallbackText;
    }

    // If a specific team is requested, return just that team's name
    if (teamSelection === 1) {
      return getTeamDisplayName(0);
    } else if (teamSelection === 2) {
      return getTeamDisplayName(1);
    }

    // If teamSelection is 0 or not set, return both team names with separator
    const team1Name = getTeamDisplayName(0);
    const team2Name = getTeamDisplayName(1);
    return `${team1Name}${separator}${team2Name}`;
  };

  return <>{getDisplayValue()}</>;
};
