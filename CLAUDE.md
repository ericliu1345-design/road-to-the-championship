# Road to the Championship: Track & Field Game

A track and field team-management game for the FBLA 2026–2027 Computer Game & Simulation Programming topic, **Road to the Championship**. The player runs a whole high school track team through a season, and races are a button-alternating mini-game.

## Rules for Claude (always follow)

1. **Discuss before acting.** Before creating, writing, or changing anything (code, art, files), explain what you plan to do and **ask for permission**. Wait for a yes before acting.
2. **Suggest better ideas.** If you have a better option than what the user proposes, say so and explain why. Also offer suggestions to improve the plan after each piece of work, even when not asked. Suggestions are discussed first, never built without permission.
3. **Log progress.** After each work session, add a dated entry to `PROGRESS.md` (newest first) and update its "Current status" section. Logging doesn't need extra permission.
4. **Explain simply.** The user has no coding experience. Use plain language.
5. **Learn from every session.** Record what you learn about the user's preferences (approved or rejected choices, corrections) in Claude's memory, or here if it's a project rule, without being asked.

## Key files

| File | Purpose |
|---|---|
| `PLAN.md` | Full game plan (controls, events, systems, build order) |
| `PROGRESS.md` | Progress log and current status |
| `Computer-Game-Simulation-Programming.pdf` | Official FBLA guidelines and rubric |

## Project decisions

- **Tools:** HTML + JavaScript + Phaser 3, saved locally so the game runs offline
- **Controls:** PC alternates Q/E, mobile taps left/right screen zones, and a controller alternates L1/R1. Only alternating presses count. Rhythm sweet spot is tied to athlete stats. Each event has its own mechanic.
- **Art:** hand-drawn doodle style (thick black marker stick figures, slight wobble, highlighter colors, graph-paper background), all drawn by code. The reference is the "Courir" running GIF (`courir-running.gif`, from https://tenor.com/vR73qRRhzyI.gif), used for style only and never copied. The yellow speed streak only shows near top speed.
- **Sound:** generated in code, so nothing needs crediting
- **Credits:** every outside asset (engine, fonts) goes in `CREDITS.md`

## Code layout

| File | What it does |
|---|---|
| `index.html` | Open this to play (works offline). Lists every script in load order. |
| `js/config.js` | Shared constants: screen size, colors, fonts, press-speed settings, green-zone math |
| `js/doodle.js` | Drawing helpers: marker lines, the stick-figure runner and its pose, the speed streak |
| `js/sound.js` | Sound effects generated with Web Audio |
| `js/ui.js` | Shared screen pieces: cards, buttons, bars, morale faces, arrow-key/controller menus |
| `js/race-sim.js` | Race physics shared by live races and simulated heats |
| `js/season.js` | Season rules with no drawing: schools, practice, meets, scoring, endings, autosave |
| `js/race-scene.js` | The 100m race, in 'quick' (practice) or 'meet' (season heat) mode |
| `js/title-scene.js`, `setup-scene.js`, `hub-scene.js`, `meet-scene.js`, `howto-scene.js`, `ending-scene.js` | One file per screen |
| `js/main.js` | Starts Phaser once the fonts load |

Balance numbers (rival speeds, training gains, energy/morale effects) live in `js/season.js`. After changing them, rerun the automated balance test (many simulated seasons per strategy) and check that smart coaching clearly beats one-note strategies.
| `lib/phaser.min.js` | Local copy of Phaser 3.80.1 |
| `assets/fonts.css` | Fonts embedded as data so they work offline |

Scripts are plain `<script>` tags, not ES modules, because modules don't load from `file://` when you double-click `index.html`.
