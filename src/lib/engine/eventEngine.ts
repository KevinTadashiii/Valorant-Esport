import {
  Team,
  MatchState,
} from "../types";

/**
 * Parameters for triggering events
 */
export interface TriggerEventParams {
  team: Team;
  matchState?: MatchState;
}

/**
 * Result of triggering events
 */
export interface TriggerEventResult {
  updatedTeam: Team;
  events: string[];
}

/**
 * Trigger dynamic stochastic events for a team.
 *
 * - External Scandal Event: Triggered if player discipline < 50
 *   - Effect: Reduces morale, suspends player for N matches
 * - Voluntary Transfer Event (Farewell): Triggered if team win rate < 40%
 *   - Effect: Marks high-stat players for transfer listing
 *
 * @param params - Contains team and optional match state
 * @returns Object containing updated team and array of triggered events
 */
export function triggerEvents(params: TriggerEventParams): TriggerEventResult {
  const { team, matchState } = params;

  const updatedTeam: Team = JSON.parse(JSON.stringify(team));
  const events: string[] = [];

  for (const player of updatedTeam.roster) {
    if (player.stats.discipline < 50 && Math.random() < 0.3) {
      const moraleDrop = 10;
      player.stats.morale = Math.max(1, player.stats.morale - moraleDrop);

      player.isSuspended = true;
      player.suspensionMatches = 3;

      if (matchState) {
        matchState.matchLog.push(
          `[Scandal] Player ${player.id} (${player.alias}) disciplined. Discipline: ${player.stats.discipline} < 50. Morale: ${player.stats.morale}`
        );
      }
      events.push(`Scandal: Player ${player.id} misconduct`);
    }
  }

  if (matchState && matchState.teamA && matchState.teamB) {
    // Avoid division by zero
    if (matchState.currentRound > 0) {
      // Calculate overall match win rate (simplified approach)
      const totalRounds = matchState.currentRound;
      const totalPoints = matchState.scoreA + matchState.scoreB;
      const winRate = (totalPoints / (totalRounds * 2)) * 100; // Assuming max 2 points per round

      if (winRate < 40) {
        for (const player of updatedTeam.roster) {
          // Check if player has high stats (top 20% threshold: > 80)
          if (player.stats.aim > 80 || player.stats.utility > 80) {
            // Mark player for transfer listing
            player.isTransferListed = true;

            if (matchState) {
              matchState.matchLog.push(
                `[Transfer] Player ${player.id} (${player.alias}) requested transfer. Team win rate: ${winRate.toFixed(2)}%`
              );
            }
            events.push(`Transfer Request: Player ${player.id}`);
          }
        }
      }
    }
  }

  return { updatedTeam, events };
}