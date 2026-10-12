// Season mode rules: your team, weekly practice, meets, scoring, and the road to State.
// This file has no drawing in it; the screens (hub, meet, race, ending) call these functions.

const SCHOOLS = {
  ridgeview: {
    name: 'Ridgeview Hawks', short: 'RIDGEVIEW', color: C.red, style: 'fast starters',
    accel: 1.3, fadeAt: 60, fade: 0.06, reactionRange: [0.13, 0.17],
    athletes: [['M. Torres', 9.85], ['K. Brooks', 9.6], ['A. Patel', 9.42], ['S. Novak', 9.18]],
  },
  lakeside: {
    name: 'Lakeside Otters', short: 'LAKESIDE', color: C.teal, style: 'strong finishers',
    accel: 0.85, fadeAt: 55, fade: -0.05, reactionRange: [0.17, 0.22],
    athletes: [['J. Okafor', 9.6], ['R. Silva', 9.5], ['T. Nguyen', 9.34], ['L. Grant', 9.12]],
  },
  pinevalley: {
    name: 'Pine Valley Pumas', short: 'PINE VALLEY', color: C.purple, style: 'steady runners',
    accel: 1.0, fadeAt: 50, fade: 0, reactionRange: [0.15, 0.2],
    athletes: [['D. Kim', 9.75], ['E. Walsh', 9.52], ['C. Diaz', 9.36], ['B. Moore', 9.14]],
  },
  // The surprise powerhouse that only shows up at State.
  skibidi: {
    name: 'Skibidi Verity High School', short: 'SKIBIDI VERITY', color: C.gold, style: 'the powerhouse',
    accel: 1.15, fadeAt: 70, fade: 0.02, reactionRange: [0.13, 0.17],
    athletes: [['V. Sterling', 10.2], ['Q. Adeyemi', 10.0], ['R. Castillo', 9.82], ['Z. Holt', 9.66]],
  },
};
const RIVAL_KEYS = ['ridgeview', 'lakeside', 'pinevalley'];

const MEETS = [
  { name: 'Season Opener', type: 'weekly' },
  { name: 'Lakeside Classic', type: 'weekly' },
  { name: 'Pine Valley Invitational', type: 'weekly' },
  { name: 'Ridgeview Twilight Meet', type: 'weekly' },
  { name: 'Conference Showdown', type: 'weekly' },
  { name: 'Regional Championship', type: 'regionals' },
  { name: 'State Championship', type: 'state' },
];
const SCHEDULE_LABELS = ['WK 1', 'WK 2', 'WK 3', 'WK 4', 'WK 5', 'REGIONALS', 'STATE'];

const HEAT_POINTS = [5, 3, 2, 1];

// A simulated heat runs at 94–98% of the athlete's potential (more Focus = steadier): like an average race,
// so racing well yourself still does better.
const simEfficiency = a => 0.94 + a.focus * 0.0004;

const PRACTICE = {
  speed: { label: 'Speed work', short: 'Speed', key: '1' },
  focus: { label: 'Focus drills', short: 'Focus', key: '2' },
  rest: { label: 'Rest day', short: 'Rest', key: '3' },
  bond: { label: 'Team bonding', short: 'Bond', key: '4' },
};
const PRACTICE_KEYS = ['speed', 'focus', 'rest', 'bond'];

const WEEKLY_RECOVERY = 12;           // energy every athlete gets back each week
const RACE_ENERGY_COST = 8;

const ROLES = [
  { role: 'Star', speed: 74, focus: 55, energy: 85, morale: 70, growth: 0.8 },
  { role: 'Solid', speed: 64, focus: 62, energy: 85, morale: 65, growth: 1.0 },
  { role: 'Solid', speed: 60, focus: 50, energy: 85, morale: 65, growth: 1.0 },
  { role: 'Freshman', speed: 46, focus: 35, energy: 90, morale: 75, growth: 1.6 },
];

const FIRST_NAMES = ['Jordan', 'Riley', 'Avery', 'Casey', 'Morgan', 'Taylor', 'Jamie', 'Quinn', 'Rowan', 'Skyler',
  'Devon', 'Reese', 'Emerson', 'Kai', 'Logan', 'Parker', 'Sam', 'Alex', 'Drew', 'Jesse', 'Marley', 'Hayden'];
const LAST_NAMES = ['Lee', 'Rivera', 'Johnson', 'Chen', 'Okoro', 'Garcia', 'Smith', 'Nakamura', 'Brown', 'Lopez',
  'Wright', 'Evans', 'Haddad', 'Murphy', 'Kowalski', 'Reyes', 'Bennett', 'Foster', 'Ibrahim', 'Park'];
