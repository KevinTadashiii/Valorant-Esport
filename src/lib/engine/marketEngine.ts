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
 * Helper to clone player object deeply
 */
export function clonePlayer(player: Player): Player {
  return {
    ...player,
    stats: { ...player.stats },
    contract: { ...player.contract },
  };
}

/**
 * Helper to clone team object deeply
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
 * Calculate estimated loan fee for a player
 */
export function calculateLoanFee(
  player: Player,
  feeRatio: number = DEFAULT_LOAN_FEE_RATIO,
): number {
  return Math.max(0, Math.round(player.contract.buyout * feeRatio));
}

/**
 * Calculate contract termination penalty (severance for remaining contract duration)
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
 * Buy Out Player
 * Validates team budget. If sufficient, deducts budget by player.contract.buyout,
 * removes player relation from previous team (if any), and adds player to the new team's bench.
 */
export function buyoutPlayer(
  params: BuyoutParams,
): MarketActionResult<BuyoutResult> {
  const { buyerTeam, targetPlayer, sellerTeam, newContract } = params;
  const buyoutCost = targetPlayer.contract.buyout;

  if (buyerTeam.budget < buyoutCost) {
    return {
      success: false,
      message: `Insufficient budget to buyout ${targetPlayer.alias}. Required: $${buyoutCost.toLocaleString()}, Available: $${buyerTeam.budget.toLocaleString()}`,
      error: "INSUFFICIENT_BUDGET",
    };
  }

  let updatedSellerTeam: Team | undefined = undefined;

  if (sellerTeam) {
    const foundInSeller = findPlayerInTeam(sellerTeam, targetPlayer.id);
    if (!foundInSeller) {
      return {
        success: false,
        message: `Player ${targetPlayer.alias} was not found in the seller team (${sellerTeam.name}).`,
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
    message: `Successfully bought out ${targetPlayer.name} (${targetPlayer.alias}) for $${buyoutCost.toLocaleString()}. Player added to bench.`,
    data: {
      buyerTeam: updatedBuyerTeam,
      sellerTeam: updatedSellerTeam,
      player: updatedPlayer,
      feePaid: buyoutCost,
    },
  };
}

/**
 * Loan Player
 * Borrows player with a low upfront fee while deducting regular budget.
 * Sets isLoaned boolean to true and places player on Team.bench.
 */
export function loanPlayer(params: LoanParams): MarketActionResult<LoanResult> {
  const { borrowerTeam, targetPlayer, lendingTeam, loanFee, loanDuration } =
    params;

  if (targetPlayer.contract.isLoaned) {
    return {
      success: false,
      message: `Player ${targetPlayer.alias} is currently on loan with another team.`,
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
      message: `Insufficient budget for loan fee of ${targetPlayer.alias}. Required: $${fee.toLocaleString()}, Available: $${borrowerTeam.budget.toLocaleString()}`,
      error: "INSUFFICIENT_BUDGET",
    };
  }

  let updatedLendingTeam: Team | undefined = undefined;

  if (lendingTeam) {
    const foundInLending = findPlayerInTeam(lendingTeam, targetPlayer.id);
    if (!foundInLending) {
      return {
        success: false,
        message: `Player ${targetPlayer.alias} was not found in the lending team (${lendingTeam.name}).`,
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
    message: `Successfully loaned ${targetPlayer.name} (${targetPlayer.alias}) for ${duration} periods with a fee of $${fee.toLocaleString()}.`,
    data: {
      borrowerTeam: updatedBorrowerTeam,
      lendingTeam: updatedLendingTeam,
      player: updatedPlayer,
      feePaid: fee,
      duration: duration,
    },
  };
}
