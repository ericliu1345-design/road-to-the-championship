// The coach's clipboard: your roster, their stats, and this week's practice plan.

const HUB_ROW_Y = [250, 336, 422, 508];
const HUB_COLS = { name: 112, speed: 340, focus: 480, energy: 620, morale: 760, plan: 940 };

class HubScene extends Phaser.Scene {
  constructor() {
    super('hub');
  }

  create() {
    this.s = Season.state;
    this.row = 0;
    this.dyn = [];
    this.tutorialStep = -1;
    this.tutorialObjs = [];

    UI.background(this);
    this.drawClipboard();
    this.render();
    this.setupInput();
    if (!this.s.tutorial.hub) this.nextTutorialStep();
  }

  drawClipboard() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(C.ink, 0.15).fillRect(60, 24, 1180, 700);
    g.fillStyle(C.board, 1).fillRect(50, 14, 1180, 700);
    UI.wobblyRect(g, 50, 14, 1180, 700, 3, C.ink, 10);
    g.fillStyle(C.paper, 1).fillRect(80, 58, 1120, 646);
    UI.wobblyRect(g, 80, 58, 1120, 646, 2.5, C.ink, 20);
    // the metal clip
    g.fillStyle(C.metal, 1).fillRect(560, 2, 160, 58);
    g.lineStyle(3, C.ink).strokeRect(560, 2, 160, 58);
    g.fillStyle(C.paper, 1).fillRect(600, 14, 80, 14);
    g.lineStyle(2.5, C.ink).strokeRect(600, 14, 80, 14);
  }

  keep(obj) {
    this.dyn.push(obj);
    return obj;
  }

  text(x, y, str, style = {}, ox = 0, oy = 0.5) {
    return this.keep(UI.text(this, x, y, str, style, ox, oy).setDepth(5));
  }

  render() {
    this.dyn.forEach(o => o.destroy());
    this.dyn = [];
    const s = this.s;
    const info = Season.meetInfo();
    const g = this.keep(this.add.graphics().setDepth(2));

    // Header
    this.text(110, 92, `Coach ${s.coach}`, { fontFamily: FONT_MARKER, fontSize: '24px' });
    const weekTitle = info.type === 'weekly' ? `WEEK ${s.week} OF 5` : info.type === 'regionals' ? 'REGIONALS WEEK' : 'STATE WEEK';
    this.text(640, 94, weekTitle, { fontFamily: FONT_MARKER, fontSize: '36px' }, 0.5);
    this.text(640, 128, `Next meet: ${info.name}`, { fontSize: '22px', color: hex(C.inkSoft) }, 0.5);
    this.text(1170, 92, Season.teamName(), { fontFamily: FONT_MARKER, fontSize: '24px', color: hex(s.color) }, 1);
    const weeklyDone = s.results.filter(r => r.type === 'weekly');
    this.text(1170, 124, `Meets won: ${weeklyDone.filter(r => r.place === 1).length} of ${weeklyDone.length}`,
      { fontSize: '20px', color: hex(C.inkSoft) }, 1);

    // Season schedule strip
    const bw = 142, sx = 640 - (bw * 7) / 2;
    SCHEDULE_LABELS.forEach((label, i) => {
      const x = sx + i * bw + 4, y = 148;
      const res = s.results[i];
      const now = i === s.week - 1;
      if (res) g.fillStyle(res.place === 1 ? C.green : C.paper, res.place === 1 ? 0.45 : 1).fillRect(x, y, bw - 8, 44);
      if (now) g.fillStyle(C.yellow, 0.7).fillRect(x, y, bw - 8, 44);
      g.lineStyle(2, C.ink).strokeRect(x, y, bw - 8, 44);
      this.text(x + (bw - 8) / 2, y + 13, label, { fontSize: '17px', color: hex(C.inkSoft) }, 0.5);
      const status = res ? ordinal(res.place) : now ? 'NEXT' : '';
      this.text(x + (bw - 8) / 2, y + 31, status, { fontFamily: FONT_MARKER, fontSize: '16px' }, 0.5);
    });

    // Roster table
    const head = { fontSize: '19px', color: hex(C.inkSoft) };
    this.text(HUB_COLS.name, 206, 'ATHLETE', head);
    this.text(HUB_COLS.speed, 206, 'SPEED', head);
    this.text(HUB_COLS.focus, 206, 'FOCUS', head);
    this.text(HUB_COLS.energy, 206, 'ENERGY', head);
    this.text(HUB_COLS.morale, 206, 'MORALE', head);
    this.text(HUB_COLS.plan - 10, 206, "THIS WEEK'S PRACTICE", head);

    s.athletes.forEach((a, i) => this.renderRow(g, a, i));

    // Preview of the selected athlete's week
    const a = s.athletes[this.row];
    const p = Season.preview(a);
    const parts = [];
    if (p.speed !== a.speed) parts.push(`Speed ${a.speed}→${p.speed}`);
    if (p.focus !== a.focus) parts.push(`Focus ${a.focus}→${p.focus}`);
    parts.push(`Energy ${a.energy}→${p.energy}`);
    if (p.morale !== a.morale) parts.push(`Morale ${a.morale}→${p.morale}`);
    this.text(112, 580, `${a.name}, ${PRACTICE[a.plan].label}:  ${parts.join(',   ')}` +
      '   (before the meet; racing costs 8 Energy)', { fontSize: '21px' });
    if (p.overworked) this.text(112, 580 + 26, `Warning: ${a.name} is exhausted. Speed work now will hurt morale (−10).`, { fontSize: '21px', color: hex(C.red) });

    // Warnings, or a controls hint if there are none
    const warnings = Season.warnings().slice(0, p.overworked ? 1 : 2);
    const wy = p.overworked ? 632 : 612;
    if (warnings.length) {
      warnings.forEach((w, k) => this.text(112, wy + k * 24, '⚠ ' + w.text, { fontSize: '20px', color: hex(w.color) }));
    } else {
      this.text(112, wy, 'Keys: ↑ ↓ pick athlete   ← → or 1–4 pick practice   Enter start   H how to play',
        { fontSize: '20px', color: hex(C.inkSoft) });
    }

    // Bottom buttons
    const startLabel = info.type === 'weekly' ? `Start Week ${s.week}  →` : info.type === 'regionals' ? 'Go to Regionals  →' : 'Go to State  →';
    this.startBtn = this.keep(UI.button(this, 1030, 672, startLabel, () => this.startWeek(), { size: 28, depth: 6 }).setSelected(true));
    this.keep(UI.button(this, 200, 672, 'How to Play (H)', () => this.openHowTo(), { size: 20, depth: 6 }));
    this.keep(UI.button(this, 400, 672, 'Main menu', () => this.scene.start('title'), { size: 20, depth: 6 }));
  }

  renderRow(g, a, i) {
    const y = HUB_ROW_Y[i];
    const selected = i === this.row;
    if (selected) {
      g.fillStyle(C.yellow, 0.22).fillRect(96, y - 36, 1088, 80);
      g.fillStyle(C.ink, 1).fillTriangle(84, y - 10, 84, y + 10, 94, y);
    }
    g.lineStyle(1.5, C.inkSoft, 0.5).lineBetween(100, y + 44, 1180, y + 44);

    const p = Season.preview(a);
    const name = this.text(HUB_COLS.name, y - 12, a.name, { fontFamily: FONT_MARKER, fontSize: '23px' });
    name.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.selectRow(i));
    const best = a.best ? `   best ${a.best.toFixed(2)} s` : '';
    this.text(HUB_COLS.name, y + 16, a.role + best, { fontSize: '19px', color: hex(C.inkSoft) });

    const stat = (x, value, next, color) => {
      this.text(x, y - 12, String(value), { fontFamily: FONT_MARKER, fontSize: '22px' });
      if (next !== value) {
        this.text(x + 44, y - 12, `→ ${next}`, { fontSize: '20px', color: hex(next > value ? C.greenText : C.red) });
      }
      UI.bar(g, x, y + 10, 110, 11, value, color);
    };
    stat(HUB_COLS.speed, a.speed, p.speed, C.blue);
    stat(HUB_COLS.focus, a.focus, p.focus, C.purple);
    stat(HUB_COLS.energy, a.energy, p.energy, UI.energyColor(a.energy));

    UI.face(g, HUB_COLS.morale + 12, y - 12, 12, a.morale);
    this.text(HUB_COLS.morale + 32, y - 12, String(a.morale), { fontFamily: FONT_MARKER, fontSize: '22px' });
    if (p.morale !== a.morale) {
      this.text(HUB_COLS.morale + 72, y - 12, `→ ${p.morale}`, { fontSize: '20px', color: hex(p.morale > a.morale ? C.greenText : C.red) });
    }
    UI.bar(g, HUB_COLS.morale, y + 10, 110, 11, a.morale, UI.moraleColor(a.morale));

    PRACTICE_KEYS.forEach((key, k) => {
      const bx = HUB_COLS.plan + (k % 2) * 140, by = y - 16 + Math.floor(k / 2) * 36;
      const b = UI.button(this, bx + 64, by, `${k + 1} ${PRACTICE[key].short}`, () => this.setPlan(i, key),
        { size: 17, width: 128, padY: 3, depth: 6 });
      b.setSelected(a.plan === key);
      this.keep(b);
    });
  }

  selectRow(i) {
    if (this.tutorialStep >= 0) return;
    this.row = i;
    this.render();
  }

  setPlan(i, key) {
    if (this.tutorialStep >= 0) return;
    this.row = i;
    this.s.athletes[i].plan = key;
    Season.save();
    this.render();
  }

  cyclePlan(d) {
    const a = this.s.athletes[this.row];
    const k = (PRACTICE_KEYS.indexOf(a.plan) + d + PRACTICE_KEYS.length) % PRACTICE_KEYS.length;
    this.setPlan(this.row, PRACTICE_KEYS[k]);
    Sfx.click();
  }

  startWeek() {
    if (this.tutorialStep >= 0) return;
    Season.beginWeek();
    this.scene.start('meet');
  }

  openHowTo() {
    if (this.tutorialStep >= 0) return;
    this.scene.start('howto', { back: 'hub' });
  }

  setupInput() {
    this.input.keyboard.on('keydown', e => {
      if (e.repeat) return;
      Sfx.unlock();
      if (this.tutorialStep >= 0) {
        if (e.code === 'Enter' || e.code === 'Space') this.nextTutorialStep();
        return;
      }
      switch (e.code) {
        case 'ArrowUp': return this.selectRow((this.row + 3) % 4);
        case 'ArrowDown': return this.selectRow((this.row + 1) % 4);
        case 'ArrowLeft': return this.cyclePlan(-1);
        case 'ArrowRight': return this.cyclePlan(1);
        case 'Digit1': case 'Numpad1': return this.setPlan(this.row, 'speed');
        case 'Digit2': case 'Numpad2': return this.setPlan(this.row, 'focus');
        case 'Digit3': case 'Numpad3': return this.setPlan(this.row, 'rest');
        case 'Digit4': case 'Numpad4': return this.setPlan(this.row, 'bond');
        case 'Enter': return this.startWeek();
        case 'KeyH': return this.openHowTo();
      }
    });
    this.input.gamepad?.on('down', (pad, button) => {
      if (this.tutorialStep >= 0) {
        if (button.index === 0) this.nextTutorialStep();
        return;
      }
      switch (button.index) {
        case 12: return this.selectRow((this.row + 3) % 4);
        case 13: return this.selectRow((this.row + 1) % 4);
        case 14: return this.cyclePlan(-1);
        case 15: return this.cyclePlan(1);
        case 9: return this.startWeek();
        case 3: return this.openHowTo();
      }
    });
  }

  // ---------- Week 1 guided tips ----------

  nextTutorialStep() {
    const s = this.s;
    const steps = [
      { x: 330, y: 450, tx: 400, ty: 236, text: `Welcome, Coach ${s.coach}! This clipboard is your team. Speed = how fast they can run. Focus = how wide their green zone is in races.` },
      { x: 560, y: 450, tx: 700, ty: 236, text: 'Energy drops when athletes train hard, and tired athletes run slower. Happy athletes run a bit faster. At 0 morale, an athlete refuses to race.' },
      { x: 760, y: 450, tx: 1010, ty: 236, text: 'Pick a practice for each athlete. Speed work = faster but tiring. Focus drills = wider green zone. Rest = energy back. Bonding = morale for everyone.' },
      { x: 760, y: 470, tx: 1030, ty: 650, text: 'Then start the week. Each athlete races one heat, and places score team points (5, 3, 2, 1). Finish top 2 at Regionals to reach State!' },
    ];
    this.tutorialObjs.forEach(o => o.destroy());
    this.tutorialObjs = [];
    this.tutorialStep++;
    if (this.tutorialStep >= steps.length) {
      this.tutorialStep = -1;
      s.tutorial.hub = true;
      Season.save();
      return;
    }
    const st = steps[this.tutorialStep];
    const add = o => { this.tutorialObjs.push(o); return o; };
    add(this.add.rectangle(W / 2, H / 2, W, H, C.ink, 0.15).setDepth(50).setInteractive());
    const g = add(this.add.graphics().setDepth(51));
    Doodle.stroke(g, st.x, st.y, st.tx, st.ty, 4, C.ink);
    const ang = Math.atan2(st.ty - st.y, st.tx - st.x);
    Doodle.stroke(g, st.tx, st.ty, st.tx - 18 * Math.cos(ang - 0.5), st.ty - 18 * Math.sin(ang - 0.5), 4, C.ink);
    Doodle.stroke(g, st.tx, st.ty, st.tx - 18 * Math.cos(ang + 0.5), st.ty - 18 * Math.sin(ang + 0.5), 4, C.ink);
    g.fillStyle(C.ink, 0.2).fillRect(st.x - 200 + 8, st.y - 80 + 8, 400, 170);
    g.fillStyle(0xfff3a3, 1).fillRect(st.x - 200, st.y - 80, 400, 170);
    g.lineStyle(2, C.ink).strokeRect(st.x - 200, st.y - 80, 400, 170);
    add(UI.text(this, st.x, st.y - 10, st.text, { fontSize: '22px', wordWrap: { width: 370 }, align: 'center' }).setDepth(52));
    add(UI.text(this, st.x, st.y + 66, `Got it (Enter)   ${this.tutorialStep + 1}/${steps.length}`,
      { fontFamily: FONT_MARKER, fontSize: '18px', color: hex(C.blue) }).setDepth(52)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.nextTutorialStep()));
  }
}