const randomName = () => Phaser.Utils.Array.GetRandom(FIRST_NAMES) + ' ' + Phaser.Utils.Array.GetRandom(LAST_NAMES);

const ENDINGS = {
  perfect: {
    title: 'PERFECT SEASON!', color: C.gold,
    text: 'Undefeated. You won every weekly meet, Regionals AND State. Even Skibidi Verity High School couldn\'t stop you. People will talk about this team for years.',
  },
  champions: {
    title: 'STATE CHAMPIONS!', color: C.greenText,
    text: 'You beat Skibidi Verity High School and brought the state trophy home. Smart training and good timing paid off.',
  },
  podium: {
    title: 'STATE PODIUM', color: C.blue,
    text: '2nd in the whole state: a silver-medal team! Not the title this year, but a huge season. With your freshman still growing, next year looks bright.',
  },
  fellshort: {
    title: 'MADE IT TO STATE', color: C.ink,
    text: 'Getting to State is a big achievement, but the competition was too fast this time. Fresher legs and higher morale could make the difference.',
  },
  regionals: {
    title: 'SEASON OVER AT REGIONALS', color: C.orange,
    text: 'Only the top 2 teams at Regionals go to State. Tired or unhappy athletes cost points. Try resting your team before the big meets.',
  },
  fellapart: {
    title: 'THE TEAM FELL APART', color: C.red,
    text: 'Three athletes lost all motivation and stopped showing up. Overtraining and losing streaks hurt morale. Rest days and team bonding keep a team together.',
  },
};

const SAVE_KEY = 'rtc-season';

