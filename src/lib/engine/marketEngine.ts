import {
  BuyoutResult,
  Contract,
  LoanResult,
  MarketActionResult,
  Player,
  RosterActionResult,
  Team,
  TerminationResult,
} from "../types";

export const DEFAULT_ROSTER_LIMIT = 5;
export const DEFAULT_LOAN_FEE_RATIO = 0.2;
export const DEFAULT_TERMINATION_PENALTY_RATE = 1.0;
export const DEFAULT_TERMINATION_MORALE_PENALTY_PERCENT = 10;
export const MIN_MORALE = 1;
export const MAX_MORALE = 100;

export interface BuyoutParams {
  buyerTeam: Team;
  targetPlayer: Player;
  sellerTeam?: Team | null;
  newContract?: Partial<Contract>;
}

export interface LoanParams {
  borrowerTeam: Team;
  targetPlayer: Player;
  lendingTeam?: Team | null;
  loanFee?: number;
  loanDuration?: number;
}

export interface TerminateParams {
  team: Team;
  playerId: string;
  penaltyRate?: number;
  moralePenaltyPercent?: number;
}

/**
 * Helper to clone a player object deeply
 */
export function clonePlayer(player: Player): Player {
  return {
    ...player,
    stats: { ...player.stats },
    contract: { ...player.contract },
  };
}

/**
 * Helper to clone a team object deeply
 */
export function cloneTeam(team: Team): Team {
  return {
    ...team,
    roster: team.roster.map(clonePlayer),
    bench: team.bench.map(clonePlayer),
  };
}

/**
 * Find a player in a team's roster or bench
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
 * Remove a player from a team's roster or bench
 */
export function removePlayerFromTeam(team: Team, playerId: string): Team {
  return {
    ...team,
    roster: team.roster.filter((p) => p.id !== playerId).map(clonePlayer),
    bench: team.bench.filter((p) => p.id !== playerId).map(clonePlayer),
  };
}

/**
 * Calculate the estimated loan fee for a player
 */
export function calculateLoanFee(
  player: Player,
  feeRatio: number = DEFAULT_LOAN_FEE_RATIO,
): number {
  return Math.max(0, Math.round(player.contract.buyout * feeRatio));
}

/**
 * Calculate the termination penalty (remaining contract severance) for a player
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
 * 1. Buy Out Player
 * Validates the buyer team's budget. If sufficient, deducts the buyout cost
 * from the buyer's budget, removes the player from the seller team (if provided),
 * and appends the player to the buyer's bench.
 */
export function buyoutPlayer(
  params: BuyoutParams,
): MarketActionResult<BuyoutResult> {
  const { buyerTeam, targetPlayer, sellerTeam, newContract } = params;
  const buyoutCost = targetPlayer.contract.buyout;

  if (buyerTeam.budget < buyoutCost) {
    return {
      success: false,
      message: `Insufficient budget to buy out ${targetPlayer.alias}. Required: $${buyoutCost.toLocaleString()}, Available: $${buyerTeam.budget.toLocaleString()}`,
      error: "INSUFFICIENT_BUDGET",
    };
  }

  let updatedSellerTeam: Team | undefined = undefined;

  if (sellerTeam) {
    const foundInSeller = findPlayerInTeam(sellerTeam, targetPlayer.id);
    if (!foundInSeller) {
      return {
        success: false,
        message: `Player ${targetPlayer.alias} not found in seller team (${sellerTeam.name}).`,
        error: "PLAYER_NOT_IN_SELLER_TEAM",
      };
    }

    const sellerAfterRemoval = removePlayerFromTeam(
      sellerTeam,
      targetPlayer.id,
    );
    updatedSellerTeam = {
      ...sellerAfterRemoval,
      budget: sellerAfterRemoval.budget + buyoutCost,
    };
  }

  const updatedPlayer: Player = {
    ...clonePlayer(targetPlayer),
    contract: {
      ...targetPlayer.contract,
      ...(newContract || {}),
      isLoaned: false,
    },
    isTransferListed: false,
  };

  const updatedBuyerTeam: Team = {
    ...cloneTeam(buyerTeam),
    budget: buyerTeam.budget - buyoutCost,
    bench: [...buyerTeam.bench.map(clonePlayer), updatedPlayer],
  };

  return {
    success: true,
    message: `Successfully purchased ${targetPlayer.name} (${targetPlayer.alias}) for $${buyoutCost.toLocaleString()}. Player has been added to the bench.`,
    data: {
      buyerTeam: updatedBuyerTeam,
      sellerTeam: updatedSellerTeam,
      player: updatedPlayer,
      feePaid: buyoutCost,
    },
  };
}

/**
 * 2. Loan Player
 * Borrows a player at a low upfront cost while deducting from the regular budget.
 * Sets isLoaned to true and places the player on the borrower's bench.
 */
