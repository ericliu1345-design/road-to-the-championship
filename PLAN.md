# Road to the Championship: Track & Field Game Plan

FBLA 2026–2027 Computer Game & Simulation Programming
Topic: **Road to the Championship**. Players run a high school athletic team, with the goal of winning the state championship.

---

## 1. What the topic requires

From the official guidelines (`Computer-Game-Simulation-Programming.pdf`), the player must:

- Recruit and develop athletes
- Manage practices and resources
- Maintain team morale
- Respond to unexpected challenges
- Make strategic decisions that affect performance on and off the field
- Work toward one goal: winning the state championship

Key question the game must answer: *How will strategic decision-making help your team overcome obstacles and achieve championship success?*

**Core idea:** a season-management game for a whole track team. Races are a button-alternating mini-game, and the player's management decisions (training, rest, morale, budget) change how well each athlete can run.

### Rubric checklist (110 points total)

| Rubric item | How the game covers it |
|---|---|
| Addresses topic and guidelines (15) | Full season: recruiting, practice, budget, morale, challenges, state championship |
| Rules well defined (5) | How to Play screen, in-game tooltips, rules explained to judges |
| Challenging but completable (5) | Tuned difficulty, plus demo mode and assist mode |
| Multiple outcomes | Five endings (see section 5) |
| Innovation and creativity (5) | Rhythm-based running, different mechanics per event, recap that grades your decisions |
| Tools explained (5) | Phaser 3 + JavaScript, with reasons and possible improvements |
| Graphics fit the topic (5) | Original pixel-art track and field style |
| Graphics consistent (5) | One art style, recolored team sprites |
| Color, typography, sound (5) | Team colors, readable fonts, starting gun, crowd, footsteps |
| Title screen and instructions (5) | Title screen, How to Play, and a game simple enough to start without reading |
| UX design (5) | Documented user journey, design reasons, accessibility features |
| Navigation and enjoyment (5) | Clear menus, Season Hub, save and continue |
| Controls intuitive (5) | Alternating Q/E, tap zones, controller, remappable keys |
| Presentation (40) | 7-minute talk, 3-minute Q&A, backup video and screenshots |

---

## 2. Running controls

### Base controls

| Platform | Run | Action (jump, baton, takeoff) |
|---|---|---|
| PC | Alternate **Q / E** (also A/D or ← / →) | **Space** or **W** |
| Mobile | Alternate tapping the **left / right halves** of the screen (footprint icons) | Tap the center button |
| Controller (plugged into the laptop) | Alternate **L1 / R1** | **A** (Xbox) or **X** (PlayStation) |

Note: you can't put a homemade game on a PlayStation or Xbox. "Controller support" means plugging a controller into the laptop, which browsers support.

### Upgrades to the base controls

1. **Only alternating presses count.** Q, E, Q, E moves you forward. Pressing the same key twice causes a small stumble. Holding a key down does nothing, because key auto-repeat is ignored.
2. **Rhythm sweet spot.** Each athlete has a best stride tempo. Faster helps up to their limit, and going past it wastes energy.
   - Better training raises top speed
   - Fatigue and low morale make the sweet spot smaller
   - Injury lowers maximum speed no matter how fast you press
3. **A different mechanic for each event** (see section 4).
4. **Accessibility:** assist mode, remappable keys, and adjustable difficulty for how fast you need to press.

### Race speed formula (draft)

```
targetSpeed = athlete.topSpeed
            × strideEffectiveness   // how close the press rhythm is to the sweet spot
            × (1 - fatiguePenalty)
            × moraleModifier
            × injuryModifier
```

---

## 3. Tools

**HTML + JavaScript with the Phaser 3 game engine**, saved locally so it runs **without internet**.

- Runs in any browser on a laptop or phone, and works with a controller
- Phaser handles sprite animation, sound, input, and scenes
- Nothing needs installing. You open the file and play.
- The guidelines warn that venue Wi-Fi may be unreliable and that there's no electricity, so bring a charged laptop with a local copy.

---

## 4. Events

| Event | Mechanic |
|---|---|
| **100m** | Alternate as fast as possible. **Reaction start** on the gun; going early is a false start (disqualified). |
| **400m / 1600m** | **Stamina bar.** Keep the pace in a target zone, then sprint at the end. |
| **110m / 100m hurdles** | Alternate to run, press the action button to jump each hurdle at the right moment |
| **4x100 relay** | Press the action button when the next runner is in the handoff zone to pass the baton |
| **Long jump** | Build speed, then time the takeoff before the foul line |
| Other events (throws, etc.) | Simulated from athlete stats |

At each meet the player races 1–2 key events. The rest are simulated so a meet doesn't take too long.

---

## 5. Game flow

```
Title Screen → Settings (accessibility) → How to Play
   ↓
Create Your Program: school name, colors, mascot
   ↓
Recruiting: choose ~8 athletes from a pool, limited budget/scholarship points
   ↓
SEASON (~6 weeks), each week:
   1. Practice plan: split hours between Speed / Endurance / Technique / Rest / Team Bonding
   2. Budget: spikes, athletic trainer, travel, fundraiser
   3. Challenge event: a pop-up with a choice
   4. Meet Day: assign athletes to events → race 1–2 events → the rest are simulated → team scores
   ↓
POSTSEASON: Conference → Regionals (top finishers qualify) → STATE CHAMPIONSHIP
   ↓
Ending + season recap
```

### Endings

1. **State Champions**
2. **State podium**: placed but didn't win
3. **Qualified for State but fell short**
4. **Season ended at Regionals**
5. **Team fell apart**: morale hit zero

The recap screen grades your decisions (morale, injuries, athlete development) so the player learns what worked.

---

## 5b. Season Part A design (decided 2026-10-11)

