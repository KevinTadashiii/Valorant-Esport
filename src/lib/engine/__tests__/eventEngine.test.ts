import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { triggerEvents, TriggerEventParams, TriggerEventResult } from "../eventEngine";
import { Player, Team, MatchState } from "../../types";

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
    isSuspended: false,
    suspensionMatches: 0,
    isTransferListed: false,
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
    winRate: 0.5,
  };
}

function createMockMatchState(): MatchState {
  return {
    teamA: createMockTeam("teamA", "Team A", 200000),
    teamB: createMockTeam("teamB", "Team B", 150000),
    scoreA: 6,
    scoreB: 4,
    currentRound: 10,
    economyA: "Full",
    economyB: "Force",
    matchLog: [],
    isFinished: false,
    winner: undefined,
  };
}

describe("eventEngine", () => {
  let testTeam: Team;
  let matchState: MatchState;

  beforeEach(() => {
    testTeam = createMockTeam("test-team", "Test Team", 200000);
    matchState = createMockMatchState();

    // Mock Math.random for consistent testing
    vi.spyOn(Math, "random").mockReturnValue(0.2); // Less than 0.3 to trigger events
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("triggerEvents", () => {
    it("should trigger scandal event when discipline < 50", () => {
      // Create a player with low discipline
      const lowDisciplinePlayer = createMockPlayer("low-disc", "LowDisc", {
        stats: {
          aim: 85,
          utility: 80,
          morale: 80,
          discipline: 40, // Below 50 threshold
        },
      });

      // Replace one player in roster with low discipline player
      const updatedRoster = [
        lowDisciplinePlayer,
        ...testTeam.roster.slice(1)
      ];
      testTeam = { ...testTeam, roster: updatedRoster };

      const params: TriggerEventParams = { team: testTeam, matchState };
      const result: TriggerEventResult = triggerEvents(params);

      // Check that scandal event was triggered
      expect(result.events).toContain(`Scandal: Player low-disc misconduct`);

      // Check that morale was reduced
      const affectedPlayer = result.updatedTeam.roster.find(p => p.id === "low-disc");
      expect(affectedPlayer).toBeDefined();
      expect(affectedPlayer?.stats.morale).toBeLessThan(80);
      expect(affectedPlayer?.stats.morale).toBeGreaterThanOrEqual(1);

      // Check that suspension was applied
      expect(affectedPlayer?.isSuspended).toBe(true);
      expect(affectedPlayer?.suspensionMatches).toBe(3);

      // Check that match log was updated
      expect(
        matchState.matchLog.some(log =>
          log.includes("[Scandal] Player low-disc (LowDisc) disciplined")
        )
      ).toBe(true);
    });

    it("should not trigger scandal event when discipline >= 50", () => {
      // Create a player with high discipline
      const highDisciplinePlayer = createMockPlayer("high-disc", "HighDisc", {
        stats: {
          aim: 85,
          utility: 80,
          morale: 80,
          discipline: 60, // Above 50 threshold
        },
      });

      // Replace one player in roster with high discipline player
      const updatedRoster = [
        highDisciplinePlayer,
        ...testTeam.roster.slice(1)
      ];
      testTeam = { ...testTeam, roster: updatedRoster };

      const params: TriggerEventParams = { team: testTeam, matchState };
      const result: TriggerEventResult = triggerEvents(params);

      // Check that no scandal event was triggered
      expect(result.events).not.toContain(expect.stringContaining("Scandal"));

      // Check that morale was not reduced
      const affectedPlayer = result.updatedTeam.roster.find(p => p.id === "high-disc");
      expect(affectedPlayer).toBeDefined();
      expect(affectedPlayer?.stats.morale).toBe(80);

      // Check that suspension was not applied
      expect(affectedPlayer?.isSuspended).toBe(false);
      expect(affectedPlayer?.suspensionMatches).toBe(0);
    });

    it("should not trigger scandal event when random >= 0.3", () => {
      // Mock Math.random to return value >= 0.3
      vi.spyOn(Math, "random").mockReturnValue(0.4);

      // Create a player with low discipline
      const lowDisciplinePlayer = createMockPlayer("low-disc", "LowDisc", {
        stats: {
          aim: 85,
          utility: 80,
          morale: 80,
          discipline: 40, // Below 50 threshold
        },
      });

      // Replace one player in roster with low discipline player
      const updatedRoster = [
        lowDisciplinePlayer,
        ...testTeam.roster.slice(1)
      ];
      testTeam = { ...testTeam, roster: updatedRoster };

      const params: TriggerEventParams = { team: testTeam, matchState };
      const result: TriggerEventResult = triggerEvents(params);

      // Check that no scandal event was triggered
      expect(result.events).not.toContain(expect.stringContaining("Scandal"));
    });

    it("should trigger transfer request event when win rate < 40%", () => {
      // Modify match state to have low win rate
      // Score A: 0, Score B: 6, Round: 10 -> Win rate: (0+6)/(10*2) = 6/20 = 0.3 = 30% < 40%
      matchState.scoreA = 0;
      matchState.scoreB = 6;

      // Create a player with high stats
      const highStatPlayer = createMockPlayer("high-stat", "HighStat", {
        stats: {
          aim: 85,
          utility: 75,
          morale: 80,
          discipline: 75,
        }, // Aim > 80
      });

      // Replace one player in roster with high stat player
      const updatedRoster = [
        highStatPlayer,
        ...testTeam.roster.slice(1)
      ];
      testTeam = { ...testTeam, roster: updatedRoster };

      const params: TriggerEventParams = { team: testTeam, matchState };
      const result: TriggerEventResult = triggerEvents(params);

      // Check that transfer request event was triggered
      expect(result.events).toContain(`Transfer Request: Player high-stat`);

      // Check that player was marked for transfer listing
      const affectedPlayer = result.updatedTeam.roster.find(p => p.id === "high-stat");
      expect(affectedPlayer).toBeDefined();
      expect(affectedPlayer?.isTransferListed).toBe(true);

      // Check that match log was updated
      expect(
        matchState.matchLog.some(log =>
          log.includes("[Transfer] Player high-stat (HighStat) requested transfer")
        )
      ).toBe(true);
    });

    it("should not trigger transfer request event when win rate >= 40%", () => {
      // Modify match state to have high win rate
      matchState.scoreA = 8;
      matchState.scoreB = 2;

      // Create a player with high stats
      const highStatPlayer = createMockPlayer("high-stat", "HighStat", {
        stats: {
          aim: 85,
          utility: 75,
          morale: 80,
          discipline: 75,
        }, // Aim > 80
      });

      // Replace one player in roster with high stat player
      const updatedRoster = [
        highStatPlayer,
        ...testTeam.roster.slice(1)
      ];
      testTeam = { ...testTeam, roster: updatedRoster };

      const params: TriggerEventParams = { team: testTeam, matchState };
      const result: TriggerEventResult = triggerEvents(params);

      // Check that no transfer request event was triggered
      expect(result.events).not.toContain(expect.stringContaining("Transfer Request"));

      // Check that player was not marked for transfer listing
      const affectedPlayer = result.updatedTeam.roster.find(p => p.id === "high-stat");
      expect(affectedPlayer).toBeDefined();
      expect(affectedPlayer?.isTransferListed).toBe(false);
    });

    it("should not trigger transfer request event when no high stat players", () => {
      // Modify match state to have low win rate
      matchState.scoreA = 0;
      matchState.scoreB = 6;

      // Create a player with low stats
      const lowStatPlayer = createMockPlayer("low-stat", "LowStat", {
        stats: {
          aim: 70,
          utility: 65,
          morale: 80,
          discipline: 75,
        }, // Both < 80
      });

      // Replace one player in roster with low stat player
      const updatedRoster = [
        lowStatPlayer,
        ...testTeam.roster.slice(1)
      ];
      testTeam = { ...testTeam, roster: updatedRoster };

      const params: TriggerEventParams = { team: testTeam, matchState };
      const result: TriggerEventResult = triggerEvents(params);

      // Check that no transfer request event was triggered
      expect(result.events).not.toContain(expect.stringContaining("Transfer Request"));

      // Check that player was not marked for transfer listing
      const affectedPlayer = result.updatedTeam.roster.find(p => p.id === "low-stat");
      expect(affectedPlayer).toBeDefined();
      expect(affectedPlayer?.isTransferListed).toBe(false);
    });

    it("should handle matchState being undefined", () => {
      const params: TriggerEventParams = { team: testTeam, matchState: undefined };
      const result: TriggerEventResult = triggerEvents(params);

      // Should still process scandal events
      expect(result.updatedTeam).toBeDefined();
      expect(result.events).toBeInstanceOf(Array);

      // Should not try to access matchState properties
      // (This is tested implicitly by not throwing an error)
    });

    it("should return deep cloned team (not mutate original)", () => {
      const originalTeam = { ...testTeam };
      const params: TriggerEventParams = { team: testTeam, matchState };
      const result: TriggerEventResult = triggerEvents(params);

      // Check that original team is not mutated
      expect(testTeam).toEqual(originalTeam);

      // Check that returned team is a different object
      expect(result.updatedTeam).not.toBe(testTeam);

      // Check that returned team has same structure
      expect(result.updatedTeam).toHaveProperty("roster");
      expect(result.updatedTeam.roster).toHaveLength(5);
    });
  });
});