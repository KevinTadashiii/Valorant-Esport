# Custom Agents for Valorant Esports Simulator

This directory contains specialized sub-agents for different domains of the project.

## Available Agents

| Agent | File | Domain |
|-------|------|--------|
| **simulation-engineer** | `simulation-engineer.md` | Round simulation, MR24 rules, probability, economy |
| **market-engineer** | `market-engineer.md` | Transfers, loans, contracts, roster management |
| **event-engineer** | `event-engineer.md` | Scandals, transfer requests, dynamic events |
| **domain-modeler** | `domain-modeler.md` | TypeScript types, validation, serialization |
| **test-engineer** | `test-engineer.md` | Vitest patterns, mock factories, coverage |

## Usage

```bash
# Use a specific agent for a task
> Use the simulation-engineer agent to add pistol round logic

# Or let Claude choose the best agent
> Implement a tournament bracket system
```

## Agent Selection Guide

| Task | Recommended Agent |
|------|-------------------|
| Modify round simulation, economy, overtime | `simulation-engineer` |
| Player transfers, contracts, roster ops | `market-engineer` |
| Dynamic events, scandals, morale systems | `event-engineer` |
| Add/modify types, validation, schemas | `domain-modeler` |
| Write tests, improve coverage, test utils | `test-engineer` |
| Cross-cutting refactors, new features | `general-purpose` (built-in) |
| Architectural planning | `Plan` (built-in) |
| Code exploration | `Explore` (built-in) |

## Creating New Agents

1. Create `.claude/agents/your-agent.md` with frontmatter:
```markdown
---
name: your-agent
description: One-line description of when to use this agent
tools: Read, Write, Edit, Grep, Glob, Bash, Task
---
```

2. Document the agent's responsibility, key files, patterns, and common tasks

3. The agent will be available immediately via the Agent tool