import {
  Contract,
  Player,
  Team,
} from "../types";

/**
 * Market Helper Utilities
 *
 * This module contains pure, side-effect-free utility functions used by the market engine.
 * All functions return new immutable objects and do not mutate their inputs.
 */

export const DEFAULT_ROSTER_LIMIT = 5;
export const DEFAULT_LOAN_FEE_RATIO = 0.2;
export const DEFAULT_TERMINATION_PENALTY_RATE = 1.0;
export const DEFAULT_TERMINATION_MORALE_PENALTY_PERCENT = 10;
export const MIN_MORALE = 1;
export const MAX_MORALE = 100;

/**
 * Deeply clones a Player object, ensuring all nested objects are new references.
 */
export function clonePlayer(player: Player): Player {
  return {
    ...player,
    stats: { ...player.stats },
    contract: { ...player.contract },
  };
}

/**
 * Deeply clones a Team object, including all players in roster and bench.
 */
export function cloneTeam(team: Team): Team {
  return {
    ...team,
    roster: team.roster.map(clonePlayer),
    bench: team.bench.map(clonePlayer),
  };
}

/**
 * Finds a player in a team's roster or bench.
 * Returns a cloned player along with its location and index.
 */
export function findPlayerInTeam(
  team: Team,
  playerId: string,
): { player: Player; location: "roster" | "bench"; index: number } | null {
  const rosterIndex = team.roster.findIndex((p) => p.id === playerId);
  if (rosterIndex !== -1) {
    return {
      player: clonePlayer(team.roster[rosterIndex]),
      location: "roster",
      index: rosterIndex,
    };
  }

  const benchIndex = team.bench.findIndex((p) => p.id === playerId);
  if (benchIndex !== -1) {
    return {
      player: clonePlayer(team.bench[benchIndex]),
      location: "bench",
      index: benchIndex,
    };
  }

  return null;
}

/**
 * Removes a player from a team's roster or bench by ID.
 * Returns a new Team object with the player filtered out.
 */
export function removePlayerFromTeam(team: Team, playerId: string): Team {
  return {
    ...team,
    roster: team.roster.filter((p) => p.id !== playerId).map(clonePlayer),
    bench: team.bench.filter((p) => p.id !== playerId).map(clonePlayer),
  };
}

/**
 * Adjusts a team's budget by a given delta (positive or negative).
 * Returns a new Team object with the updated budget.
 * No validation is performed; callers must ensure sufficient budget before calling.
 */
export function adjustTeamBudget(team: Team, delta: number): Team {
  return {
    ...team,
    budget: team.budget + delta,
  };
}

/**
 * Adds a player to a team's bench.
 * The provided player should already be a cloned object.
 * Returns a new Team object with the player appended to the bench.
 */
export function addPlayerToBench(team: Team, player: Player): Team {
  return {
    ...team,
    bench: [...team.bench.map(clonePlayer), player],
  };
}

/**
 * Updates a specific player in a team's roster or bench at the given index.
 * Returns a new Team object with the player replaced in the appropriate list.
 */
export function updatePlayerInTeam(
  team: Team,
  location: "roster" | "bench",
  index: number,
  updatedPlayer: Player,
): Team {
  if (location === "roster") {
    return {
      ...team,
      roster: team.roster.map((p, i) => (i === index ? updatedPlayer : clonePlayer(p))),
      bench: team.bench.map(clonePlayer),
    };
  }
  return {
    ...team,
    roster: team.roster.map(clonePlayer),
    bench: team.bench.map((p, i) => (i === index ? updatedPlayer : clonePlayer(p))),
  };
}

/**
 * Calculates the estimated loan fee for a player based on their buyout value.
 */
export function calculateLoanFee(
  player: Player,
  feeRatio: number = DEFAULT_LOAN_FEE_RATIO,
): number {
  return Math.max(0, Math.round(player.contract.buyout * feeRatio));
}

/**
 * Calculates the contract termination penalty (severance) for a player.
 */
export function calculateTerminationPenalty(
  player: Player,
  penaltyRate: number = DEFAULT_TERMINATION_PENALTY_RATE,
): number {
  return Math.max(
    0,
    Math.round(player.contract.salary * player.contract.duration * penaltyRate),
  );
}

/**
 * Applies a morale penalty to a cloned player.
 * Returns a new Player object with updated morale stats.
 */
export function applyMoralePenalty(
  player: Player,
  penaltyPercent: number,
): Player {
  const cloned = clonePlayer(player);
  const dropMultiplier = Math.max(0, 1 - penaltyPercent / 100);
  const updatedMorale = Math.max(
    MIN_MORALE,
    Math.min(MAX_MORALE, Math.round(cloned.stats.morale * dropMultiplier)),
  );
  cloned.stats.morale = updatedMorale;
  return cloned;
}