export function loanPlayer(params: LoanParams): MarketActionResult<LoanResult> {
  const { borrowerTeam, targetPlayer, lendingTeam, loanFee, loanDuration } =
    params;

  if (targetPlayer.contract.isLoaned) {
    return {
      success: false,
      message: `Player ${targetPlayer.alias} is currently on loan to another team.`,
      error: "ALREADY_LOANED",
    };
  }

  const fee = loanFee !== undefined ? loanFee : calculateLoanFee(targetPlayer);
  const duration =
    loanDuration !== undefined
      ? loanDuration
      : Math.max(1, targetPlayer.contract.duration);

  if (borrowerTeam.budget < fee) {
    return {
      success: false,
      message: `Insufficient budget for ${targetPlayer.alias}'s loan fee. Required: $${fee.toLocaleString()}, Available: $${borrowerTeam.budget.toLocaleString()}`,
      error: "INSUFFICIENT_BUDGET",
    };
  }

  let updatedLendingTeam: Team | undefined = undefined;

  if (lendingTeam) {
    const foundInLending = findPlayerInTeam(lendingTeam, targetPlayer.id);
    if (!foundInLending) {
      return {
        success: false,
        message: `Player ${targetPlayer.alias} not found in lending team (${lendingTeam.name}).`,
        error: "PLAYER_NOT_IN_LENDING_TEAM",
      };
    }

    const lendingAfterRemoval = removePlayerFromTeam(
      lendingTeam,
      targetPlayer.id,
    );
    updatedLendingTeam = {
      ...lendingAfterRemoval,
      budget: lendingAfterRemoval.budget + fee,
    };
  }

  const updatedPlayer: Player = {
    ...clonePlayer(targetPlayer),
    contract: {
      ...targetPlayer.contract,
      isLoaned: true,
      duration: duration,
    },
    isTransferListed: false,
  };

  const updatedBorrowerTeam: Team = {
    ...cloneTeam(borrowerTeam),
    budget: borrowerTeam.budget - fee,
    bench: [...borrowerTeam.bench.map(clonePlayer), updatedPlayer],
  };

  return {
    success: true,
    message: `Successfully loaned ${targetPlayer.name} (${targetPlayer.alias}) for ${duration} period(s) at a cost of $${fee.toLocaleString()}.`,
    data: {
      borrowerTeam: updatedBorrowerTeam,
      lendingTeam: updatedLendingTeam,
      player: updatedPlayer,
      feePaid: fee,
      duration: duration,
    },
  };
}

/**
 * 3. Terminate Contract
 * Unilaterally terminates a player's contract. Requires the team to pay a penalty
 * (severance) and reduces the morale of remaining roster players by the specified percentage.
 */
export function terminateContract(
  params: TerminateParams,
): MarketActionResult<TerminationResult> {
  const {
    team,
    playerId,
    penaltyRate = DEFAULT_TERMINATION_PENALTY_RATE,
    moralePenaltyPercent = DEFAULT_TERMINATION_MORALE_PENALTY_PERCENT,
  } = params;

  const found = findPlayerInTeam(team, playerId);
  if (!found) {
    return {
      success: false,
      message: `Player with ID "${playerId}" not found in team ${team.name}.`,
      error: "PLAYER_NOT_FOUND",
    };
  }

  const targetPlayer = found.player;
  const penalty = calculateTerminationPenalty(targetPlayer, penaltyRate);

  if (team.budget < penalty) {
    return {
      success: false,
      message: `Team budget is insufficient to pay the contract termination penalty of $${penalty.toLocaleString()}. Available: $${team.budget.toLocaleString()}`,
      error: "INSUFFICIENT_BUDGET",
    };
  }

  const teamAfterRemoval = removePlayerFromTeam(team, playerId);

  // Reduce morale of remaining players in roster and bench
  const applyMoralePenalty = (player: Player): Player => {
    const cloned = clonePlayer(player);
    const dropMultiplier = Math.max(0, 1 - moralePenaltyPercent / 100);
    const updatedMorale = Math.max(
      MIN_MORALE,
      Math.min(MAX_MORALE, Math.round(cloned.stats.morale * dropMultiplier)),
    );
    cloned.stats.morale = updatedMorale;
    return cloned;
  };

  const updatedTeam: Team = {
    ...teamAfterRemoval,
    budget: teamAfterRemoval.budget - penalty,
    roster: teamAfterRemoval.roster.map(applyMoralePenalty),
    bench: teamAfterRemoval.bench.map(applyMoralePenalty),
  };

  return {
    success: true,
    message: `Contract for ${targetPlayer.name} (${targetPlayer.alias}) has been terminated. Termination penalty: $${penalty.toLocaleString()}. Team morale reduced by ${moralePenaltyPercent}%.`,
    data: {
      team: updatedTeam,
      terminatedPlayer: targetPlayer,
      penaltyPaid: penalty,
      moralePenaltyApplied: moralePenaltyPercent,
    },
  };
}

/**
 * 4. Roster Management: Swap Starter & Bench Player
 */
export function swapRosterAndBench(
  team: Team,
  rosterPlayerId: string,
  benchPlayerId: string,
): MarketActionResult<RosterActionResult> {
  const rosterIndex = team.roster.findIndex((p) => p.id === rosterPlayerId);
  const benchIndex = team.bench.findIndex((p) => p.id === benchPlayerId);

  if (rosterIndex === -1) {
    return {
      success: false,
      message: `Starter player with ID "${rosterPlayerId}" not found in the main roster.`,
      error: "ROSTER_PLAYER_NOT_FOUND",
    };
  }

  if (benchIndex === -1) {
    return {
      success: false,
      message: `Bench player with ID "${benchPlayerId}" not found in the bench.`,
      error: "BENCH_PLAYER_NOT_FOUND",
    };
  }

  const rosterPlayer = clonePlayer(team.roster[rosterIndex]);
  const benchPlayer = clonePlayer(team.bench[benchIndex]);

  const newRoster = [...team.roster.map(clonePlayer)];
  const newBench = [...team.bench.map(clonePlayer)];

  newRoster[rosterIndex] = benchPlayer;
  newBench[benchIndex] = rosterPlayer;

  const updatedTeam: Team = {
    ...team,
    roster: newRoster,
    bench: newBench,
  };

  return {
    success: true,
    message: `Successfully swapped ${benchPlayer.alias} (promoted to Roster) with ${rosterPlayer.alias} (moved to Bench).`,
    data: {
      team: updatedTeam,
      message: `Swapped ${benchPlayer.alias} and ${rosterPlayer.alias}`,
    },
  };
}
