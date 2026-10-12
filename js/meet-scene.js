// A season meet: practice report → for each of the 4 heats: lineup card, race or simulate, heat result → meet results.
// Where we are is saved in Season.state.meet.stage, so a closed browser picks up at the same card.

class MeetScene extends Phaser.Scene {
  constructor() {
    super('meet');
  }

  create() {
    this.s = Season.state;
    this.m = this.s.meet;
    this.objs = [];
    this.menu = null;
    this.extraKeys = null;

    UI.background(this);
    const info = Season.meetInfo();
    UI.text(this, W / 2, 44, info.name.toUpperCase(), { fontFamily: FONT_MARKER, fontSize: '40px' });
    const sub = info.type === 'weekly' ? `Week ${this.s.week} of 5` : info.type === 'regionals' ? 'Top 2 teams go to State' : 'The final meet of the season';
    UI.text(this, W / 2, 84, sub, { fontSize: '22px', color: hex(C.inkSoft) });

    this.render();
  }

  keep(obj) {
    this.objs.push(obj);
    return obj;
  }

  text(x, y, str, style = {}, ox = 0.5) {
    return this.keep(UI.text(this, x, y, str, style, ox).setDepth(210));
  }

  clear() {
    this.objs.forEach(o => o.destroy());
    this.objs = [];
    this.menu?.destroy();
    this.menu = null;
    if (this.extraKeys) this.input.keyboard.off('keydown', this.extraKeys);
    this.extraKeys = null;
  }

  // Buttons along the bottom of a card, with arrow-key/controller navigation.
  buttons(y, list) {
    const gap = 330;
    const made = list.map(([label, fn], i) =>
      this.keep(UI.button(this, W / 2 + (i - (list.length - 1) / 2) * gap, y, label, fn, { size: 26, depth: 211 })));
    this.menu = UI.keyMenu(this, made);
  }

  card(w, h) {
    const card = UI.card(this, w, h, { dim: false, y: 196 });
    card.objs.forEach(o => this.keep(o));
    return card;
  }

  render() {
    this.clear();
    this.drawScoreboard();
    switch (this.m.stage) {
      case 'report': return this.showReport();
      case 'lineup': return this.showLineup();
      case 'heatResult': return this.showHeatResult();
      case 'final': return this.showFinal();
    }
  }

  drawScoreboard() {
    const schools = this.m.schools;
    const g = this.keep(this.add.graphics().setDepth(5));
    const bw = 290;
    schools.forEach((id, i) => {
      const x = W / 2 + (i - (schools.length - 1) / 2) * bw;
      g.fillStyle(id === 'you' ? C.yellow : C.paper, id === 'you' ? 0.5 : 1).fillRect(x - bw / 2 + 8, 108, bw - 16, 66);
      g.lineStyle(2.5, C.ink).strokeRect(x - bw / 2 + 8, 108, bw - 16, 66);
      const name = id === 'you' ? Season.teamName() : SCHOOLS[id].name;
      this.keep(UI.text(this, x, 126, name, { fontFamily: FONT_MARKER, fontSize: name.length > 20 ? '14px' : '17px', color: hex(Season.schoolColor(id)) }).setDepth(6));
      this.keep(UI.text(this, x, 155, `${this.m.points[id]} pts`, { fontFamily: FONT_MARKER, fontSize: '26px' }).setDepth(6));
    });
  }

  // ---------- Cards ----------

  showReport() {
    const info = Season.meetInfo();
    const { cx, top, left } = this.card(1080, 490);
    this.text(cx, top + 40, 'PRACTICE REPORT', { fontFamily: FONT_MARKER, fontSize: '38px' });
    this.m.report.forEach((r, i) => {
      const y = top + 96 + i * 44;
      this.text(left + 40, y, r.name, { fontFamily: FONT_MARKER, fontSize: '22px' }, 0);
      this.text(left + 250, y, r.plan, { fontSize: '22px', color: hex(C.inkSoft) }, 0);
      this.text(left + 420, y, r.text + (r.overworked ? '   (overworked!)' : ''),
        { fontSize: '22px', color: hex(r.overworked ? C.red : C.ink) }, 0);
    });

    let intro;
    if (info.type === 'weekly') intro = 'Today: you vs Ridgeview, Lakeside and Pine Valley. Each athlete runs one heat.\nPlaces score team points: 1st 5, 2nd 3, 3rd 2, 4th 1. Most points wins the meet.';
    else if (info.type === 'regionals') intro = 'This is it: only the top 2 teams go to State.\nBig meet, so you have to race every heat yourself!';
    else intro = 'Skibidi Verity High School is here. They haven\'t lost a meet all year.\nWin the most points to become State Champions!';
    this.text(cx, top + 340, intro, { fontSize: '23px', align: 'center', lineSpacing: 6 });

    this.buttons(top + 436, [['Start the meet  →', () => { this.m.stage = 'lineup'; Season.save(); this.render(); }]]);
  }

