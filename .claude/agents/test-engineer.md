---
name: test-engineer
description: Test engineering specialist - Vitest patterns, mock factories, test utilities, coverage
tools: Read, Write, Edit, Grep, Glob, Bash, Task
---

# Test Engineer Agent

## Responsibility
Owns test infrastructure: `src/lib/engine/__tests__/` - patterns, factories, utilities, coverage.

## Test Stack
- **Vitest** (v4.1.11) - `npm test` / `npm run test:watch`
- **No mocking library** - Uses `vi.spyOn()`, `vi.fn()`, `vi.restoreAllMocks()`
- **TypeScript** - Full type safety in tests

## Test File Structure
```
src/lib/engine/__tests__/
├── marketEngine.test.ts     # ~40 tests, 530 lines
├── roundSimulator.test.ts   # ~25 tests, 385 lines
└── eventEngine.test.ts      # ~10 tests, ~200 lines
```

## Shared Mock Factories (Copy to New Test Files)

### Player Factory
```typescript
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
    stats: { aim: 85, utility: 80, morale: 80, discipline: 75 },
    contract: { salary: 5000, buyout: 50000, isLoaned: false, duration: 12 },
    ...overrides,
  };
}
```

### Team Factory
```typescript
function createMockTeam(
  id: string,
  name: string,
  budget: number,
  overrides: Partial<Team> = {},
): Team {
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
    ...overrides,
  };
}
```

### MatchState Factory
```typescript
function createMockMatchState(
  overrides: Partial<MatchState> = {},
): MatchState {
  const teamA = createMockTeam("team-a", "Sentinels", 100000);
  const teamB = createMockTeam("team-b", "Paper Rex", 100000);

  return {
    teamA,
    teamB,
    scoreA: 0,
    scoreB: 0,
    currentRound: 1,
    economyA: "Full" as EconomyState,
    economyB: "Full" as EconomyState,
    matchLog: [],
    ...overrides,
  };
}
```

## Common Test Patterns

### 1. Deterministic Randomness
```typescript
vi.spyOn(Math, "random").mockReturnValue(0.3); // Low = favors teamA
vi.spyOn(Math, "random").mockReturnValue(0.7); // High = favors teamB
vi.restoreAllMocks(); // In beforeEach/afterEach
```

### 2. Immutability Verification
```typescript
const original = JSON.stringify(mockMatchState);
simulateRound(mockMatchState);
expect(JSON.stringify(mockMatchState)).toBe(original);
```

### 3. EngineResult Assertions
```typescript
// Success
expect(result.success).toBe(true);
expect(result.data).toBeDefined();
expect(result.error).toBeUndefined();

// Failure
expect(result.success).toBe(false);
expect(result.error).toBe("ERROR_CODE");
expect(result.message).toContain("expected text");
```

### 4. Error Code Constants
```typescript
// From errorUtils.ts / engine functions
"INSUFFICIENT_BUDGET"
"INVALID_MATCH_STATE"
"MATCH_ALREADY_FINISHED"
"PLAYER_NOT_FOUND"
"PLAYER_NOT_IN_SELLER_TEAM"
"PLAYER_NOT_IN_LENDING_TEAM"
"ALREADY_LOANED"
"ROSTER_PLAYER_NOT_FOUND"
"BENCH_PLAYER_NOT_FOUND"
"ROSTER_FULL"
"UNEXPECTED_ERROR"
```

## Coverage Goals
- **Happy paths**: All success cases for each function
- **Error paths**: Every error code triggered
- **Edge cases**: Empty arrays, boundary values, nullish inputs
- **Immutability**: Every function that returns new objects
- **Randomness**: Both branches of probabilistic logic

## Common Tasks
- Create shared test utilities file (`test-utils.ts`)
- Add integration tests (market + round sim + events)
- Implement snapshot testing for narrative logs
- Add property-based testing for probability distributions
- Set up coverage thresholds in `vitest.config.ts`
- Create test data builders for complex scenarios
- Add performance benchmarks for simulation loops

## Related Files
- `package.json` - Test scripts
- `vitest.config.ts` - If exists (or create for coverage config)
- All engine files - For understanding what to test
- `src/lib/engine/__tests__/*.test.ts` - Existing patterns