const Season = {
  state: null,

  // ---------- Saving ----------

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch (e) { /* no storage: play without saving */ }
  },
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && s.version === 1) { this.state = s; return true; }
    } catch (e) { /* ignore a broken save */ }
    return false;
  },
  hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  },
  clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nothing to clear */ }
  },

  // ---------- Setup ----------

  newSeason({ coach, school, mascot, color, names }) {
    this.state = {
      version: 1,
      coach, school, mascot, color,
      week: 1,
      athletes: ROLES.map((r, i) => ({
        name: names[i],
        role: r.role,
        speed: r.speed, focus: r.focus, energy: r.energy, morale: r.morale, growth: r.growth,
        startSpeed: r.speed, startFocus: r.focus,
        plan: 'focus',
        best: null,
        heatWins: 0,
      })),
      results: [],
      meet: null,
      stateQualifiers: null,
      ending: null,
      tutorial: { hub: false, meet: false },
      practiceCounts: { speed: 0, focus: 0, rest: 0, bond: 0 },
    };
    this.save();
  },

  teamName() {
    return `${this.state.school} ${this.state.mascot}`;
  },
  meetInfo(week = this.state.week) {
    return MEETS[week - 1];
  },

  // ---------- How stats turn into race speed ----------

  topSpeed(a) { return 8.4 + a.speed * 0.024; },                       // Speed 50 = 9.6 m/s, Speed 100 = 10.8 m/s
  energyMult(a) { return a.energy >= 50 ? 1 : 1 - (50 - a.energy) / 50 * 0.10; },   // Energy 0 = −10%
  moraleMult(a) {
    return a.morale >= 50 ? 1 + (a.morale - 50) / 50 * 0.01 : 1 - (50 - a.morale) / 50 * 0.04;   // +1% happy, −4% miserable
  },
  raceSpeed(a) { return this.topSpeed(a) * this.energyMult(a) * this.moraleMult(a); },

  // ---------- Practice ----------

  // What one week of a practice does to an athlete (before the weekly energy recovery).
  practiceEffect(a, plan) {
    // Gains shrink as a stat gets close to 100, and the freshman grows fastest.
    const gain = (base, stat) => Math.max(1, Math.round(base * a.growth * (1 - stat / 160)));
    switch (plan) {
      case 'speed': return { speed: gain(8, a.speed), energy: -32, morale: a.energy < 30 ? -10 : -2 };
      case 'focus': return { focus: gain(7, a.focus), energy: -18, morale: 0 };
      case 'rest': return { energy: 35, morale: 4 };
      case 'bond': return { energy: -6, morale: 14, teamMorale: 5 };
    }
    return {};
  },

  // Predicted numbers after practice, for the clipboard preview (ignores teammates' bonding).
  preview(a, plan = a.plan) {
    const e = this.practiceEffect(a, plan);
    return {
      speed: clamp(a.speed + (e.speed || 0), 1, 100),
      focus: clamp(a.focus + (e.focus || 0), 1, 100),
      energy: clamp(a.energy + WEEKLY_RECOVERY + (e.energy || 0), 0, 100),
      morale: clamp(a.morale + (e.morale || 0), 0, 100),
      overworked: plan === 'speed' && a.energy < 30,
    };
  },

  // Apply everyone's practice, then set up this week's meet.
  beginWeek() {
    const s = this.state;
    const report = [];
    const before = s.athletes.map(a => ({ ...a }));

    for (const a of s.athletes) {
      const e = this.practiceEffect(a, a.plan);
      a.speed = clamp(a.speed + (e.speed || 0), 1, 100);
      a.focus = clamp(a.focus + (e.focus || 0), 1, 100);
      a.energy = clamp(a.energy + WEEKLY_RECOVERY + (e.energy || 0), 0, 100);
      a.morale = clamp(a.morale + (e.morale || 0), 0, 100);
      s.practiceCounts[a.plan]++;
    }
    // Team bonding lifts everyone else a little too.
    for (const b of s.athletes.filter(a => a.plan === 'bond')) {
      for (const a of s.athletes) if (a !== b) a.morale = clamp(a.morale + 5, 0, 100);
    }

    s.athletes.forEach((a, i) => {
      const b = before[i];
      const changes = [];
      if (a.speed !== b.speed) changes.push(`Speed ${b.speed}→${a.speed}`);
      if (a.focus !== b.focus) changes.push(`Focus ${b.focus}→${a.focus}`);
      changes.push(`Energy ${b.energy}→${a.energy}`);
      if (a.morale !== b.morale) changes.push(`Morale ${b.morale}→${a.morale}`);
      report.push({ name: a.name, plan: PRACTICE[a.plan].label, text: changes.join(',  '), overworked: a.plan === 'speed' && b.energy < 30 });
    });

    s.meet = this.createMeet();
    s.meet.report = report;
    this.save();
  },

  // ---------- Meets ----------

  rivalSpeed(schoolKey, index) {
    const s = this.state;
    const type = this.meetInfo().type;
    const base = SCHOOLS[schoolKey].athletes[index][1];
    if (schoolKey === 'skibidi') return base;
    // Rivals improve a little every week, and peak slightly for State.
    const peak = type === 'state' ? 1.005 : 1;
    return base * (1 + 0.003 * (s.week - 1)) * peak;
  },

  createMeet() {
    const s = this.state;
    const type = this.meetInfo().type;
    const rivals = type === 'state' ? ['skibidi', ...s.stateQualifiers] : RIVAL_KEYS;
    const schools = ['you', ...rivals];
    return {
      week: s.week,
      schools,
      stage: 'report',
      heatIndex: 0,
      points: Object.fromEntries(schools.map(k => [k, 0])),
      // Your athlete in heat i races the i-th athlete from each other school.
      heats: s.athletes.map((a, i) => ({
        athlete: i,
        opponents: rivals.map(k => ({ school: k, name: SCHOOLS[k].athletes[i][0], top: this.rivalSpeed(k, i), form: randomForm() })),
        result: null,
      })),
      summary: null,
    };
  },

  currentHeat() {
    const m = this.state.meet;
    return m.heats[m.heatIndex];
  },

  // Everything the race screen needs to run the current heat.
  heatSetup() {
    const s = this.state, m = s.meet;
    const heat = this.currentHeat();
    const a = s.athletes[heat.athlete];
    const otherLanes = [0, 1, 3];
    const lanes = heat.opponents.map((o, j) => {
      const sc = SCHOOLS[o.school];
      return {
        id: o.school, lane: otherLanes[j], name: o.name, school: sc.name, short: sc.short, color: sc.color,
        top: o.top, form: o.form, accel: sc.accel, fadeAt: sc.fadeAt, fade: sc.fade, reactionRange: sc.reactionRange,
      };
    });
    lanes.push({
      id: 'you', lane: 2, isPlayer: true, name: a.name, school: this.teamName(), short: s.school.toUpperCase(),
      color: s.color, top: this.raceSpeed(a), accel: 1.0,
    });
    return {
      lanes,
      zone: zoneFor(getDifficulty(), a.focus),
      athlete: { ...a },
      heatNumber: m.heatIndex + 1,
      meetName: this.meetInfo().name,
      energyPct: Math.round((this.energyMult(a) - 1) * 1000) / 10,
      moralePct: Math.round((this.moraleMult(a) - 1) * 1000) / 10,
    };
  },

  formWords(form) {
    if (form > 1.015) return 'looks sharp today';
    if (form < 0.985) return 'seems tired';
    return 'looks ready';
  },

  canSimulate() {
    return this.meetInfo().type === 'weekly';
  },

  // Your athlete won't race at zero morale.
  refusesToRace() {
    return this.state.athletes[this.currentHeat().athlete].morale <= 0;
  },

  simulateCurrentHeat() {
    const setup = this.heatSetup();
    return this.recordHeat({ times: simulateHeat(setup.lanes, simEfficiency(setup.athlete)), simulated: true });
  },

  forfeitCurrentHeat() {
    const setup = this.heatSetup();
    return this.recordHeat({ times: simulateHeat(setup.lanes.filter(l => !l.isPlayer), 1), forfeit: true });
  },

  // Score a finished heat. result: { times: { schoolId: seconds }, dq, forfeit, simulated }
  recordHeat(result) {
    const s = this.state, m = s.meet;
    const heat = this.currentHeat();
    const a = s.athletes[heat.athlete];
    const out = result.dq || result.forfeit;

    const order = Object.keys(result.times)
      .filter(id => !(id === 'you' && out))
      .sort((x, y) => result.times[x] - result.times[y]);
    const points = {};
    order.forEach((id, k) => {
      points[id] = HEAT_POINTS[k];
      m.points[id] += HEAT_POINTS[k];
    });

    const place = out ? 0 : order.indexOf('you') + 1;
    let moraleDelta = 0;
    if (result.dq) moraleDelta = -6;
    else if (!result.forfeit) moraleDelta = [0, 10, 3, -4, -8][place];
    a.morale = clamp(a.morale + moraleDelta, 0, 100);
    if (!result.forfeit) a.energy = clamp(a.energy - RACE_ENERGY_COST, 0, 100);
    if (!out) {
      const t = result.times.you;
      if (a.best === null || t < a.best) a.best = t;
      if (place === 1) a.heatWins++;
    }

    heat.result = { times: result.times, order, points, place, dq: !!result.dq, forfeit: !!result.forfeit, simulated: !!result.simulated, moraleDelta };
    m.stage = 'heatResult';
    this.save();
    return heat.result;
  },

  nextHeat() {
    const m = this.state.meet;
    m.heatIndex++;
    if (m.heatIndex < m.heats.length) m.stage = 'lineup';
    else this.finishMeet();
    this.save();
  },

  finishMeet() {
    const s = this.state, m = s.meet;
    const info = this.meetInfo();
    const best = id => Math.min(...m.heats.map(h => (h.result.times[id] && h.result.order.includes(id) ? h.result.times[id] : Infinity)));
    const standings = m.schools
      .map(id => ({ id, points: m.points[id], best: best(id) }))
      .sort((x, y) => y.points - x.points || x.best - y.best);
    const place = standings.findIndex(r => r.id === 'you') + 1;
    const won = place === 1;
    for (const a of s.athletes) a.morale = clamp(a.morale + (won ? 4 : -3), 0, 100);

    s.results.push({ week: s.week, type: info.type, place, standings: standings.map(r => ({ id: r.id, points: r.points })) });

    let ending = null;
    let qualified = false;
    if (info.type === 'regionals') {
      if (place <= 2) {
        qualified = true;
        // The other top-2 team, plus the next best team as an at-large qualifier by time.
        s.stateQualifiers = standings.filter(r => r.id !== 'you').slice(0, 2).map(r => r.id);
      } else {
        ending = 'regionals';
      }
    } else if (info.type === 'state') {
      const perfect = s.results.every(r => r.place === 1);
      ending = place === 1 ? (perfect ? 'perfect' : 'champions') : place === 2 ? 'podium' : 'fellshort';
    }
    if (!ending && s.athletes.filter(a => a.morale <= 0).length >= 3) ending = 'fellapart';

    m.summary = { standings, place, won, ending, qualified };
    m.stage = 'final';
  },

  // After the meet results card: go to the next week, or end the season.
  advance() {
    const s = this.state;
    const ending = s.meet.summary.ending;
    if (ending) {
      s.ending = ending;
    } else {
      s.week++;
      s.meet = null;
    }
    this.save();
    return ending;
  },

  // ---------- Helpers for the screens ----------

  schoolName(id) {
    return id === 'you' ? this.teamName() : SCHOOLS[id].name;
  },
  schoolColor(id) {
    return id === 'you' ? this.state.color : SCHOOLS[id].color;
  },

  warnings() {
    const s = this.state;
    const list = [];
    const low = s.athletes.filter(a => a.morale <= 20);
    if (low.length >= 2) list.push({ text: `The team is losing faith in you, Coach ${s.coach}! If 3 athletes hit 0 morale, the team falls apart.`, color: C.red });
    for (const a of s.athletes) {
      if (a.morale <= 0) list.push({ text: `${a.name} has 0 morale and will refuse to race this week.`, color: C.red });
      else if (a.morale <= 20) list.push({ text: `${a.name} is losing motivation (morale ${a.morale}).`, color: C.orange });
      if (a.energy < 30) list.push({ text: `${a.name} is exhausted (energy ${a.energy}). A rest day would help.`, color: C.orange });
    }
    return list;
  },
};