  showLineup() {
    const s = this.s;
    const heat = Season.currentHeat();
    const a = s.athletes[heat.athlete];
    const { cx, top, left, w } = this.card(1080, 490);
    this.text(cx, top + 40, `HEAT ${this.m.heatIndex + 1} OF 4`, { fontFamily: FONT_MARKER, fontSize: '40px' });

    const hl = this.keep(this.add.graphics().setDepth(209));
    hl.fillStyle(C.yellow, 0.45).fillRect(left + 24, top + 82, w - 48, 40);
    this.text(left + 40, top + 102, `Lane 3:  ${a.name}`, { fontFamily: FONT_MARKER, fontSize: '24px', color: hex(s.color) }, 0);
    this.text(left + w - 40, top + 102,
      `Speed ${a.speed}   Focus ${a.focus}   Energy ${a.energy}   Morale ${a.morale}   →   ${Season.raceSpeed(a).toFixed(2)} m/s today`,
      { fontSize: '22px' }, 1);

    heat.opponents.forEach((o, i) => {
      const y = top + 152 + i * 38;
      this.text(left + 40, y, `Lane ${[1, 2, 4][i]}:  ${o.name}`, { fontSize: '23px' }, 0);
      this.text(left + 300, y, SCHOOLS[o.school].name, { fontSize: '23px', color: hex(SCHOOLS[o.school].color) }, 0);
      this.text(left + w - 40, y, Season.formWords(o.form), { fontSize: '23px', color: hex(C.inkSoft) }, 1);
    });

    if (Season.refusesToRace()) {
      this.text(cx, top + 310, `${a.name} has 0 morale and refuses to race.\nThis heat is forfeited (0 points). Rest days and team bonding raise morale.`,
        { fontSize: '24px', color: hex(C.red), align: 'center', lineSpacing: 6 });
      this.buttons(top + 436, [['Continue  →', () => { Season.forfeitCurrentHeat(); this.render(); }]]);
      return;
    }

    const race = () => this.scene.start('race', {
      mode: 'meet',
      heat: Season.heatSetup(),
      onDone: result => Season.recordHeat(result),
      returnTo: 'meet',
    });
    const sim = () => { Season.simulateCurrentHeat(); this.render(); };

    if (Season.canSimulate()) {
      this.text(cx, top + 300, `Race it yourself, or Simulate the heat. Simulating runs at ${Math.round(simEfficiency(a) * 100)}% of ${a.name}'s\npotential (more Focus = higher), so a good race beats simulating.   2 false starts = disqualified.`,
        { fontSize: '22px', align: 'center', lineSpacing: 6, color: hex(C.inkSoft) });
      this.buttons(top + 436, [['Race it!  (Space)', race], ['Simulate  (S)', sim]]);
      this.extraKeys = e => { if (e.code === 'KeyS' && !e.repeat) sim(); };
      this.input.keyboard.on('keydown', this.extraKeys);
    } else {
      this.text(cx, top + 300, 'Big meet: you have to race this one yourself!\nReminder: 1st false start = warning, 2nd = disqualified.',
        { fontSize: '23px', align: 'center', lineSpacing: 6, color: hex(C.red) });
      this.buttons(top + 436, [['Race it!  (Space)', race]]);
    }

    if (!s.tutorial.meet) this.showMeetTip();
  }

  showMeetTip() {
    const tip = [];
    const add = o => { tip.push(this.keep(o)); return o; };
    const g = add(this.add.graphics().setDepth(250));
    // Sits over the gray explanation text (it says the same thing in more detail) until dismissed.
    const x = W / 2, y = 512;
    g.fillStyle(C.ink, 0.2).fillRect(x - 390 + 8, y - 58 + 8, 780, 116);
    g.fillStyle(0xfff3a3, 1).fillRect(x - 390, y - 58, 780, 116);
    g.lineStyle(2, C.ink).strokeRect(x - 390, y - 58, 780, 116);
    add(UI.text(this, x, y - 14, 'Each heat: Race it yourself, or Simulate it (weekly meets only).\nRegionals and State must be raced. Every race costs the athlete 8 Energy.',
      { fontSize: '21px', align: 'center', lineSpacing: 4 }).setDepth(251));
    const close = () => {
      this.s.tutorial.meet = true;
      Season.save();
      tip.forEach(o => o.destroy());
    };
    add(UI.button(this, x, y + 38, 'Got it', close, { size: 18, depth: 251, boxed: false }));
  }

