---
name: event-engineer
description: Dynamic events specialist - scandals, transfer requests, morale systems, stochastic events
tools: Read, Write, Edit, Grep, Glob, Bash, Task
---

# Event Engineer Agent

## Responsibility
Owns the event engine: `src/lib/engine/eventEngine.ts` and its tests.

## Core Domain
- **Scandal events**: Triggered when player `discipline < 50` (30% chance per round)
  - Effect: -10 morale, 3-match suspension, logged to matchLog
- **Voluntary transfer events**: Triggered when team win rate < 40%
  - Effect: High-stat players (aim > 80 or utility > 80) marked `isTransferListed = true`
- **Future events**: Injuries, form slumps, contract disputes, agent meta shifts

## Key Function
```typescript
triggerEvents(params: TriggerEventParams): TriggerEventResult
```
- Input: `{ team: Team, matchState?: MatchState }`
- Output: `{ updatedTeam: Team, events: string[] }`
- Mutates: Deep-cloned team (immutable pattern), optionally appends to `matchState.matchLog`

## Event Logic Details

### Scandal Event
```typescript
if (player.stats.discipline < 50 && Math.random() < 0.3) {
  player.stats.morale = Math.max(1, player.stats.morale - 10)
  player.isSuspended = true
  player.suspensionMatches = 3
  // Log to matchState.matchLog if provided
}
```

### Transfer Request Event
```typescript
// Win rate calculation (simplified)
const winRate = (totalPoints / (totalRounds * 2)) * 100
if (winRate < 40) {
  for (player of roster) {
    if (player.stats.aim > 80 || player.stats.utility > 80) {
      player.isTransferListed = true
    }
  }
}
```

## Constants (inline - consider extracting)
- Discipline threshold: `50`
- Scandal probability: `0.3` (30%)
- Morale drop: `10`
- Suspension duration: `3` matches
- Win rate threshold: `40%`
- High-stat threshold: `80` (aim or utility)

## Testing Patterns
- Mock `Math.random()` for deterministic scandal triggers
- Provide `matchState` to test log integration
- Verify immutability: original team not mutated
- Test edge cases: no matchState, suspended players, already transfer-listed
- Check `TriggerEventResult` structure: `{ updatedTeam, events: string[] }`

## Common Tasks
- Add **injury events** (random, based on playtime/fatigue)
- Implement **form/momentum** (win/loss streaks affect performance)
- Create **contract dispute events** (unhappy players demand transfer)
- Add **meta shift events** (agent buffs/nerfs affect role values)
- Implement **event cooldowns** (prevent spam)
- Add **event severity tiers** (minor/major/crisis)
- Create **event history** for narrative building

## Related Files
- `src/lib/types.ts` - `Team`, `Player`, `MatchState`, `GameEvent`, `PlayerStats`
- `src/lib/engine/roundSimulator.ts` - Could call `triggerEvents` each round
- `src/lib/engine/__tests__/eventEngine.test.ts` - Test patterns
- `src/lib/engine/marketEngine.ts` - Transfer listing integration