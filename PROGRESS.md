# Progress Log: Road to the Championship

Newest entries at the top. See `PLAN.md` for the full game plan.

---

## Current status

- **Phase:** Season Part A done (full season from setup to 6 endings)
- **Next step:** user playtests a full season; then Season Part B (recruiting, budget, random challenges) or Phase 2 (more events)
- **How to play it:** double-click `index.html`

---

## 2026-10-11: Season Part A built

### Design
Decided with the user through 25 questions (full table in `PLAN.md` section 5b). Highlights: name your coach, school, mascot, color and 4 athletes; Speed and Focus stats; Energy and per-athlete Morale; practice per athlete; you race all 4 heats (weekly meets can be simulated); top 2 at Regionals go to State; Skibidi Verity High School (yellow) is the surprise powerhouse at State; 1st false start in a meet = warning, 2nd = disqualified; 6 endings; coach's clipboard look; guided first week plus a How to Play page; autosave.

### Built
- New screens: title (with a running doodle), team setup (real text boxes), coach's clipboard, meet (practice report, lineup cards with rival form, heat results, meet results), How to Play, ending recap.
- The race screen now runs both practice races and season heats.
- Season rules in `js/season.js`, race physics shared in `js/race-sim.js`, shared UI pieces in `js/ui.js`, constants in `js/config.js`.
- Keyboard, mouse, touch and controller all work on every screen.

### Balance testing
Played 150 automatic seasons for each strategy and tuned until smart coaching clearly wins. Changes made while tuning: tired penalty starts below 50 Energy (was 60); happy morale bonus is +1% (was +2%); bigger Speed gains from training; rivals improve 0.3% a week (was 0.4%); Skibidi Verity about 1.5% slower; simulated heats run at 94–98%; "State podium" now means 2nd at State. Final numbers:

| Strategy | Result |
|---|---|
| Smart coaching, great racing at big meets | 37% champions, 47% runner-up |
| Smart coaching, racing every heat well | 25% champions, 10% Perfect Season |
| Smart coaching, average racing | 91% make State |
| Trains hard right before State | 3% champions |
| Only rest / only bonding / only focus | almost never win State |
| Only speed work | 43% the team falls apart |

### Tested
Screenshots of every screen; a full live heat inside a meet (result goes back to the meet and is scored); false start → warning → disqualified (0 points, −6 morale); practice race from the title. No errors. Not yet played by a person.

---

## 2026-10-11: Random rival times

### Done
- User asked for random rival times and chose **Medium** randomness (about ±0.35 s).
- Each rival now gets a random "form of the day" (±3.5% top speed) before every race, plus random surges and fades during the race. Their personalities (fast starter, strong closer, steady) stay the same.
- Changed only `js/race-scene.js` (`RIVAL_FORM_SWING`, `RIVAL_SURGE`).

### Tested
20 simulated races with a perfect steady presser (8.9 presses/s, Normal):
| Runner | Fastest | Average | Slowest |
|---|---|---|---|
| You | 11.23 | 11.23 | 11.23 |
| M. Torres | 11.06 | 11.39 | 11.65 |
| D. Kim | 11.37 | 11.56 | 11.86 |
| J. Okafor | 11.59 | 11.85 | 12.15 |

The perfect presser won 16 of 20 races.

### Idea for later
In the season, rivals could improve week by week, and the start screen could show their season best.

---

## 2026-10-11: Phase 1 built

### Done
- Looked at all 5 frames of `courir-running.gif`: a hand-drawn marker stick figure with a yellow highlighter streak.
- **Art style changed from pixel art to doodle style** (user approved) to match the GIF.
- Built the 100m race:
  - Start sequence "On your marks… Set… BANG!"; pressing during "Set" is a false start
  - Alternate Q/E (or A/D, ←/→), tap left/right on touch screens, or L1/R1 on a controller
  - Only alternating presses count; the same side twice causes a stumble; holding a key does nothing
  - Stride rhythm meter with a green zone and three press-speed settings (Easy 4.5–7.5, Normal 6.5–9.5, Hard 8–11 presses per second)
  - Stick-figure runners that lean forward and cycle their legs faster as they speed up
  - **The yellow streak only appears near top speed**, as the user asked
  - 3 rivals with different styles: fast starter (Ridgeview), strong closer (Lakeside), steady (Pine Valley)
  - Results card with places, times, reaction time, top speed, % in the zone, stumbles, a coaching tip, and a saved personal best
  - Pause (P/Esc or button), mute (M or button), reduced-motion support, tap-zone footprints on touch screens
  - Sounds made in code: starting gun, footsteps, stumble, crowd that gets louder near the finish
- Downloaded Phaser 3.80.1 and two fonts locally so the game runs offline. Added `CREDITS.md`.
- Added CLAUDE.md rules: always suggest plan improvements, and learn from every session.

### Tested
Automated test runs in a hidden Chrome browser:
| Test | Result |
|---|---|
| Menu screen | Draws correctly, fonts load |
| Mid-race at about 55 m, pressing ~9 per second | 10.2 m/s, "In the zone!", yellow streak showing |
| Full race, pressing ~9 per second | 1st place, 11.23 s (Torres 11.32, Kim 11.60, Okafor 11.83) |
| Full race, pressing 5.5 per second | 4th place, 13.32 s, tip says to press faster |

No errors. Not yet tested by a person with a real keyboard, phone, or controller.

### Files added
`index.html`, `js/doodle.js`, `js/sound.js`, `js/race-scene.js`, `js/main.js`, `lib/phaser.min.js`, `assets/fonts.css`, `CREDITS.md`

---

## 2026-10-11 (later)

### Done
- Created `CLAUDE.md` with the project rules. Claude must discuss first and ask permission before creating or changing anything.

### Decisions made
| Decision | Choice |
|---|---|
| Running reference | The "Courir" running GIF |
| Track and stadium references | Not needed; Claude designs them |
| Control upgrades | **Approved** (alternating only, rhythm sweet spot, different mechanics per event, accessibility options) |
| Season length | Undecided for now |

---

## 2026-10-11

### Done
- Read the FBLA 2026–2027 Computer Game & Simulation Programming guidelines (`Computer-Game-Simulation-Programming.pdf`). Topic: **Road to the Championship**.
- Found that a clicking race on its own doesn't fit the topic. The game needs a **season-management layer** (recruiting, practice, budget, morale, challenges) with the race as the meet-day mini-game.
- Wrote the full plan in `PLAN.md`.

### Decisions made
| Decision | Choice |
|---|---|
| Theme | Track and field |
| Scope | Manage a **whole team**, not one athlete |
| Who codes | Claude writes all the code (user has no coding experience; not submitting to FBLA) |
| Art | Original pixel art made by Claude, inspired by reference pictures the user finds |
| Running controls | PC: alternate Q/E. Mobile: tap left/right zones. Controller: alternate L1/R1. |
| Tools (proposed) | HTML + JavaScript + Phaser 3, runs offline |
| Teammates | Unknown |

### Suggested improvements (waiting for approval)
- Only alternating presses count; pressing the same key twice causes a stumble
- Rhythm sweet spot tied to training, fatigue, morale, and injury
- Different mechanics per event: reaction start, stamina pacing, hurdle jumps, baton handoff, long-jump takeoff
- Accessibility: assist mode, remappable keys, adjustable press-speed difficulty

### Files
| File | What it is |
|---|---|
| `Computer-Game-Simulation-Programming.pdf` | Official FBLA guidelines and rubric |
| `PLAN.md` | Full game plan |
| `PROGRESS.md` | This log |
| `CLAUDE.md` | Rules and context Claude reads automatically every session |