  showHeatResult() {
    const s = this.s;
    const heat = this.m.heats[this.m.heatIndex];
    const r = heat.result;
    const a = s.athletes[heat.athlete];
    const { cx, top, left, w } = this.card(1080, 490);
    const how = r.simulated ? '  (simulated)' : r.dq ? '  (disqualified)' : r.forfeit ? '  (forfeited)' : '';
    this.text(cx, top + 40, `HEAT ${this.m.heatIndex + 1} RESULT${how}`, { fontFamily: FONT_MARKER, fontSize: '36px' });

    const nameOf = id => (id === 'you' ? a.name : heat.opponents.find(o => o.school === id).name);
    const rows = [...r.order];
    if (r.dq || r.forfeit) rows.push('you');
    rows.forEach((id, i) => {
      const y = top + 100 + i * 42;
      const out = id === 'you' && (r.dq || r.forfeit);
      if (id === 'you') {
        const hl = this.keep(this.add.graphics().setDepth(209));
        hl.fillStyle(C.yellow, 0.45).fillRect(left + 24, y - 19, w - 48, 38);
      }
      this.text(left + 40, y, out ? '–' : ordinal(i + 1), { fontFamily: FONT_MARKER, fontSize: '22px' }, 0);
      this.text(left + 110, y, nameOf(id), { fontSize: '24px' }, 0);
      this.text(left + 380, y, Season.schoolName(id), { fontSize: '24px', color: hex(Season.schoolColor(id)) }, 0);
      this.text(left + w - 160, y, out ? (r.dq ? 'DQ' : 'did not race') : r.times[id].toFixed(2) + ' s', { fontFamily: FONT_MARKER, fontSize: '22px' }, 1);
      this.text(left + w - 40, y, `+${r.points[id] || 0}`, { fontFamily: FONT_MARKER, fontSize: '22px', color: hex(C.greenText) }, 1);
    });

    if (r.moraleDelta) {
      const sign = r.moraleDelta > 0 ? '+' : '';
      this.text(cx, top + 300, `${a.name}'s morale ${sign}${r.moraleDelta}  (now ${a.morale})`,
        { fontSize: '24px', color: hex(r.moraleDelta > 0 ? C.greenText : C.red) });
    }

    const last = this.m.heatIndex >= this.m.heats.length - 1;
    this.buttons(top + 436, [[last ? 'See meet results  →' : 'Next heat  →', () => { Season.nextHeat(); this.render(); }]]);
  }

  showFinal() {
    const sum = this.m.summary;
    const info = Season.meetInfo();
    const { cx, top, left, w } = this.card(1080, 490);
    const title = sum.place === 1 ? 'YOU WON THE MEET!' : `YOU FINISHED ${ordinal(sum.place).toUpperCase()}`;
    this.text(cx, top + 40, title, { fontFamily: FONT_MARKER, fontSize: '38px', color: hex(sum.place === 1 ? C.greenText : C.ink) });

    sum.standings.forEach((row, i) => {
      const y = top + 100 + i * 40;
      if (row.id === 'you') {
        const hl = this.keep(this.add.graphics().setDepth(209));
        hl.fillStyle(C.yellow, 0.45).fillRect(left + 200, y - 18, w - 400, 36);
      }
      this.text(left + 220, y, ordinal(i + 1), { fontFamily: FONT_MARKER, fontSize: '22px' }, 0);
      this.text(left + 300, y, Season.schoolName(row.id), { fontSize: '24px', color: hex(Season.schoolColor(row.id)) }, 0);
      this.text(left + w - 220, y, `${row.points} pts`, { fontFamily: FONT_MARKER, fontSize: '22px' }, 1);
    });

    const lines = [sum.won ? 'Winning the meet: +4 morale for everyone.' : 'Losing the meet: −3 morale for everyone.'];
    if (info.type === 'regionals') {
      lines.push(sum.qualified ? `Top 2! ${Season.teamName()} is going to STATE!` : 'Only the top 2 teams go to State. Your season ends here.');
    }
    if (sum.ending === 'fellapart') lines.push('Three athletes have hit 0 morale...');
    this.text(cx, top + 300, lines.join('\n'), { fontSize: '24px', align: 'center', lineSpacing: 8 });

    const label = sum.ending ? 'See how your season ended  →' : 'Back to the clipboard  →';
    this.buttons(top + 436, [[label, () => {
      const ending = Season.advance();
      this.scene.start(ending ? 'ending' : 'hub');
    }]]);
  }
}
