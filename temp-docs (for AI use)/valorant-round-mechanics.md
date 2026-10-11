# Valorant Round Mechanics — Comprehensive Guide (Patch 13.06)

A complete reference for every round mechanic in Valorant's **Competitive** and **Unrated** formats.

*Last updated for VALORANT Patch 13.06 (September 22, 2026).*

---

## Table of Contents

1. [Match Structure Overview](#match-structure-overview)
2. [Round Initialization & Phases](#round-initialization--phases)
3. [Economy System](#economy-system)
4. [Ability Usage](#ability-usage)
5. [Performance Score, Accolades & Progression (Patch 13.06)](#performance-score-accolades--progression-patch-1306)
6. [Range & Queue (Patch 13.06)](#range--queue-patch-1306)
7. [Objective Capture & Map Control](#objective-capture--map-control)
8. [Spike Planting & Defusing](#spike-planting--defusing)
9. [Overtime](#overtime)
10. [Timeouts & Surrender](#timeouts--surrender)
11. [Game Modes](#game-modes)
12. [Quick Reference: Timings](#quick-reference-timings)

---

## Match Structure Overview

Valorant is a 5v5 tactical shooter where two teams compete across a series of rounds. One team plays as **Attackers** and the other as **Defenders**. After 12 rounds, teams switch sides. The first team to win **13 rounds** wins the match (best-of-25).

| Aspect | Detail |
|---|---|
| Players per team | 5 |
| Total rounds per half | 12 |
| Rounds to win | 13 |
| Side swap | After round 12 |
| Estimated match length | 30–45 minutes |

---

## Round Initialization & Phases

Each round consists of three distinct phases:

### 1. Buy Phase

Before each round, players enter a **Buy Phase** where they can purchase weapons, armor, and abilities.

| Scenario | Buy Phase Duration |
|---|---|
| Standard rounds (rounds 1–12, first half) | 30 seconds |
| Standard rounds (rounds 1–12, second half) | 30 seconds |
| After a half-time reset or after a spike plant | 45 seconds |
| Overtime rounds | 30 seconds |

**Key rules:**
- Players can continue buying for the first **5 seconds** of the active round timer if they haven't finalized their loadout.
- During Buy Phase, most abilities cannot be used, but exceptions exist (see [Ability Usage](#ability-usage)).
- The team that lost the previous round has priority in the shop (they see items 5 seconds earlier).

### 2. Active Round Phase

The active phase begins when the buy phase ends and the spawn barrier drops.

| Mode | Active Round Timer |
|---|---|
| Competitive / Unrated | 100 seconds |

The round ends when one of the following occurs:
- All Attackers are eliminated (Defenders win)
- All Defenders are eliminated (Attackers win)
- The Spike detonates (Attackers win)
- The Spike is defused (Defenders win)
- The timer expires and the Spike has not been planted (Defenders win)

### 3. Post-Plant Phase

When the Spike is planted, the active timer is replaced by a **45-second detonation clock**. This extends the round regardless of the original timer.

```
Example: Spike planted with 15 seconds remaining on the round clock
→ Detonation timer: 45 seconds
→ Total time available for retake: 45 seconds (not 15)
```

---

## Economy System

The economy is a core strategic layer in Valorant. Credits (creds) are earned and spent each round to fund weapons, armor, and abilities.

### Credit Basics

| Source | Credits |
|---|---|
| Starting credits | 800 |
| Round win bonus | 3,000 |
| Loss bonus (first loss) | 1,900 |
| Loss bonus (progressive, up to 8th consecutive loss) | Up to 2,900 |
| Kill reward | 200 per kill |
| Spike plant bonus (per attacker) | 300 (regardless of round outcome) |
| Credit cap | 9,000 maximum |

### Buy Types

| Buy Type | Description | Typical Credit Spend |
|---|---|---|
| **Full Buy** | Rifle + full armor + full utility | ~3,900–4,700 per player |
| **Half Buy** | Mid-tier weapon + light armor, saving next round | ~1,500–2,500 per player |
| **Eco/Save** | Minimal purchase (sidearm only) or nothing | 0–1,000 per player |
| **Force Buy** | Aggressive spend despite low credits (match point) | All available credits |

### Credit Schedule Examples

**Standard Competitive Half:**

| Round | Starting Credits | Notes |
|---|---|---|
| 1 | 800 | Pistol round — usually save or light buy |
| 2 | 800 + 3,000 (if won) or 800 + 1,900 (if lost) | |
| 3 | Varies | Win streak affects economy |
| Endgame (13th round) | 5,000 | Fixed starting credits |

### Weapon Prices (Selected)

| Weapon | Category | Cost |
|---|---|---|
| Classic | Pistol | Free |
| Shorty | Pistol | 1,100 |
| Frenzy | Pistol | 450 |
| Ghost | Pistol | 500 |
| Stinger | SMG | 1,100 |
| Spectre | SMG | 2,400 |
| Judge | Shotgun | 1,850 |
| Bucky | Shotgun | 2,250 |
| Marshal | Sniper | 1,000 |
| Operator | Sniper | 4,700 |
| Vandal | Rifle | 2,900 |
| Phantom | Rifle | 2,900 |
| Warden | Rifle | 2,900 |
| Ares | LMG | 1,600 |
| Odin | LMG | 3,200 |

### Armor

| Type | Cost | Protection |
|---|---|---|
| Light Shield | 200 | 50 HP |
| Heavy Shield | 1,000 | 100 HP |

---

## Ability Usage

Every agent has access to a set of abilities categorized into four types.

### Ability Types

| Type | Description | Cost |
|---|---|---|
| **Passive** | Always active, no input required | Free |
| **Basic** | Purchased with credits, limited charges | 100–400 per use |
| **Signature** | Free charge each round, additional charges purchasable | Free (1 charge) + credits for extras |
| **Ultimate** | Requires ultimate points to cast | 7–9 points |

### Ultimate Points

Ultimate points (♦) are earned through:

| Action | Points |
|---|---|
| Kill | 1 ♦ |
| Death | 1 ♦ |
| Spike plant | 1 ♦ |
| Spike defuse | 1 ♦ |
| Collecting ultimate orb | Varies (full ultimate) |

**Ultimate Point Thresholds by Agent:**

| Agent | Ultimate Cost |
|---|---|
| Astra | 7 ♦ |
| Breach | 8 ♦ |
| Brimstone | 8 ♦ |
| Chamber | 8 ♦ |
| Clove | 8 ♦ |
| Cypher | 7 ♦ |
| Deadlock | 7 ♦ |
| Fade | 8 ♦ |
| Gekko | 8 ♦ |
| Harbor | 7 ♦ |
| Iso | 7 ♦ |
| Jett | 8 ♦ |
| KAY/O | 8 ♦ |
| Killjoy | 9 ♦ |
| Miks | 8 ♦ |
| Neon | 8 ♦ |
| Omen | 7 ♦ |
| Phoenix | 7 ♦ |
| Raze | 8 ♦ |
| Reyna | 7 ♦ |
| Sage | 7 ♦ |
| Skye | 8 ♦ |
| Sova | 8 ♦ |
| Tejo | 9 ♦ |
| Veto | 7 ♦ |
| Viper | 9 ♦ |
| Vyse | 8 ♦ |
| Waylay | 8 ♦ |
| Yoru | 7 ♦ |

### Buy Phase Ability Rules

Most abilities cannot be used during the Buy Phase, but exceptions include:

| Agent | Buy-Phase Usable Abilities |
|---|---|
| Astra | Astral Form (Stars placement) |
| Chamber | Rendezvous (teleport anchor), K/Cafe Trap, Headhunter |
| Cypher | Spycam, Trapwire, Cyber Cage (placement only) |
| Deadlock | Sonic Sensor |
| Jett | Updraft |
| Killjoy | Nanoswarm (placement), Alarmbot, Turret |
| Neon | High Gear (charge, not consumed) |
| Omen | Shrouded Step |
| Raze | Blast Pack |
| Sage | Healing Orb |
| Viper | Poison Cloud (placement), Toxic Screen (placement) |
| Vyse | Razorvine (placement), Shear, Arc Rose (placement) |
| Yoru | Fakeout (stationary placement), Gatecrash (placement) |

### Ability Cooldowns & Charges

- **Basic abilities** must be purchased each round with credits and have a limited number of charges.
- **Signature abilities** provide one free charge per round; extra charges can be bought.
- **Ultimate abilities** require accumulated ultimate points and are available once the threshold is met.

---

## Objective Capture & Map Control

### Bomb Sites

Each map features designated Spike sites where Attackers can plant the Spike:

| Map | Sites |
|---|---|
| Ascent | A Site, B Site |
| Bind | A Site, B Site |
| Breeze | A Site, B Site |
| Haven | A Site, B Site, C Site |
| Icebox | A Site, B Site |
| Pearl | A Site, B Site |
| Split | A Site, B Site |
| Lotus | A Site, B Site |
| Sunset | A Site, B Site |
| Corrode | A Site, B Site |
| Abyss | A Site, B Site |
| Summit | A Site, B Site |

### Map Control Concepts

**Default Round:** Attackers spread across multiple lanes to gather information about defender positioning without committing to a site. This typically lasts 30–60 seconds.

**Site Execute:** A coordinated push onto a site using utility (smokes, flashes, molotovs) to gain advantage. The execute sequence is:
1. Utility is deployed first (smokes to block sightlines, flashes to blind)
2. Entry fragger peeks after utility lands
3. Team follows and trades kills
4. Spike is planted
5. Remaining attackers hold angles for post-plant

**Rotation:** On defense, movement between sites in response to attacker pressure. Rotation from one site to another typically takes **12–18 seconds** depending on the map.

**Fake Execute:** Attackers simulate pressure on one site to draw defenders away, then quickly rotate to the actual target site.

**Post-Plant:** After planting, Attackers spread to cover defuse angles while Defenders organize a retake.

---

## Spike Planting & Defusing

The Spike is the central objective in Plant/Defuse game modes.

### Spike Acquisition

- At the start of each round, the Spike spawns in the Attackers' spawn area.
- Any Attacker can pick it up (press F or walk over it).
- If the carrier is killed, the Spike drops at that location and can be picked up by another Attacker.
- A dropped Spike bounces off geometry until it reaches the ground.

### Planting

| Property | Value |
|---|---|
| Plant time | **4 seconds** |
| Cancel behavior | Player can cancel at any time; restarting requires full 4 seconds |
| Must complete before | Round timer hits 0:00 |
| Movement during plant | Rooted (cannot move) |
| Body rotation | Allowed during plant |
| Ultimate point reward | 1 ♦ for the planter |
| Credit bonus | 300 credits per attacker (regardless of round outcome) |

### Defusing

| Property | Value |
|---|---|
| Full defuse time | **7 seconds** |
| Half defuse time | **3.5 seconds** |
| Cancel behavior | Progress saves at 3.5 seconds; resume from halfway |
| Movement during defuse | Rooted (cannot move) |
| Body rotation | Allowed during defuse |
| Ultimate point reward | 1 ♦ for the defuser |

### Detonation

| Property | Value |
|---|---|
| Detonation timer | **45 seconds** after plant |
| Explosion radius | ~35 meters (audio range) |
| Effect | Instantly kills any player in the blast radius |

### Spike Beep Cadences

The planted Spike produces audible beeps that increase in frequency:

| Time Remaining | Beep Rate | Visual Cues |
|---|---|---|
| 45–25 seconds | 1 beep/second | Normal spin |
| 25–35 seconds | 2 beeps/second | Small white aura appears |
| 35–40 seconds | 4 beeps/second | Larger aura, ground cracking |
| 40–7 seconds | 8 beeps/second | Intense visual effects |
| <7 seconds | Continuous | White sphere closes in — **too late to full-defuse** |

**Defuse feasibility check:** If the white sphere is visible when you start defusing, you cannot complete a full defuse in time. However, a half-defuse may still be possible if progress has already been made.

### Fake Defuse

A tactical technique where a Defender starts defusing, then cancels to bait Attackers out of position. Attackers often peek or use abilities when they hear the defuse sound, making them vulnerable to counter-shots.

---

## Overtime

Overtime occurs when the match reaches a 12–12 tie.

### Competitive Overtime

| Rule | Detail |
|---|---|
| Format | Win-by-two |
| Rounds per OT set | 2 (one attack, one defense per team) |
| Starting credits | 5,000 per player per round |
| Ultimate points | Set to 3 short of the ultimate threshold |
| Side swapping | Every round |
| Draw option | Available via vote |

**Overtime voting for draws:**

| Vote occurrence | Votes needed to draw |
|---|---|
| First vote | 6 votes (out of 10) |
| Second vote | 3 votes |
| Subsequent votes | 1 vote |

If a team wins both rounds of an OT set, they win the match. If each team wins one round, another OT set begins.

### Unrated Overtime

Unrated uses **Endgame** instead of Overtime:
- A single sudden-death round is played
- No draw option
- Winner of the round wins the match

---

## Timeouts & Surrender

### In-Game Timeouts

| Mode | Timeouts per team | Duration |
|---|---|---|
| Competitive | 2 per half (first 24 rounds) + 1 in overtime | 60 seconds |
| Unrated | Not available | — |

**Timeout rules:**
- Must be called within the first **20 seconds** of the Buy Phase
- Unused timeouts from regulation do **not** carry over to overtime
- During a timeout, players cannot control their agent (no movement or ability use)
- Headsets must remain on; communication with coaches is restricted

### Technical Pauses

| Pause Type | Trigger | Max Duration |
|---|---|---|
| Suspension of Play | Disconnect, freeze, crash | >10 minutes |
| Equipment Check | Mouse battery, audio bug | 3–5 minutes |
| Player Emergency | One per team per map | 10 minutes aggregate |

Invalid pause reasons include minor audio adjustments or in-ear headphone tweaks.

### Surrender Votes

| Mode | When available | Votes required |
|---|---|---|
| Unrated | Round 5+ | 80% (4/5) |
| Competitive | Round 5+ | 100% (unanimous) |

To call a surrender:
- Type `/surrender`, `/concede`, or `/ff` in chat
- Or click the Surrender button in the Escape menu

If a teammate has already attempted a surrender in the same half, your attempt is ignored (one attempt per phase).

---

## Game Modes

### Standard Modes

| Mode | Format | Rounds to Win | Key Differences |
|---|---|---|---|
| **Unrated** | Best-of-25 | 13 | Standard rules; Endgame (sudden death) at 12–12 |
| **Competitive** | Best-of-25 | 13 | Ranked; Overtime with draw votes; Performance Score; Accolades; Rank Legacy |

### Match Structure Comparison

| Feature | Unrated | Competitive |
|---|---|---|
| Economy | Standard | Standard |
| Buy phase | 30s / 45s | 30s / 45s |
| Round timer | 100 seconds | 100 seconds |
| Side swap | After round 12 | After round 12 |
| Endgame / Overtime | Sudden death (1 round) | Win-by-two with draw votes |
| Surrender | 80% (4/5) | 100% unanimous |
| Timeouts | Not available | 2 per half + 1 OT |
| Performance Score | Yes | Yes |
| Accolades | No | Yes |
| Rank Legacy | No | Yes |

---

## Quick Reference: Timings

| Mechanic | Time |
|---|---|
| Buy phase (standard) | 30 seconds |
| Buy phase (after plant / half) | 45 seconds |
| Buy phase (overtime) | 30 seconds |
| Active round timer | 100 seconds |
| Spike plant time | 4 seconds |
| Spike defuse time | 7 seconds |
| Half defuse | 3.5 seconds |
| Spike detonation time | 45 seconds |
| Overtime round credits | 5,000 per player |
| Timeout duration | 60 seconds |
| Sudden Death (Unrated) | 1 round |

---

*Document compiled from official VALORANT Wiki, Riot Games support pages, and community resources. Mechanics may be subject to change with patch updates.*

**Patch 13.06 Changelog Summary:**
- Added **Warden** (2900 credits, 2x scope, 18-round mag, 50 body / 200 head damage)
- Removed **Retake** from rotation
- Replaced **ACS** with **Performance Score** (0–500)
- Added **Accolades**, **Rank Legacy**, and **Agent Mastery** systems
- Added **Range & Queue** integration (enter Range while matchmaking, or queue from within)
