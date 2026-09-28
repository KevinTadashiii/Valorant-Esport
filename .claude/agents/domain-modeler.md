---
name: domain-modeler
description: Domain modeling specialist - TypeScript types, validation, serialization, player/team contracts
tools: Read, Write, Edit, Grep, Glob, Bash, Task
---

# Domain Modeler Agent

## Responsibility
Owns the core domain types: `src/lib/types.ts` - the single source of truth for all data structures.

## Core Types to Maintain

### Player System
```typescript
type PlayerRole = "Duelist" | "Initiator" | "Controller" | "Sentinel" | "Flex"

interface PlayerStats {
  aim: number        // 1-100: Raw fragging capability
  utility: number    // 1-100: Utility/skill usage efficiency
  morale: number     // 1-100: Affects performance when trailing
  discipline: number // 1-100: Affects negative event probability
}

interface Contract {
  salary: number     // Per period/week
  buyout: number     // Transfer value
  isLoaned: boolean  // Loan status
  duration: number   // Remaining contract length
}

interface Player {
  id: string
  name: string
  alias: string      // In-game name (IGN)
  role: PlayerRole
  stats: PlayerStats
  contract: Contract
  isSuspended?: boolean
  suspensionMatches?: number
  isTransferListed?: boolean
}
```

### Team System
```typescript
interface Team {
  id: string
  name: string
  budget: number
  roster: Player[]   // Max 5 starters
  bench: Player[]    // Reserves
  winRate?: number   // Team win-rate ratio
}
```

### Match System
```typescript
type EconomyState = "Full" | "Force" | "Eco"

interface MatchState {
  teamA: Team
  teamB: Team
  scoreA: number
  scoreB: number
  currentRound: number
  economyA: EconomyState
  economyB: EconomyState
  matchLog: string[]     // Narrative text from rounds
  isFinished?: boolean
  winner?: Team
}
```

### Event System
```typescript
interface GameEvent {
  id: string
  type: "SCANDAL" | "VOLUNTARY_TRANSFER" | "GENERAL"
  title: string
  description: string
  affectedPlayerId?: string
  affectedTeamId?: string
  timestamp: Date | string
}
```

### Engine Results (Discriminated Union Pattern)
```typescript
interface EngineResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// Specific result types for each operation
interface BuyoutResult { buyerTeam: Team; sellerTeam?: Team; player: Player; feePaid: number }
interface LoanResult { borrowerTeam: Team; lendingTeam?: Team; player: Player; feePaid: number; duration: number }
interface TerminationResult { team: Team; terminatedPlayer: Player; penaltyPaid: number; moralePenaltyApplied: number }
interface RosterActionResult { team: Team; message: string }
interface TransferListingResult { team: Team; player: Player; message: string }
interface RoundSimulationResult { roundWinner: "teamA" | "teamB"; scoreA: number; scoreB: number; currentRound: number; logs: string[]; isMatchOver: boolean; matchWinner?: "teamA" | "teamB" }
```

## Validation Rules (Implicit - Enforce in Code)
- `PlayerStats` fields: 1-100 range
- `Team.roster.length` ≤ 5
- `Contract.duration` ≥ 0
- `Player.isSuspended` → `suspensionMatches` > 0
- `EngineResult.success=true` → `data` present; `success=false` → `error` present

## Serialization Considerations
- `Date` in `GameEvent.timestamp` → ISO string for JSON
- Circular references: None currently (Team ↔ Player is one-way)
- Deep cloning: Use `marketHelpers.cloneTeam/clonePlayer`

## Common Tasks
- Add new player stats (e.g., `clutch`, `entrying`, `support`)
- Extend `PlayerRole` with new roles
- Add contract fields (e.g., `releaseClause`, `performanceBonuses`)
- Create `SeasonState`, `TournamentBracket`, `Standings` types
- Add `MatchFormat` enum (MR12, MR24, Bo3, Bo5)
- Implement type guards / validation functions
- Add Zod schemas for runtime validation

## Related Files
- All engine files import from `../types`
- `marketEngine.ts` - Uses all Player/Team/Contract types
- `roundSimulator.ts` - Uses MatchState, RoundSimulationResult
- `eventEngine.ts` - Uses Team, MatchState, GameEvent
- Test files - Use types for mock factories