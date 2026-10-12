// New season setup: coach name, school, mascot, team color, and your 4 athletes' names.
// Text boxes are real HTML inputs (Phaser "DOM elements") so typing works like any web form.

class SetupScene extends Phaser.Scene {
  constructor() {
    super('setup');
  }

  create() {
    UI.background(this);
    const card = UI.card(this, 1140, 650, { dim: false, y: 40 });
    const { cx, top, left } = card;
    this.color = TEAM_COLORS[0].value;

    UI.text(this, cx, top + 42, 'NEW SEASON', { fontFamily: FONT_MARKER, fontSize: '44px' }).setDepth(210);
    UI.text(this, cx, top + 86, 'Set up your program. Leave a box empty to use the example.', { fontSize: '22px', color: hex(C.inkSoft) }).setDepth(210);

    // Left column: you and your school
    const lx = left + 60;
    const label = (x, y, str) => UI.text(this, x, y, str, { fontFamily: FONT_MARKER, fontSize: '20px' }, 0).setDepth(210);
    label(lx, top + 140, 'Coach name');
    this.coach = this.input_(lx, top + 176, '', 'Rivera', 14);
    label(lx, top + 230, 'School name');
    this.school = this.input_(lx, top + 266, '', 'Westfield', 16);
    label(lx, top + 320, 'Mascot');
    this.mascot = this.input_(lx, top + 356, '', 'Eagles', 14);

    label(lx, top + 412, 'Team color');
    this.swatches = TEAM_COLORS.map((tc, i) => {
      const x = lx + 26 + i * 70, y = top + 460;
      const c = this.add.circle(x, y, 24, tc.value).setStrokeStyle(3, C.ink).setDepth(210)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.pickColor(i));
      return c;
    });
    this.colorName = UI.text(this, lx, top + 506, '', { fontSize: '20px', color: hex(C.inkSoft) }, 0).setDepth(210);
    this.pickColor(0);

    // Right column: athletes
    const rx = left + 610;
    label(rx, top + 140, 'Your athletes');
    UI.text(this, rx + 190, top + 140, '(type names, or use the dice)', { fontSize: '19px', color: hex(C.inkSoft) }, 0).setDepth(210);
    this.names = ROLES.map((r, i) => {
      const y = top + 190 + i * 76;
      UI.text(this, rx, y - 22, r.role === 'Freshman' ? 'Freshman (low stats, grows fastest)' : r.role === 'Star' ? 'Star sprinter' : 'Solid sprinter',
        { fontSize: '18px', color: hex(C.inkSoft) }, 0).setDepth(210);
      const input = this.input_(rx, y + 8, randomName(), '', 14, 300);
      UI.button(this, rx + 400, y + 8, 'Dice', () => { input.node.value = randomName(); }, { size: 18, depth: 210 });
      return input;
    });
    UI.button(this, rx + 160, top + 506, 'Random names for everyone', () => this.names.forEach(n => { n.node.value = randomName(); }),
      { size: 18, depth: 210 });

    UI.button(this, cx, top + 590, 'Start the season  →', () => this.start(), { size: 30, depth: 210 }).setSelected(true);
    UI.button(this, left + 110, top + 590, 'Back', () => this.scene.start('title'), { size: 20, depth: 210 });

    this.input.keyboard.on('keydown', e => {
      if (e.code === 'Enter') this.start();
    });
  }

  // A doodle-styled text box.
  input_(x, y, value, placeholder, maxLength, width = 380) {
    const css = `width:${width}px; font-size:24px; font-family:${FONT_HAND}; padding:4px 10px; border:2.5px solid #1d1d1f;`
      + ' background:#fffdf6; color:#1d1d1f; border-radius:2px; outline-color:#2f62d0;';
    const el = this.add.dom(x, y, 'input', css).setOrigin(0, 0.5);
    el.node.value = value;
    el.node.placeholder = placeholder ? 'e.g. ' + placeholder : '';
    el.node.maxLength = maxLength;
    el.node.dataset.example = placeholder;
    el.node.setAttribute('aria-label', placeholder || 'Athlete name');
    return el;
  }

  pickColor(i) {
    this.color = TEAM_COLORS[i].value;
    this.swatches.forEach((c, k) => c.setStrokeStyle(k === i ? 6 : 3, k === i ? C.yellow : C.ink).setScale(k === i ? 1.15 : 1));
    this.colorName.setText(TEAM_COLORS[i].name);
    Sfx.unlock();
  }

  start() {
    const val = el => el.node.value.trim() || el.node.dataset.example;
    Season.newSeason({
      coach: val(this.coach),
      school: val(this.school),
      mascot: val(this.mascot),
      color: this.color,
      names: this.names.map(n => n.node.value.trim() || randomName()),
    });
    Sfx.unlock();
    Sfx.click();
    this.scene.start('hub');
  }
}
