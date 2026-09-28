import { describe, it, expect, beforeEach } from "vitest";
import {
  buyoutPlayer,
  loanPlayer,
  terminateContract,
  swapRosterAndBench,
  movePlayerToRoster,
  movePlayerToBench,
  setPlayerTransferListing,
} from "../marketEngine";
import {
  calculateLoanFee,
  calculateTerminationPenalty,
  clonePlayer,
  cloneTeam,
  findPlayerInTeam,
  removePlayerFromTeam,
  DEFAULT_ROSTER_LIMIT,
  DEFAULT_LOAN_FEE_RATIO,
  DEFAULT_TERMINATION_PENALTY_RATE,
  MIN_MORALE,
} from "../marketHelpers";
import { Player, Team } from "../../types";

function createMockPlayer(
  id: string,
  alias: string,
  overrides: Partial<Player> = {},
): Player {
  return {
    id,
    name: `Player ${alias}`,
    alias,
    role: "Duelist",
    stats: {
      aim: 85,
      utility: 80,
      morale: 80,
      discipline: 75,
    },
    contract: {
      salary: 5000,
      buyout: 50000,
      isLoaned: false,
      duration: 12,
    },
    ...overrides,
  };
}

function createMockTeam(id: string, name: string, budget: number): Team {
  return {
    id,
    name,
    budget,
    roster: [
      createMockPlayer(`${id}-p1`, `${name}-1`),
      createMockPlayer(`${id}-p2`, `${name}-2`),
      createMockPlayer(`${id}-p3`, `${name}-3`),
      createMockPlayer(`${id}-p4`, `${name}-4`),
      createMockPlayer(`${id}-p5`, `${name}-5`),
    ],
    bench: [createMockPlayer(`${id}-b1`, `${name}-Sub1`)],
  };
}

