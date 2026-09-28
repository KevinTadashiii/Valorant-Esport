import {
  BuyoutResult,
  Contract,
  EngineResult,
  LoanResult,
  Player,
  RosterActionResult,
  Team,
  TerminationResult,
  TransferListingResult,
} from "../types";

import {
  DEFAULT_ROSTER_LIMIT,
  DEFAULT_LOAN_FEE_RATIO,
  DEFAULT_TERMINATION_PENALTY_RATE,
  DEFAULT_TERMINATION_MORALE_PENALTY_PERCENT,
  MIN_MORALE,
  MAX_MORALE,
  clonePlayer,
  cloneTeam,
  findPlayerInTeam,
  removePlayerFromTeam,
  adjustTeamBudget,
  addPlayerToBench,
  updatePlayerInTeam,
  calculateLoanFee,
  calculateTerminationPenalty,
  applyMoralePenalty,
} from "./marketHelpers";

import { makeFailure } from "./errorUtils";

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
 * 1. Buy Out Player
 * Validates the buyer team's budget. If sufficient, deducts the buyout cost
 * from the buyer's budget, removes the player from the seller team (if provided),
 * and appends the player to the buyer's bench.
 */
export function buyoutPlayer(
  params: BuyoutParams,
): EngineResult<BuyoutResult> {
  try {
    const { buyerTeam, targetPlayer, sellerTeam, newContract } = params;
    const buyoutCost = targetPlayer.contract.buyout;

    if (buyerTeam.budget < buyoutCost) {
      return makeFailure<BuyoutResult>(
        `Insufficient budget to buy out ${targetPlayer.alias}. Required: $${buyoutCost.toLocaleString()}, Available: $${buyerTeam.budget.toLocaleString()}`,
        "INSUFFICIENT_BUDGET",
      );
    }

    let updatedSellerTeam: Team | undefined = undefined;

    if (sellerTeam) {
      const foundInSeller = findPlayerInTeam(sellerTeam, targetPlayer.id);
      if (!foundInSeller) {
        return makeFailure<BuyoutResult>(
          `Player ${targetPlayer.alias} not found in seller team (${sellerTeam.name}).`,
          "PLAYER_NOT_IN_SELLER_TEAM",
        );
      }

      const sellerAfterRemoval = removePlayerFromTeam(sellerTeam, targetPlayer.id);
      updatedSellerTeam = adjustTeamBudget(sellerAfterRemoval, buyoutCost);
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

    const updatedBuyerTeam = addPlayerToBench(
      adjustTeamBudget(cloneTeam(buyerTeam), -buyoutCost),
      updatedPlayer,
    );

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
  } catch (e) {
    return makeFailure<BuyoutResult>(
      `Unexpected error: ${e instanceof Error ? e.message : String(e)}`,
      "UNEXPECTED_ERROR",
    );
  }
}

/**
 * 2. Loan Player
 * Borrows a player at a low upfront cost while deducting from the regular budget.
 * Sets isLoaned to true and places the player on the borrower's bench.
 */
export function loanPlayer(params: LoanParams): EngineResult<LoanResult> {
  try {
    const { borrowerTeam, targetPlayer, lendingTeam, loanFee, loanDuration } =
      params;

    if (targetPlayer.contract.isLoaned) {
      return makeFailure<LoanResult>(
        `Player ${targetPlayer.alias} is currently on loan to another team.`,
        "ALREADY_LOANED",
      );
    }

    const fee = loanFee !== undefined ? loanFee : calculateLoanFee(targetPlayer);
    const duration =
      loanDuration !== undefined
        ? loanDuration
        : Math.max(1, targetPlayer.contract.duration);

    if (borrowerTeam.budget < fee) {
      return makeFailure<LoanResult>(
        `Insufficient budget for ${targetPlayer.alias}'s loan fee. Required: $${fee.toLocaleString()}, Available: $${borrowerTeam.budget.toLocaleString()}`,
        "INSUFFICIENT_BUDGET",
      );
    }

    let updatedLendingTeam: Team | undefined = undefined;

    if (lendingTeam) {
      const foundInLending = findPlayerInTeam(lendingTeam, targetPlayer.id);
      if (!foundInLending) {
        return makeFailure<LoanResult>(
          `Player ${targetPlayer.alias} not found in lending team (${lendingTeam.name}).`,
          "PLAYER_NOT_IN_LENDING_TEAM",
        );
      }

      const lendingAfterRemoval = removePlayerFromTeam(lendingTeam, targetPlayer.id);
      updatedLendingTeam = adjustTeamBudget(lendingAfterRemoval, fee);
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

    const updatedBorrowerTeam = addPlayerToBench(
      adjustTeamBudget(cloneTeam(borrowerTeam), -fee),
      updatedPlayer,
    );

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
  } catch (e) {
    return makeFailure<LoanResult>(
      `Unexpected error: ${e instanceof Error ? e.message : String(e)}`,
      "UNEXPECTED_ERROR",
    );
  }
}

/**
 * 3. Terminate Contract
 * Unilaterally terminates a player's contract. Requires the team to pay a penalty
 * (severance) and reduces the morale of remaining roster players by the specified percentage.
 */
export function terminateContract(
  params: TerminateParams,
): EngineResult<TerminationResult> {
  try {
    const {
      team,
      playerId,
      penaltyRate = DEFAULT_TERMINATION_PENALTY_RATE,
      moralePenaltyPercent = DEFAULT_TERMINATION_MORALE_PENALTY_PERCENT,
    } = params;

    const found = findPlayerInTeam(team, playerId);
    if (!found) {
      return makeFailure<TerminationResult>(
        `Player with ID "${playerId}" not found in team ${team.name}.`,
        "PLAYER_NOT_FOUND",
      );
    }

    const targetPlayer = found.player;
    const penalty = calculateTerminationPenalty(targetPlayer, penaltyRate);

    if (team.budget < penalty) {
      return makeFailure<TerminationResult>(
        `Team budget is insufficient to pay the contract termination penalty of $${penalty.toLocaleString()}. Available: $${team.budget.toLocaleString()}`,
        "INSUFFICIENT_BUDGET",
      );
    }

    const teamAfterRemoval = removePlayerFromTeam(team, playerId);

    // Apply morale penalty to remaining players in roster and bench
    const updatedTeam: Team = {
      ...adjustTeamBudget(teamAfterRemoval, -penalty),
      roster: teamAfterRemoval.roster.map((p) => applyMoralePenalty(p, moralePenaltyPercent)),
      bench: teamAfterRemoval.bench.map((p) => applyMoralePenalty(p, moralePenaltyPercent)),
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
  } catch (e) {
    return makeFailure<TerminationResult>(
      `Unexpected error: ${e instanceof Error ? e.message : String(e)}`,
      "UNEXPECTED_ERROR",
    );
  }
}

/**
 * 4. Roster Management: Swap Starter & Bench Player
 */
export function swapRosterAndBench(
  team: Team,
  rosterPlayerId: string,
  benchPlayerId: string,
): EngineResult<RosterActionResult> {
  try {
    const rosterIndex = team.roster.findIndex((p) => p.id === rosterPlayerId);
    const benchIndex = team.bench.findIndex((p) => p.id === benchPlayerId);

    if (rosterIndex === -1) {
      return makeFailure<RosterActionResult>(
        `Starter player with ID "${rosterPlayerId}" not found in the main roster.`,
        "ROSTER_PLAYER_NOT_FOUND",
      );
    }

    if (benchIndex === -1) {
      return makeFailure<RosterActionResult>(
        `Bench player with ID "${benchPlayerId}" not found in the bench.`,
        "BENCH_PLAYER_NOT_FOUND",
      );
    }

    const rosterPlayer = clonePlayer(team.roster[rosterIndex]);
    const benchPlayer = clonePlayer(team.bench[benchIndex]);

    const updatedTeam = updatePlayerInTeam(
      updatePlayerInTeam(cloneTeam(team), "roster", rosterIndex, benchPlayer),
      "bench",
      benchIndex,
      rosterPlayer,
    );

    return {
      success: true,
      message: `Successfully swapped ${benchPlayer.alias} (promoted to Roster) with ${rosterPlayer.alias} (moved to Bench).`,
      data: {
        team: updatedTeam,
        message: `Swapped ${benchPlayer.alias} and ${rosterPlayer.alias}`,
      },
    };
  } catch (e) {
    return makeFailure<RosterActionResult>(
      `Unexpected error: ${e instanceof Error ? e.message : String(e)}`,
      "UNEXPECTED_ERROR",
    );
  }
}

/**
 * 5. Move Bench Player to Roster
 * Moves a player from bench to the starting roster.
 * If roster is not full (less than DEFAULT_ROSTER_LIMIT), adds directly.
 * If roster is full, requires a replacement player ID to swap with.
 */
export function movePlayerToRoster(
  team: Team,
  benchPlayerId: string,
  replacePlayerId?: string,
): EngineResult<RosterActionResult> {
  try {
    const benchIndex = team.bench.findIndex((p) => p.id === benchPlayerId);

    if (benchIndex === -1) {
      return makeFailure<RosterActionResult>(
        `Bench player with ID "${benchPlayerId}" not found in the bench.`,
        "BENCH_PLAYER_NOT_FOUND",
      );
    }

    const benchPlayer = clonePlayer(team.bench[benchIndex]);

    if (team.roster.length < DEFAULT_ROSTER_LIMIT) {
      const newRoster = [...team.roster.map(clonePlayer), benchPlayer];
      const newBench = team.bench
        .filter((p) => p.id !== benchPlayerId)
        .map(clonePlayer);

      const updatedTeam: Team = {
        ...team,
        roster: newRoster,
        bench: newBench,
      };

      return {
        success: true,
        message: `Successfully promoted ${benchPlayer.alias} to the starting roster.`,
        data: {
          team: updatedTeam,
          message: `Promoted ${benchPlayer.alias} to Roster`,
        },
      };
    }

    if (!replacePlayerId) {
      return makeFailure<RosterActionResult>(
        `Roster is full (${DEFAULT_ROSTER_LIMIT} players). Specify a player to replace.`,
        "ROSTER_FULL",
      );
    }

    const replaceIndex = team.roster.findIndex((p) => p.id === replacePlayerId);
    if (replaceIndex === -1) {
      return makeFailure<RosterActionResult>(
        `Replacement player with ID "${replacePlayerId}" not found in the roster.`,
        "ROSTER_PLAYER_NOT_FOUND",
      );
    }

    const replacedPlayer = clonePlayer(team.roster[replaceIndex]);

    const updatedTeam = updatePlayerInTeam(
      updatePlayerInTeam(cloneTeam(team), "roster", replaceIndex, benchPlayer),
      "bench",
      benchIndex,
      replacedPlayer,
    );

    return {
      success: true,
      message: `Successfully swapped ${replacedPlayer.alias} (moved to Bench) with ${benchPlayer.alias} (promoted to Roster).`,
      data: {
        team: updatedTeam,
        message: `Swapped ${replacedPlayer.alias} and ${benchPlayer.alias}`,
      },
    };
  } catch (e) {
    return makeFailure<RosterActionResult>(
      `Unexpected error: ${e instanceof Error ? e.message : String(e)}`,
      "UNEXPECTED_ERROR",
    );
  }
}

/**
 * 6. Move Roster Player to Bench
 * Moves a player from the starting roster to the bench.
 */
export function movePlayerToBench(
  team: Team,
  rosterPlayerId: string,
): EngineResult<RosterActionResult> {
  try {
    const rosterIndex = team.roster.findIndex((p) => p.id === rosterPlayerId);

    if (rosterIndex === -1) {
      return makeFailure<RosterActionResult>(
        `Starter player with ID "${rosterPlayerId}" not found in the main roster.`,
        "ROSTER_PLAYER_NOT_FOUND",
      );
    }

    const rosterPlayer = clonePlayer(team.roster[rosterIndex]);

    const newRoster = team.roster
      .filter((p) => p.id !== rosterPlayerId)
      .map(clonePlayer);
    const newBench = [...team.bench.map(clonePlayer), rosterPlayer];

    const updatedTeam: Team = {
      ...team,
      roster: newRoster,
      bench: newBench,
    };

    return {
      success: true,
      message: `Successfully moved ${rosterPlayer.alias} from Roster to Bench.`,
      data: {
        team: updatedTeam,
        message: `Moved ${rosterPlayer.alias} to Bench`,
      },
    };
  } catch (e) {
    return makeFailure<RosterActionResult>(
      `Unexpected error: ${e instanceof Error ? e.message : String(e)}`,
      "UNEXPECTED_ERROR",
    );
  }
}

/**
 * 7. Set Player Transfer Listing
 * Lists or delists a player on the transfer market with an optional custom buyout.
 */
export function setPlayerTransferListing(
  team: Team,
  playerId: string,
  isListed: boolean,
  customBuyout?: number,
): EngineResult<TransferListingResult> {
  try {
    const found = findPlayerInTeam(team, playerId);
    if (!found) {
      return makeFailure<TransferListingResult>(
        `Player with ID "${playerId}" not found in team ${team.name}.`,
        "PLAYER_NOT_FOUND",
      );
    }

    const { location, index } = found;
    const targetPlayer = found.player;

    const updatedPlayer: Player = {
      ...clonePlayer(targetPlayer),
      isTransferListed: isListed,
      contract: {
        ...targetPlayer.contract,
        ...(isListed && customBuyout !== undefined
          ? { buyout: customBuyout }
          : {}),
      },
    };

    const updatedTeam = updatePlayerInTeam(
      cloneTeam(team),
      location,
      index,
      updatedPlayer,
    );

    const action = isListed ? "listed on" : "delisted from";
    return {
      success: true,
      message: `Successfully ${action} transfer market: ${targetPlayer.name} (${targetPlayer.alias}).`,
      data: {
        team: updatedTeam,
        player: updatedPlayer,
        message: `${targetPlayer.alias} ${action} transfer market`,
      },
    };
  } catch (e) {
    return makeFailure<TransferListingResult>(
      `Unexpected error: ${e instanceof Error ? e.message : String(e)}`,
      "UNEXPECTED_ERROR",
    );
  }
}