Decided with the user through 25 questions. These replace earlier guesses where they differ.

| Topic | Decision |
|---|---|
| Setup | Type coach name, school name and mascot; pick a team color; type 4 athlete names (with random buttons) |
| Team | 4 sprinters: one Star, two Solid, one Freshman (low stats, grows fastest) |
| Stats | **Speed** (top speed) and **Focus** (green-zone width), shown as 1–100 numbers with bars |
| Meters | **Energy** (below 50 = up to −10% top speed) and **Morale** (per athlete: up to +1% when happy, −4% when unhappy). Tuned down from 60 / +2% after balance testing. |
| Season | 5 weekly meets → Regionals → State |
| Practice | Chosen per athlete each week: Speed work, Focus drills, Rest day, Team bonding |
| Meets | Each athlete runs one 100m heat against one athlete from each other school. **You race all 4 heats.** |
| Skipping | Weekly meets can be simulated (scores a bit worse than a good race). Regionals and State must be raced. |
| Scoring | Heat places → team points (1st 5, 2nd 3, 3rd 2, 4th 1). Most points wins the meet. |
| Qualifying | Top 2 at Regionals go to State |
| Rivals | Ridgeview, Lakeside, Pine Valley all season, improving each week. At State: **Skibidi Verity High School** (verity yellow / gold) appears as the surprise powerhouse. |
| Lineup card | Rival form shown in words ("looks sharp today", "seems tired") |
| Morale zero | That athlete refuses to race (heat forfeited). Warnings when morale gets low. If 3 of 4 athletes hit zero, the team falls apart. |
| Injuries | None in Part A |
| False starts in meets | First = warning and restart; second = disqualified (0 points) |
| Endings (6) | Perfect Season (won everything), State Champions, State podium (**2nd at State**; with only 4 teams, 3rd counting as podium was too easy), Made State but fell short (3rd–4th), Out at Regionals, Team fell apart |
| Look | Season screens are a doodled coach's clipboard |
| Teaching | Guided tips in week 1 plus a How to Play page |
| Saving | Autosave every week; Continue button on the title screen |

## 6. Core systems

| System | Details |
|---|---|
| **Athletes** | Name, grade (9–12), event, Speed, Endurance, Technique, Confidence, Fatigue, Injury, Grades (academic eligibility) |
| **Team** | Morale, Budget, Reputation (affects recruiting) |
| **Practice tradeoff** | More training raises stats faster but builds fatigue and injury risk. Rest recovers. |
| **Challenges (~20)** | Each is a choice with tradeoffs. Example: "Your star sprinter has a calculus test on meet day." Study (miss practice) or train anyway (risk becoming ineligible). |
| **Scoring** | Points by place, 10-8-6-5-4-3-2-1, added into a team total |
| **Rival schools** | AI runners with styles: fast starter, strong finisher, consistent |
| **Save system** | Saves the season automatically (browser local storage) |

---

## 7. Art and sound

- **One consistent hand-drawn doodle style** throughout, matching the Courir GIF: thick black marker lines, a slight hand-drawn wobble, and highlighter colors on graph paper. (Changed from pixel art on 2026-10-11 after seeing the GIF.)
- The runner is a stick figure drawn by code, not a sprite sheet. **The legs cycle faster and the body leans further forward as the runner speeds up.**
- **The yellow speed streak only appears near top speed** and grows longer and brighter the faster you go.
- Each school wears a different shirt color.
- Moving background: stands and crowd (scrolling slower, so they look far away), lane lines, distance signs
- **Original art only.** The Courir GIF is only a style reference. Outside assets (engine, fonts) are listed in `CREDITS.md`.
- Sounds (starting gun, footsteps, crowd, menu clicks, music) are generated in code, so nothing needs crediting.

---

## 8. Accessibility features

- Assist mode: one button pressed in rhythm, or hold to run while you only choose pace
- Remappable keys, with Q/E, A/D, and arrow keys all on by default
- Adjustable difficulty for how fast you need to press
- Colorblind-safe colors (shapes and labels as well as color)
- Text size option
- Volume and mute controls, plus on-screen captions for important sounds
- Reduced-motion option and no flashing effects
- Pause at any time

---

## 9. Build order

| Phase | What gets built | Why this order |
|---|---|---|
| **1** ✅ | 100m race prototype: Q/E, tap, and controller input, running animation, AI opponents | Make the core fun first |
| **2** | Other events: distance, hurdles, relay, long jump | Variety |
| **3A** ✅ | Season loop: setup, practice, meets, scoring, Regionals, State, endings, saving | Makes it fit the topic (built before Phase 2) |
| **3B** | Recruiting, budget, random challenge events | Rest of the topic's requirements |
| **4** | Challenge events, postseason, endings | Multiple outcomes |
| **5** | Title screen, How to Play, settings, accessibility, saving | UX points |
| **6** | Art and sound polish | Visual and audio points |
| **7** | **Demo mode** (skip to State) and tutorial | Only 7 minutes to present |

---

## 10. Presentation (7 min + 3 min Q&A)

- Live demo (use demo mode)
- Tools and why they were chosen
- UX design: user journey, design reasons, accessibility
- How strategic decisions lead to championship success (answers the topic question)
- What could be improved next
- Backup video and screenshots in case something breaks
- Up to 3 devices; no projector in the preliminary round; sound must come from the devices (no external speakers)

---

## 11. Open questions

- [x] Running reference: the "Courir" running GIF. No track or stadium references needed; Claude designs those.
- [x] Control upgrades approved (alternating only, rhythm sweet spot, different event mechanics)
- [ ] Season length: undecided for now ("doesn't matter yet")
- [ ] Teammates (1–3 people allowed)
- [ ] School name, mascot, team colors (fictional)
