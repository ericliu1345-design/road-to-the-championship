// Title screen: the game's name, a runner sprinting across, the main menu and settings.

class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    UI.background(this);
    this.confirmNew = false;
    this.runnerX = -200;
    this.phase = 0;

    const g = this.add.graphics();
    g.fillStyle(C.yellow, 0.55).fillRect(W / 2 - 400, 132, 800, 64);
    UI.text(this, W / 2, 84, 'ROAD TO THE', { fontFamily: FONT_MARKER, fontSize: '44px' });
    UI.text(this, W / 2, 158, 'CHAMPIONSHIP', { fontFamily: FONT_MARKER, fontSize: '88px' });
    UI.text(this, W / 2, 228, 'Coach a high school track team all the way to the State Championship', { fontSize: '26px', color: hex(C.inkSoft) });

    // A runner sprints across the screen above the menu.
    Doodle.wobblyLine(g, 0, 356, W, 356, 3, C.ink, 5, 1.5);
    this.runnerG = this.add.graphics();

    const hasSave = Season.hasSave() && Season.load();
    const items = [];
    if (hasSave) {
      const s = Season.state;
      const where = s.ending ? 'season finished' : Season.meetInfo().type === 'weekly' ? `Week ${s.week}` : SCHEDULE_LABELS[s.week - 1].toLowerCase();
      items.push([`Continue: ${s.school} ${s.mascot} (${where})`, () => this.continueSeason()]);
    }
    items.push(['New season', () => this.newSeason()]);
    items.push(['Practice race', () => this.scene.start('race', { mode: 'quick' })]);
    items.push(['How to play', () => this.scene.start('howto', { back: 'title' })]);

    this.buttons = items.map(([label, fn], i) => UI.button(this, W / 2, 410 + i * 56, label, fn, { size: 26, width: 520 }));
    this.newBtn = this.buttons[hasSave ? 1 : 0];

    // Settings
    const sy = 410 + items.length * 56 + 34;
    UI.text(this, W / 2 - 330, sy, 'Press speed:', { fontFamily: FONT_MARKER, fontSize: '20px' });
    this.diffBtns = ['easy', 'normal', 'hard'].map((key, i) =>
      UI.button(this, W / 2 - 170 + i * 130, sy, DIFFICULTY[key].label, () => this.setDifficulty(key), { size: 20, width: 112 }));
    this.soundBtn = UI.button(this, W / 2 + 280, sy, Sfx.muted ? 'Sound: off' : 'Sound: on', () => this.toggleSound(), { size: 20, width: 140 });
    this.refreshDifficulty();

    UI.text(this, W / 2, H - 22, 'Arrow keys + Enter, mouse, touch, or a controller all work.   Made for FBLA Computer Game & Simulation Programming.',
      { fontSize: '18px', color: hex(C.inkSoft) });

    this.menu = UI.keyMenu(this, [...this.buttons, ...this.diffBtns, this.soundBtn]);
  }

  continueSeason() {
    const s = Season.state;
    if (s.ending) this.scene.start('ending');
    else if (s.meet) this.scene.start('meet');
    else this.scene.start('hub');
  }

  newSeason() {
    if (Season.hasSave() && !this.confirmNew) {
      this.confirmNew = true;
      this.newBtn.setText('Erase saved season? Press again');
      this.newBtn.redraw();
      return;
    }
    Season.clear();
    this.scene.start('setup');
  }

  setDifficulty(key) {
    savePref('difficulty', key);
    this.refreshDifficulty();
  }

  refreshDifficulty() {
    const d = getDifficulty();
    this.diffBtns.forEach((b, i) => b.setSelected(['easy', 'normal', 'hard'][i] === d));
  }

  toggleSound() {
    Sfx.setMuted(!Sfx.muted);
    this.soundBtn.setText(Sfx.muted ? 'Sound: off' : 'Sound: on');
    this.soundBtn.redraw();
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const speed = 10;
    this.runnerX += speed * 55 * dt * 0.6;
    if (this.runnerX > W + 300) this.runnerX = -200;
    this.phase = (this.phase + dt * (0.45 + speed * 0.24)) % 1;
    const g = this.runnerG;
    g.clear();
    const P = Doodle.pose(this.phase, 1, 44);
    const boil = reducedMotion ? 0 : Math.floor(time / 110);
    Doodle.streak(g, this.runnerX, 352, 352 + P.head.y * 1.1, 1, boil, C.yellow);
    Doodle.runner(g, this.runnerX, 352, P, { scale: 1.1, jersey: C.blue, wobble: reducedMotion ? 0 : 0.9, seed: boil });
  }
}