describe("marketEngine", () => {
  let buyerTeam: Team;
  let sellerTeam: Team;

  beforeEach(() => {
    buyerTeam = createMockTeam("team-1", "Sentinels", 200000);
    sellerTeam = createMockTeam("team-2", "Paper Rex", 150000);
  });

  describe("Helper Functions", () => {
    it("should deep clone a player", () => {
      const player = createMockPlayer("p-1", "TenZ");
      const cloned = clonePlayer(player);

      expect(cloned).toEqual(player);
      expect(cloned).not.toBe(player);
      expect(cloned.stats).not.toBe(player.stats);
      expect(cloned.contract).not.toBe(player.contract);

      cloned.stats.aim = 99;
      expect(player.stats.aim).toBe(85);
    });

    it("should deep clone a team", () => {
      const cloned = cloneTeam(buyerTeam);

      expect(cloned).toEqual(buyerTeam);
      expect(cloned).not.toBe(buyerTeam);
      expect(cloned.roster).not.toBe(buyerTeam.roster);
      expect(cloned.bench).not.toBe(buyerTeam.bench);
      expect(cloned.roster[0]).not.toBe(buyerTeam.roster[0]);

      cloned.roster[0].stats.morale = 20;
      expect(buyerTeam.roster[0].stats.morale).toBe(80);
    });

    it("should find a player in roster or bench correctly", () => {
      const rosterFound = findPlayerInTeam(buyerTeam, "team-1-p1");
      expect(rosterFound).not.toBeNull();
      expect(rosterFound?.location).toBe("roster");
      expect(rosterFound?.player.alias).toBe("Sentinels-1");

      const benchFound = findPlayerInTeam(buyerTeam, "team-1-b1");
      expect(benchFound).not.toBeNull();
      expect(benchFound?.location).toBe("bench");
      expect(benchFound?.player.alias).toBe("Sentinels-Sub1");

      const notFound = findPlayerInTeam(buyerTeam, "non-existent");
      expect(notFound).toBeNull();
    });

    it("should remove player from team immutably", () => {
      const updated = removePlayerFromTeam(buyerTeam, "team-1-p1");
      expect(updated.roster.length).toBe(4);
      expect(updated.roster.some((p) => p.id === "team-1-p1")).toBe(false);
      expect(buyerTeam.roster.length).toBe(5);
    });

    it("should calculate loan fee accurately", () => {
      const player = createMockPlayer("p-1", "Aspas", {
        contract: {
          salary: 10000,
          buyout: 80000,
          isLoaned: false,
          duration: 10,
        },
      });

      const defaultFee = calculateLoanFee(player);
      expect(defaultFee).toBe(80000 * DEFAULT_LOAN_FEE_RATIO); // 16000

      const customFee = calculateLoanFee(player, 0.3);
      expect(customFee).toBe(24000);
    });

    it("should calculate termination penalty accurately", () => {
      const player = createMockPlayer("p-1", "Derke", {
        contract: { salary: 6000, buyout: 60000, isLoaned: false, duration: 5 },
      });

      const defaultPenalty = calculateTerminationPenalty(player);
      expect(defaultPenalty).toBe(6000 * 5 * DEFAULT_TERMINATION_PENALTY_RATE); // 30000

      const customPenalty = calculateTerminationPenalty(player, 0.5);
      expect(customPenalty).toBe(15000);
    });
  });

  describe("buyoutPlayer", () => {
    it("should successfully buyout a player from another team", () => {
      const targetPlayer = sellerTeam.roster[0];
      const result = buyoutPlayer({
        buyerTeam,
        sellerTeam,
        targetPlayer,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const {
        buyerTeam: updatedBuyer,
        sellerTeam: updatedSeller,
        player,
        feePaid,
      } = result.data!;

      expect(feePaid).toBe(50000);
      expect(updatedBuyer.budget).toBe(150000);
      expect(updatedSeller?.budget).toBe(200000);
      expect(updatedBuyer.bench.some((p) => p.id === targetPlayer.id)).toBe(
        true,
      );
      expect(updatedSeller?.roster.some((p) => p.id === targetPlayer.id)).toBe(
        false,
      );
      expect(player.isTransferListed).toBe(false);
      expect(player.contract.isLoaned).toBe(false);

      // Verify original objects are not mutated
      expect(buyerTeam.budget).toBe(200000);
      expect(sellerTeam.budget).toBe(150000);
      expect(sellerTeam.roster.some((p) => p.id === targetPlayer.id)).toBe(
        true,
      );
    });

    it("should successfully buyout a free agent (without seller team)", () => {
      const freeAgent = createMockPlayer("fa-1", "FreeAgent", {
        contract: {
          salary: 4000,
          buyout: 30000,
          isLoaned: false,
          duration: 10,
        },
      });

      const result = buyoutPlayer({
        buyerTeam,
        targetPlayer: freeAgent,
        newContract: { salary: 4500, duration: 24 },
      });

      expect(result.success).toBe(true);
      expect(result.data?.buyerTeam.budget).toBe(170000);
      expect(result.data?.sellerTeam).toBeUndefined();
      expect(result.data?.player.contract.salary).toBe(4500);
      expect(result.data?.player.contract.duration).toBe(24);
      expect(result.data?.buyerTeam.bench.some((p) => p.id === "fa-1")).toBe(
        true,
      );
    });

    it("should fail when buyer has insufficient budget", () => {
      buyerTeam.budget = 20000;
      const targetPlayer = sellerTeam.roster[0];

      const result = buyoutPlayer({
        buyerTeam,
        sellerTeam,
        targetPlayer,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("INSUFFICIENT_BUDGET");
      expect(result.message).toContain("Insufficient budget");
    });

    it("should fail when player does not exist in seller team", () => {
      const outsider = createMockPlayer("outsider-1", "Outsider");
      const result = buyoutPlayer({
        buyerTeam,
        sellerTeam,
        targetPlayer: outsider,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("PLAYER_NOT_IN_SELLER_TEAM");
    });
  });

  describe("loanPlayer", () => {
    it("should successfully loan a player from another team", () => {
      const targetPlayer = sellerTeam.bench[0];
      const result = loanPlayer({
        borrowerTeam: buyerTeam,
        lendingTeam: sellerTeam,
        targetPlayer,
        loanDuration: 6,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const {
        borrowerTeam: updatedBorrower,
        lendingTeam: updatedLender,
        player,
        feePaid,
        duration,
      } = result.data!;

      expect(feePaid).toBe(10000); // 20% of 50000
      expect(duration).toBe(6);
      expect(updatedBorrower.budget).toBe(190000);
      expect(updatedLender?.budget).toBe(160000);
      expect(player.contract.isLoaned).toBe(true);
      expect(player.contract.duration).toBe(6);
      expect(updatedBorrower.bench.some((p) => p.id === targetPlayer.id)).toBe(
        true,
      );
      expect(updatedLender?.bench.some((p) => p.id === targetPlayer.id)).toBe(
        false,
      );
    });

    it("should fail if player is already on loan", () => {
      const loanedPlayer = createMockPlayer("loan-1", "LoanedPlayer", {
        contract: { salary: 5000, buyout: 50000, isLoaned: true, duration: 4 },
      });

      const result = loanPlayer({
        borrowerTeam: buyerTeam,
        targetPlayer: loanedPlayer,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("ALREADY_LOANED");
    });

    it("should fail if borrower has insufficient budget for loan fee", () => {
      buyerTeam.budget = 5000;
      const targetPlayer = sellerTeam.bench[0];

      const result = loanPlayer({
        borrowerTeam: buyerTeam,
        lendingTeam: sellerTeam,
        targetPlayer,
        loanFee: 15000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("INSUFFICIENT_BUDGET");
    });

    it("should fail if player is not found in lending team", () => {
      const outsider = createMockPlayer("outsider-1", "Outsider");

      const result = loanPlayer({
        borrowerTeam: buyerTeam,
        lendingTeam: sellerTeam,
        targetPlayer: outsider,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("PLAYER_NOT_IN_LENDING_TEAM");
    });
  });

  describe("terminateContract", () => {
    it("should successfully terminate contract and reduce remaining players morale", () => {
      const playerToTerminate = buyerTeam.roster[0]; // salary: 5000, duration: 12 -> penalty: 60000
      const initialRosterMorale = buyerTeam.roster[1].stats.morale; // 80

      const result = terminateContract({
        team: buyerTeam,
        playerId: playerToTerminate.id,
        moralePenaltyPercent: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const {
        team: updatedTeam,
        penaltyPaid,
        moralePenaltyApplied,
      } = result.data!;

      expect(penaltyPaid).toBe(60000);
      expect(moralePenaltyApplied).toBe(10);
      expect(updatedTeam.budget).toBe(140000);
      expect(
        updatedTeam.roster.some((p) => p.id === playerToTerminate.id),
      ).toBe(false);

      // Check morale of remaining roster & bench players (80 * 0.9 = 72)
      const expectedMorale = Math.round(initialRosterMorale * 0.9);
      expect(updatedTeam.roster[0].stats.morale).toBe(expectedMorale);
      expect(updatedTeam.bench[0].stats.morale).toBe(expectedMorale);
    });

    it("should terminate a player from bench as well", () => {
      const benchPlayer = buyerTeam.bench[0];

      const result = terminateContract({
        team: buyerTeam,
        playerId: benchPlayer.id,
      });

      expect(result.success).toBe(true);
      expect(result.data?.team.bench.some((p) => p.id === benchPlayer.id)).toBe(
        false,
      );
    });

    it("should clamp morale drop so it never falls below MIN_MORALE", () => {
      buyerTeam.roster[1].stats.morale = 2;

      const result = terminateContract({
        team: buyerTeam,
        playerId: buyerTeam.roster[0].id,
        moralePenaltyPercent: 90, // Huge drop
      });

      expect(result.success).toBe(true);
      expect(result.data?.team.roster[0].stats.morale).toBeGreaterThanOrEqual(
        MIN_MORALE,
      );
    });

    it("should fail if player is not found in team", () => {
      const result = terminateContract({
        team: buyerTeam,
        playerId: "non-existent-player",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("PLAYER_NOT_FOUND");
    });

    it("should fail if team cannot afford termination penalty", () => {
      buyerTeam.budget = 10000;
      const targetPlayer = buyerTeam.roster[0]; // Penalty is 60,000

      const result = terminateContract({
        team: buyerTeam,
        playerId: targetPlayer.id,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("INSUFFICIENT_BUDGET");
    });
  });

  describe("Roster Management", () => {
    it("should swap starter and bench player", () => {
      const starterId = buyerTeam.roster[0].id;
      const benchId = buyerTeam.bench[0].id;

      const result = swapRosterAndBench(buyerTeam, starterId, benchId);

      expect(result.success).toBe(true);
      expect(result.data?.team.roster[0].id).toBe(benchId);
      expect(result.data?.team.bench[0].id).toBe(starterId);
    });

    it("should fail swapping if starter or bench ID is invalid", () => {
      const starterId = buyerTeam.roster[0].id;
      const benchId = buyerTeam.bench[0].id;

      const invalidStarter = swapRosterAndBench(buyerTeam, "invalid", benchId);
      expect(invalidStarter.success).toBe(false);
      expect(invalidStarter.error).toBe("ROSTER_PLAYER_NOT_FOUND");

      const invalidBench = swapRosterAndBench(buyerTeam, starterId, "invalid");
      expect(invalidBench.success).toBe(false);
      expect(invalidBench.error).toBe("BENCH_PLAYER_NOT_FOUND");
    });

    it("should move bench player to roster when roster is not full", () => {
      // Create team with 4 roster players
      const shortTeam: Team = {
        ...cloneTeam(buyerTeam),
        roster: buyerTeam.roster.slice(0, 4),
      };

      const benchId = shortTeam.bench[0].id;
      const result = movePlayerToRoster(shortTeam, benchId);

      expect(result.success).toBe(true);
      expect(result.data?.team.roster.length).toBe(DEFAULT_ROSTER_LIMIT);
      expect(result.data?.team.roster.some((p) => p.id === benchId)).toBe(true);
      expect(result.data?.team.bench.some((p) => p.id === benchId)).toBe(false);
    });

    it("should swap when moving bench player to full roster with replacement specified", () => {
      const benchId = buyerTeam.bench[0].id;
      const replaceId = buyerTeam.roster[2].id;

      const result = movePlayerToRoster(buyerTeam, benchId, replaceId);

      expect(result.success).toBe(true);
      expect(result.data?.team.roster[2].id).toBe(benchId);
      expect(result.data?.team.bench.some((p) => p.id === replaceId)).toBe(
        true,
      );
    });

    it("should fail moving bench player to full roster when no replacement is specified", () => {
      const benchId = buyerTeam.bench[0].id;
      const result = movePlayerToRoster(buyerTeam, benchId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("ROSTER_FULL");
    });

    it("should move roster player to bench", () => {
      const rosterId = buyerTeam.roster[0].id;
      const result = movePlayerToBench(buyerTeam, rosterId);

      expect(result.success).toBe(true);
      expect(result.data?.team.roster.length).toBe(4);
      expect(result.data?.team.bench.length).toBe(2);
      expect(result.data?.team.bench.some((p) => p.id === rosterId)).toBe(true);
      expect(result.data?.team.roster.some((p) => p.id === rosterId)).toBe(
        false,
      );
    });

    it("should fail moving non-existent player to bench", () => {
      const result = movePlayerToBench(buyerTeam, "invalid-id");
      expect(result.success).toBe(false);
      expect(result.error).toBe("ROSTER_PLAYER_NOT_FOUND");
    });
  });

  describe("Transfer Market Listing", () => {
    it("should list a player on transfer market with custom buyout", () => {
      const playerId = buyerTeam.roster[0].id;
      const result = setPlayerTransferListing(buyerTeam, playerId, true, 95000);

      expect(result.success).toBe(true);
      expect(result.data?.player.isTransferListed).toBe(true);
      expect(result.data?.player.contract.buyout).toBe(95000);

      const inTeam = findPlayerInTeam(result.data!.team, playerId);
      expect(inTeam?.player.isTransferListed).toBe(true);
      expect(inTeam?.player.contract.buyout).toBe(95000);
    });

    it("should delist a player from transfer market", () => {
      const playerId = buyerTeam.roster[0].id;
      const listed = setPlayerTransferListing(buyerTeam, playerId, true, 80000);
      const delisted = setPlayerTransferListing(
        listed.data!.team,
        playerId,
        false,
      );

      expect(delisted.success).toBe(true);
      expect(delisted.data?.player.isTransferListed).toBe(false);

      const inTeam = findPlayerInTeam(delisted.data!.team, playerId);
      expect(inTeam?.player.isTransferListed).toBe(false);
    });

    it("should fail listing a non-existent player", () => {
      const result = setPlayerTransferListing(buyerTeam, "non-existent", true);
      expect(result.success).toBe(false);
      expect(result.error).toBe("PLAYER_NOT_FOUND");
    });
  });
});
