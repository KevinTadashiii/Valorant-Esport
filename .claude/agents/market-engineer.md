---
name: market-engineer
description: Market & roster operations specialist - buyouts, loans, contracts, transfers, roster management
tools: Read, Write, Edit, Grep, Glob, Bash, Task
---

# Market Engineer Agent

## Responsibility
Owns the market engine and helpers: `src/lib/engine/marketEngine.ts`, `src/lib/engine/marketHelpers.ts`, and their tests.

## Core Domain
- **Player transfers**: Buyouts (full purchase), Loans (temporary, 20% fee default), Free agents
- **Contract management**: Termination (severance = salary × duration × rate), morale penalties
- **Roster operations**: Swap starter↔bench, promote/demote, 5-player roster limit
- **Transfer market**: List/delist players, custom buyout prices

## Key Functions (marketEngine.ts)
| Function | Purpose |
|----------|---------|
| `buyoutPlayer()` | Purchase player from another team or as free agent |
| `loanPlayer()` | Borrow player with fee, sets `isLoaned=true` |
| `terminateContract()` | Fire player, pay penalty, reduce team morale |
| `swapRosterAndBench()` | Exchange starter with bench player |
| `movePlayerToRoster()` | Promote bench → roster (swap if full) |
| `movePlayerToBench()` | Demote roster → bench |
| `setPlayerTransferListing()` | List/delist on transfer market |

## Key Helpers (marketHelpers.ts)
| Helper | Purpose |
|--------|---------|
| `clonePlayer()` / `cloneTeam()` | Deep immutable copies |
| `findPlayerInTeam()` | Locate player in roster or bench |
| `removePlayerFromTeam()` | Immutable removal |
| `adjustTeamBudget()` | Add/subtract budget immutably |
| `addPlayerToBench()` | Add to bench (max not enforced here) |
| `updatePlayerInTeam()` | Update player at roster/bench index |
| `calculateLoanFee()` | `buyout × ratio` (default 0.2) |
| `calculateTerminationPenalty()` | `salary × duration × rate` (default 1.0) |
| `applyMoralePenalty()` | Reduce morale by %, clamp to MIN_MORALE (1) |

## Constants (marketHelpers.ts)
```typescript
DEFAULT_ROSTER_LIMIT = 5
DEFAULT_LOAN_FEE_RATIO = 0.2
DEFAULT_TERMINATION_PENALTY_RATE = 1.0
DEFAULT_TERMINATION_MORALE_PENALTY_PERCENT = 10
MIN_MORALE = 1
MAX_MORALE = 100
```

## Testing Patterns
- Use `createMockPlayer()` / `createMockTeam()` factories from test file
- Verify immutability: original objects unchanged after operations
- Test budget math: buyer -fee, seller +fee (for buyouts/loans)
- Test error codes: `INSUFFICIENT_BUDGET`, `PLAYER_NOT_FOUND`, `ROSTER_FULL`, `ALREADY_LOANED`, `PLAYER_NOT_IN_SELLER_TEAM`
- Check `EngineResult` success/error structure

## Common Tasks
- Add contract renegotiation (extend duration, adjust salary)
- Implement transfer deadline / window system
- Add player development (stat growth over time)
- Create loan recall / early termination logic
- Add agent/role restrictions (e.g., max 2 Duelists)

## Related Files
- `src/lib/types.ts` - `Player`, `Team`, `Contract`, `EngineResult`, all result types
- `src/lib/engine/errorUtils.ts` - `makeFailure` for standardized errors
- `src/lib/engine/__tests__/marketEngine.test.ts` - Comprehensive test patterns