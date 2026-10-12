// The 100m race. Used two ways:
//   'quick' mode: a practice race from the title screen (race again as often as you like)
//   'meet' mode:  one heat of a season meet; the result goes back to the meet screen
// Alternate left/right to run. Each athlete has a "sweet spot" press rhythm (the green zone);
// pressing slower than it loses speed, pressing faster than it wastes energy.

const PPM = 55;                                 // pixels per meter of track
const START_X = 360;
const FINISH_X = START_X + 100 * PPM;
const WORLD_W = FINISH_X + 1100;                // room to slow down after the finish
const LANE_TOP = 312, LANE_H = 98, LANES = 4;
const TRACK_BOTTOM = LANE_TOP + LANES * LANE_H;
const RUNNER_SCALE = 0.95;
const METER_MAX = 14;                           // presses per second at the right end of the rhythm meter

// Keyboard keys that count as left/right steps, and the key labels to show for each pair.
const SIDE_KEYS = {
  KeyQ: { side: 'L', caps: ['Q', 'E'] }, KeyE: { side: 'R', caps: ['Q', 'E'] },
  KeyA: { side: 'L', caps: ['A', 'D'] }, KeyD: { side: 'R', caps: ['A', 'D'] },
  ArrowLeft: { side: 'L', caps: ['←', '→'] }, ArrowRight: { side: 'R', caps: ['←', '→'] },
};

// Lanes for a practice race: you against each rival school's best sprinter.
function quickRaceLanes() {
  const rival = (key, lane) => {
    const sc = SCHOOLS[key];
    return {
      id: key, lane, name: sc.athletes[0][0], school: sc.name, short: sc.short, color: sc.color,
      top: sc.athletes[0][1], accel: sc.accel, fadeAt: sc.fadeAt, fade: sc.fade, reactionRange: sc.reactionRange,
    };
  };
  return [
    rival('ridgeview', 0), rival('lakeside', 1), rival('pinevalley', 3),
    { id: 'you', lane: 2, isPlayer: true, name: 'You', school: 'Your School', short: 'YOU', color: C.blue, top: 10.2, accel: 1.0 },
  ];
}

class RaceScene extends Phaser.Scene {
  constructor() {
    super('race');
  }

  init(data) {
    this.mode = data && data.mode === 'meet' ? 'meet' : 'quick';
    this.heat = data && data.heat;
    this.onDone = data && data.onDone;
    this.returnTo = (data && data.returnTo) || 'title';
  }

  create() {
    this.difficulty = getDifficulty();
    this.lanes = this.mode === 'meet' ? this.heat.lanes : quickRaceLanes();
    this.zone = this.mode === 'meet' ? this.heat.zone : zoneFor(this.difficulty);
    this.caps = ['Q', 'E'];
    this.isTouch = false;
    this.cardObjs = [];
    this.boil = 0;
    this.displayCadence = 0;
    this.falseStarts = 0;
    this.done = false;

    this.paper = UI.background(this);
    this.buildStands();
    this.buildTrack();
    this.buildRunners();
    this.buildHud();
    this.setupInput();
    this.events.once('shutdown', () => this.input.keyboard.clearCaptures());

    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.resetRace();
  }

  // ---------- Building the scene ----------

  // Draws a large static picture once and saves it as images in 1024px-wide pieces,
  // so the computer doesn't redraw thousands of lines every frame.
  bake(key, y, width, height, scrollFactor, depth, draw) {
    const CHUNK = 1024;
    for (let x0 = 0, i = 0; x0 < width; x0 += CHUNK, i++) {
      const w = Math.min(CHUNK, width - x0);
      const texKey = `${key}-${i}`;
      if (!this.textures.exists(texKey)) {
        const g = this.make.graphics({ add: false });
        g.translateCanvas(-x0, -y);
        draw(g);
        g.generateTexture(texKey, w, height);
        g.destroy();
      }
      this.add.image(x0, y, texKey).setOrigin(0).setScrollFactor(scrollFactor, 1).setDepth(depth);
    }
  }

  // The crowd moves slower than the track (scroll factor 0.6), which makes it feel far away.
  buildStands() {
    const width = Math.ceil((WORLD_W - W) * 0.6 + W);
    const shirts = [C.blue, C.red, C.teal, C.purple, C.yellow, C.inkSoft];
    const bannerXs = [];
    for (let x = 520; x < width - 200; x += 1150) bannerXs.push(x);

    this.bake('stands', 96, width, 200, 0.6, 1, g => {
      bannerXs.forEach((x, i) => {
        g.fillStyle(C.yellow, 0.45);
        g.fillRect(x - 130, 102, 260, 34);
        Doodle.wobblyLine(g, x - 130, 102, x + 130, 102, 2.5, C.ink, 900 + i, 1);
        Doodle.wobblyLine(g, x - 130, 136, x + 130, 136, 2.5, C.ink, 950 + i, 1);
        Doodle.stroke(g, x - 130, 102, x - 130, 136, 2.5, C.ink);
        Doodle.stroke(g, x + 130, 102, x + 130, 136, 2.5, C.ink);
      });
      [176, 226, 276].forEach((benchY, row) => {
        for (let x = 10 + row * 13, k = 0; x < width; x += 24 + Doodle.rand(row * 1000 + k) * 14, k++) {
          const seed = row * 5000 + k;
          if (Doodle.rand(seed) < 0.12) continue;                     // empty seat
          const headY = benchY - 30 - Doodle.rand(seed + 1) * 4;
          g.fillStyle(shirts[Math.floor(Doodle.rand(seed + 2) * shirts.length)], 0.5);
          g.fillEllipse(x, benchY - 8, 20, 26);
          g.lineStyle(2.5, C.ink);
          g.strokeCircle(x, headY, 8);
          if (Doodle.rand(seed + 3) < 0.25) {                         // cheering arms
            Doodle.stroke(g, x - 6, benchY - 16, x - 13, headY - 14, 2.5, C.ink);
            Doodle.stroke(g, x + 6, benchY - 16, x + 13, headY - 14, 2.5, C.ink);
          }
        }
        Doodle.wobblyLine(g, 0, benchY, width, benchY + 1, 3, C.ink, 300 + row * 77, 1.5);
      });
    });

    const words = this.mode === 'meet'
      ? [this.heat.meetName.toUpperCase(), 'ROAD TO STATE', 'GO FAST!', `HEAT ${this.heat.heatNumber}`]
      : ['PRACTICE RACE', 'ROAD TO STATE', 'GO FAST!', '100m DASH'];
    bannerXs.forEach((x, i) => {
      UI.text(this, x, 119, words[i % words.length], { fontFamily: FONT_MARKER, fontSize: '20px' })
        .setScrollFactor(0.6, 1).setDepth(2);
    });
  }

  buildTrack() {
    this.bake('track', 280, WORLD_W, 440, 1, 3, g => {
      // Front wall of the stands, where the distance signs hang
      g.fillStyle(C.paper, 1);
      g.fillRect(0, 286, WORLD_W, LANE_TOP - 286);
      Doodle.wobblyLine(g, 0, 286, WORLD_W, 286, 3, C.ink, 11, 1.2);

      // Track surface: a light rust wash with scribbled hatching
      g.fillStyle(C.track, 0.2);
      g.fillRect(0, LANE_TOP, WORLD_W, TRACK_BOTTOM - LANE_TOP);
      g.lineStyle(2, C.track, 0.28);
      const h = TRACK_BOTTOM - LANE_TOP;
      for (let x = -h; x < WORLD_W; x += 38) g.lineBetween(x, TRACK_BOTTOM, x + h * 0.5, LANE_TOP);

      for (let i = 0; i <= LANES; i++) {
        const y = LANE_TOP + i * LANE_H;
        Doodle.wobblyLine(g, 0, y, WORLD_W, y, 3, C.ink, 40 + i * 13, 1.6);
      }

      Doodle.wobblyLine(g, START_X, LANE_TOP, START_X, TRACK_BOTTOM, 6, C.ink, 7, 1.5);

      // Tick marks every 10 m
      for (let m = 10; m < 100; m += 10) {
        const x = START_X + m * PPM;
        for (let i = 0; i <= LANES; i++) {
          const y = LANE_TOP + i * LANE_H;
          Doodle.stroke(g, x, y - 7, x, y + 7, 3, C.ink);
        }
      }

      // Checkered finish line
      const sq = 14;
      g.fillStyle(C.ink, 1);
      for (let y = LANE_TOP, r = 0; y < TRACK_BOTTOM; y += sq, r++) {
        for (let c = 0; c < 2; c++) {
          if ((r + c) % 2 === 0) g.fillRect(FINISH_X - sq + c * sq, y, sq, Math.min(sq, TRACK_BOTTOM - y));
        }
      }
      Doodle.wobblyLine(g, FINISH_X - sq, LANE_TOP, FINISH_X - sq, TRACK_BOTTOM, 2.5, C.ink, 21, 1);
      Doodle.wobblyLine(g, FINISH_X + sq, LANE_TOP, FINISH_X + sq, TRACK_BOTTOM, 2.5, C.ink, 22, 1);
    });

    // Finish banner on two poles (drawn in front of the crowd)
    const fb = this.add.graphics().setDepth(4);
    fb.fillStyle(C.paper, 1);
    fb.fillRect(FINISH_X - 110, 214, 220, 46);
    Doodle.stroke(fb, FINISH_X - 110, 214, FINISH_X - 110, LANE_TOP, 5, C.ink);
    Doodle.stroke(fb, FINISH_X + 110, 214, FINISH_X + 110, LANE_TOP, 5, C.ink);
    Doodle.wobblyLine(fb, FINISH_X - 110, 214, FINISH_X + 110, 214, 4, C.ink, 31, 1.5);
    Doodle.wobblyLine(fb, FINISH_X - 110, 260, FINISH_X + 110, 260, 4, C.ink, 32, 1.5);
    UI.text(this, FINISH_X, 238, 'FINISH', { fontFamily: FONT_MARKER, fontSize: '32px', color: hex(C.red) }).setDepth(5);

    for (let m = 10; m <= 100; m += 10) {
      UI.text(this, START_X + m * PPM, 299, m + 'm', { fontSize: '20px' }).setDepth(5);
    }
    UI.text(this, START_X, 299, 'START', { fontSize: '20px' }).setDepth(5);
    for (let i = 0; i < LANES; i++) {
      UI.text(this, START_X - 90, LANE_TOP + i * LANE_H + LANE_H / 2, String(i + 1), { fontFamily: FONT_MARKER, fontSize: '34px' })
        .setAlpha(0.55).setDepth(5);
    }
  }

  buildRunners() {
    this.runners = this.lanes.map(lane => {
      const r = { ...lane, groundY: LANE_TOP + (lane.lane + 1) * LANE_H - 14 };
      r.g = this.add.graphics().setDepth(10 + lane.lane);
      const labelText = !r.isPlayer ? r.short : this.mode === 'meet' ? r.name.split(' ')[0].toUpperCase() : 'YOU';
      r.label = UI.text(this, 0, 0, labelText, {
        fontFamily: r.isPlayer ? FONT_MARKER : FONT_HAND,
        fontSize: r.isPlayer ? '22px' : '17px',
        color: hex(r.color),
        stroke: hex(C.paper),
        strokeThickness: 5,
      }, 0.5, 1).setDepth(30);
      return r;
    });
    this.player = this.runners.find(r => r.isPlayer);
    this.rivals = this.runners.filter(r => !r.isPlayer);
  }

  hudText(x, y, str, style = {}) {
    return UI.text(this, x, y, str, { fontSize: '20px', color: hex(C.inkSoft), ...style }, 0, 0)
      .setScrollFactor(0).setDepth(102);
  }

  buildHud() {
    const bg = this.add.graphics().setScrollFactor(0).setDepth(100);
    bg.fillStyle(C.paper, 0.96);
    bg.fillRect(0, 0, W, 108);
    Doodle.wobblyLine(bg, 0, 108, W, 108, 3, C.ink, 77, 1.2);

    this.hudG = this.add.graphics().setScrollFactor(0).setDepth(101);

    this.hudText(24, 8, 'TIME');
    this.timeText = this.hudText(24, 28, '0.00', { fontFamily: FONT_MARKER, fontSize: '44px', color: hex(C.ink) });
    this.hudText(196, 8, 'SPEED');
    this.speedText = this.hudText(196, 36, '0.0 m/s', { fontFamily: FONT_MARKER, fontSize: '30px', color: hex(C.ink) });

    this.hudText(380, 8, 'RACE PROGRESS');
    this.hudText(380, 76, '0').setOrigin(0.5, 0);
    this.hudText(590, 76, '50').setOrigin(0.5, 0);
    this.hudText(800, 76, '100 m').setOrigin(0.5, 0);

    this.hudText(840, 8, 'STRIDE RHYTHM (presses per second)');
    this.statusText = this.hudText(840, 70, '', { fontSize: '26px', color: hex(C.ink) });
    this.capTexts = [1086, 1138].map(x =>
      this.hudText(x, 87, '', { fontFamily: FONT_MARKER, fontSize: '18px', color: hex(C.ink) }).setOrigin(0.5));

    const button = (y, label, onPress) => this.hudText(1180, y, label, { fontFamily: FONT_MARKER, fontSize: '20px', color: hex(C.ink) })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onPress);
    this.pauseBtn = button(12, 'Pause', () => this.togglePause());
    this.soundBtn = button(56, Sfx.muted ? 'Unmute' : 'Mute', () => this.toggleMute());

    this.bigText = UI.text(this, W / 2, 205, '', {
      fontFamily: FONT_MARKER, fontSize: '84px', stroke: hex(C.paper), strokeThickness: 12,
    }).setScrollFactor(0).setDepth(150).setVisible(false);
  }

  showTouchZones() {
    const g = this.add.graphics().setScrollFactor(0).setDepth(90);
    Doodle.footprint(g, 170, 600, false, C.ink, 0.12);
    Doodle.footprint(g, W - 170, 600, true, C.ink, 0.12);
    for (let y = 130; y < H; y += 28) g.fillStyle(C.ink, 0.12).fillRect(W / 2 - 1.5, y, 3, 14);
    this.hudText(170, 668, 'TAP LEFT', { fontFamily: FONT_MARKER }).setOrigin(0.5).setAlpha(0.5).setDepth(90);
    this.hudText(W - 170, 668, 'TAP RIGHT', { fontFamily: FONT_MARKER }).setOrigin(0.5).setAlpha(0.5).setDepth(90);
  }

  // ---------- Input ----------

  setupInput() {
    this.input.mouse?.disableContextMenu();
    this.input.keyboard.addCapture('SPACE,LEFT,RIGHT,UP,DOWN');

    this.input.keyboard.on('keydown', e => {
      if (e.repeat) return;                 // holding a key down doesn't count as running
      Sfx.unlock();
      const sideKey = SIDE_KEYS[e.code];
      if (sideKey) return this.onSide(sideKey.side, sideKey.caps);
      switch (e.code) {
        case 'Space': case 'Enter': case 'KeyW': case 'ArrowUp': return this.onAction();
        case 'KeyP': case 'Escape': return this.togglePause();
        case 'KeyM': return this.toggleMute();
        case 'KeyR': return this.backToReady();
        case 'KeyB': return this.toMainMenu();
        case 'Digit1': case 'Numpad1': return this.setDifficulty('easy');
        case 'Digit2': case 'Numpad2': return this.setDifficulty('normal');
        case 'Digit3': case 'Numpad3': return this.setDifficulty('hard');
      }
    });

    this.input.on('pointerdown', (pointer, over) => {
      Sfx.unlock();
      if (pointer.wasTouch && !this.isTouch) {
        this.isTouch = true;
        this.showTouchZones();
      }
      if (over.length) return;              // a button was pressed; it handles itself
      if (this.paused) return this.togglePause();
      if (['ready', 'results', 'falsestart', 'falsewarn', 'dq'].includes(this.state)) return this.onAction();
      this.onSide(pointer.x < W / 2 ? 'L' : 'R', ['L', 'R']);
    });

    if (this.input.gamepad) {
      this.input.gamepad.on('down', (pad, button) => {
        Sfx.unlock();
        const i = button.index;
        if (i === 4 || i === 6 || i === 14) return this.onSide('L', ['L1', 'R1']);
        if (i === 5 || i === 7 || i === 15) return this.onSide('R', ['L1', 'R1']);
        if (i === 0) return this.onAction();
        if (i === 9) return this.togglePause();
        if (i === 8) return this.backToReady();
      });
    }
  }

  onSide(side, caps) {
    this.caps = caps;
    if (this.paused) return;
    if (this.state === 'set') return this.falseStart();
    if (this.state === 'race') this.stride(side);
  }

  onAction() {
    if (this.paused) return this.togglePause();
    switch (this.state) {
      case 'ready':
        return this.startRace();
      case 'results':
        if (this.mode === 'meet') return this.finishHeat();
        this.resetRace();
        return this.startRace();
      case 'falsestart':
      case 'falsewarn':
        this.resetRace();
        return this.startRace();
      case 'dq':
        return this.finishHeat();
    }
  }

  stride(side) {
    const now = performance.now();
    if (this.reaction === null) this.reaction = (now - this.gunAt) / 1000;

    if (side === this.lastSide) {
      // Same side twice: stumble
      this.player.v *= 0.9;
      this.stumbles++;
      Sfx.stumble();
      this.floatText('Stumble! Alternate sides', C.red);
      return;
    }

    const interval = this.lastStrideAt < 0 ? Infinity : now - this.lastStrideAt;
    const instant = 1000 / Math.max(interval, 45);
    this.cadence = interval > 900 ? 3 : this.cadence * 0.55 + instant * 0.45;
    this.lastStrideAt = now;
    this.lastSide = side;
    Sfx.step();
  }

  togglePause() {
    if (!['marks', 'set', 'race', 'finishing'].includes(this.state)) return;
    this.paused = !this.paused;
    this.pauseBtn.setText(this.paused ? 'Resume' : 'Pause');
    if (this.paused) {
      Sfx.crowd(0.02);
      this.showPauseCard();
    } else {
      this.clearCard();
      this.lastStrideAt = -1;               // restart the rhythm after a pause
    }
  }

  toggleMute() {
    Sfx.setMuted(!Sfx.muted);
    this.soundBtn.setText(Sfx.muted ? 'Unmute' : 'Mute');
  }

  setDifficulty(key) {
    if (this.mode !== 'quick' || this.state !== 'ready' || this.difficulty === key) return;
    this.difficulty = key;
    this.zone = zoneFor(key);
    savePref('difficulty', key);
    Sfx.click();
    this.showReadyCard();
  }

  // Quick mode only: back to the start card to change settings.
  backToReady() {
    if (this.mode === 'quick') this.resetRace();
  }

  toMainMenu() {
    if (this.mode === 'quick' && ['ready', 'results', 'falsestart'].includes(this.state)) this.scene.start('title');
  }

  // ---------- Race flow ----------

  resetRace() {
    this.state = 'ready';
    this.stateT = 0;
    this.paused = false;
    this.pauseBtn.setText('Pause');
    this.raceTime = 0;
    this.gunAt = 0;
    this.cadence = 0;
    this.effCadence = 0;
    this.lastStrideAt = -1;
    this.lastSide = null;
    this.stumbles = 0;
    this.zoneTime = 0;
    this.slowTime = 0;
    this.fastTime = 0;
    this.topSpeed = 0;
    this.reaction = null;
    this.setDur = Phaser.Math.FloatBetween(1.2, 2.4);
    for (const r of this.runners) {
      r.dist = 0;
      r.v = 0;
      r.phase = Math.random();
      r.started = false;
      r.finished = false;
      r.finishTime = null;
      if (!r.isPlayer) {
        if (this.mode === 'quick') r.form = null;   // practice races: new random form every time
        prepareRival(r);
      }
    }
    this.bigText.setVisible(false);
    Sfx.crowd(0.03);
    this.showReadyCard();
  }

  startRace() {
    this.clearCard();
    Sfx.click();
    Sfx.crowd(0.05);
    this.state = 'marks';
    this.stateT = 0;
    this.showBig('On your marks…', C.ink);
  }

  falseStart() {
    Sfx.whistle();
    this.bigText.setVisible(false);
    if (this.mode === 'meet' && this.falseStarts === 0) {
      this.falseStarts = 1;
      this.state = 'falsewarn';
      this.showFalseStartCard(true);
    } else if (this.mode === 'meet') {
      this.state = 'dq';
      this.showDqCard();
    } else {
      this.state = 'falsestart';
      this.showFalseStartCard(false);
    }
  }

  fireGun() {
    this.state = 'race';
    this.stateT = 0;
    this.raceTime = 0;
    this.gunAt = performance.now();
    Sfx.gun();
    this.showBig('BANG!', C.red);
  }

  finishRunner(r) {
    r.finished = true;
    r.finishTime = this.raceTime - (r.dist - 100) / Math.max(r.v, 0.1);
    if (r.isPlayer) {
      this.state = 'finishing';
      this.finishedAt = this.raceTime;
      Sfx.cheer();
      this.showBig('FINISH!', C.ink);
    }
  }

  // Meet mode: hand the result back to the season and return to the meet screen.
  finishHeat() {
    if (this.done) return;
    this.done = true;
    let result;
    if (this.state === 'dq') {
      result = { times: simulateHeat(this.lanes.filter(l => !l.isPlayer), 1), dq: true };
    } else {
      result = { times: Object.fromEntries(this.runners.map(r => [r.id, r.finishTime])) };
    }
    if (this.onDone) this.onDone(result);
    this.scene.start(this.returnTo);
  }

  // ---------- Every frame ----------

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const now = performance.now();
    this.boil = reducedMotion ? 0 : Math.floor(now / 110);   // hand-drawn lines "boil" about 9 times a second

    if (!this.paused) {
      this.stateT += dt;
      if (this.state === 'marks' && this.stateT > 1.6) {
        this.state = 'set';
        this.stateT = 0;
        this.showBig('Set…', C.ink);
      } else if (this.state === 'set' && this.stateT > this.setDur) {
        this.fireGun();
      }
      if (this.state === 'race' || this.state === 'finishing') this.simulate(dt, now);
    }

    const cam = this.cameras.main;
    cam.scrollX = clamp(this.hipX(this.player) - W * 0.32, 0, WORLD_W - W);
    this.paper.tilePositionX = cam.scrollX;

    this.drawRunners();
    this.drawHud();
  }

  hipX(r) {
    return START_X - 20 + r.dist * PPM;
  }

  // Legs cycle faster as speed goes up.
  animate(r, dt) {
    if (r.v > 0.05) {
      r.started = true;
      r.phase = (r.phase + dt * (0.45 + r.v * 0.24)) % 1;
    }
  }

  simulate(dt, now) {
    this.raceTime += dt;
    if (this.bigText.text === 'BANG!' && this.raceTime > 0.8) this.bigText.setVisible(false);

    const p = this.player;

    // Current rhythm: if the next press is late, the rhythm drops until it comes.
    let cad = 0;
    if (this.lastStrideAt >= 0) {
      const since = now - this.lastStrideAt;
      cad = this.cadence;
      if (since > 1000 / Math.max(cad, 0.5)) cad = Math.min(cad, 1000 / since);
      if (since > 900) cad = 0;
    }
    this.effCadence = cad;

    if (!p.finished && this.reaction !== null) {
      if (cad < this.zone.lo) this.slowTime += dt;
      else if (cad > this.zone.hi) this.fastTime += dt;
      else this.zoneTime += dt;
    }

    // In a season heat, p.top already includes the athlete's Speed, Energy and Morale.
    moveRunner(p, p.finished ? 0 : p.top * strideEfficiency(cad, this.zone), dt);
    this.animate(p, dt);
    this.topSpeed = Math.max(this.topSpeed, p.v);

    for (const r of this.rivals) {
      moveRunner(r, rivalTarget(r, this.raceTime, dt), dt);
      this.animate(r, dt);
    }

    for (const r of this.runners) if (!r.finished && r.dist >= 100) this.finishRunner(r);

    if (this.state === 'race') Sfx.crowd(0.06 + 0.2 * Math.pow(p.dist / 100, 2));
    if (this.state === 'race' && this.raceTime > 30) return this.showResults();   // never finished: end the race anyway

    if (this.state === 'finishing') {
      const since = this.raceTime - this.finishedAt;
      if ((this.runners.every(r => r.finished) && since > 1.4) || since > 5) this.showResults();
    }
  }

  drawRunners() {
    for (const r of this.runners) {
      const g = r.g;
      g.clear();
      const x = this.hipX(r);
      let run, lean, phase = r.phase;
      if (this.state === 'ready' || this.state === 'marks') {
        run = 0.1; lean = 8; phase = 0;                       // standing behind the line
      } else if (!r.started) {
        run = 0.55; lean = 38; phase = 0.08;                  // "Set" crouch
      } else {
        run = clamp(r.v / 2.5, 0.12, 1);
        lean = 14 + 30 * clamp(r.v / r.top, 0, 1);            // leans further forward at top speed, like the GIF
      }
      const P = Doodle.pose(phase, run, lean);
      const headY = r.groundY + P.head.y * RUNNER_SCALE;

      if (r.isPlayer) {
        // The yellow streak only appears near top speed, and grows as you get faster.
        const k = clamp((r.v / r.top - 0.84) / 0.12, 0, 1);
        if (k > 0) Doodle.streak(g, x, r.groundY, headY, k, this.boil, C.yellow);
      }
      Doodle.runner(g, x, r.groundY, P, {
        scale: RUNNER_SCALE,
        jersey: r.color,
        wobble: reducedMotion ? 0 : 0.9,
        seed: this.boil * 7 + r.lane * 131,
      });
      r.label.setPosition(x + P.head.x * RUNNER_SCALE, headY - 16);
    }
  }

  drawHud() {
    const g = this.hudG;
    g.clear();
    const p = this.player;
    const zone = this.zone;
    const racing = this.state === 'race' || this.state === 'finishing';

    const shownTime = p.finished ? p.finishTime : this.raceTime;
    this.timeText.setText((racing || this.state === 'results' ? shownTime : 0).toFixed(2));
    this.speedText.setText(p.v.toFixed(1) + ' m/s');

    // Race progress: a dot for each runner
    Doodle.stroke(g, 380, 62, 800, 62, 3, C.ink);
    [380, 590, 800].forEach(x => Doodle.stroke(g, x, 55, x, 69, 3, C.ink));
    for (const r of [...this.rivals, p]) {
      const x = 380 + clamp(r.dist / 100, 0, 1) * 420;
      const y = 48 + r.lane * 9;
      if (r.isPlayer) {
        g.fillStyle(C.ink).fillCircle(x, y, 9);
        g.fillStyle(r.color).fillCircle(x, y, 6.5);
      } else {
        g.fillStyle(r.color).fillCircle(x, y, 6);
      }
    }

    // Stride rhythm meter with the green zone and a needle
    this.displayCadence += (this.effCadence - this.displayCadence) * 0.25;
    const mx = 840, my = 36, mw = 300, mh = 24;
    const toX = c => mx + clamp(c, 0, METER_MAX) / METER_MAX * mw;
    g.fillStyle(C.green, 0.55).fillRect(toX(zone.lo), my, toX(zone.hi) - toX(zone.lo), mh);
    g.lineStyle(2.5, C.ink).strokeRect(mx, my, mw, mh);
    for (let c = 2; c < METER_MAX; c += 2) Doodle.stroke(g, toX(c), my + mh - 6, toX(c), my + mh, 1.5, C.ink);
    const nx = toX(this.displayCadence);
    g.fillStyle(C.ink).fillTriangle(nx - 8, my - 12, nx + 8, my - 12, nx, my - 1);
    Doodle.stroke(g, nx, my - 2, nx, my + mh + 2, 3, C.ink);

    let status = '', color = C.ink;
    if (this.state === 'race' && !p.finished) {
      const c = this.effCadence;
      if (c < 0.3) { status = 'Go! Go! Go!'; color = C.red; }
      else if (c < zone.lo) { status = 'Too slow!'; color = C.orange; }
      else if (c <= zone.hi) { status = 'In the zone!'; color = C.greenText; }
      else { status = 'Too fast!'; color = C.orange; }
    } else if (this.state === 'set') {
      status = 'Wait for it…';
    }
    if (this.statusText.text !== status) this.statusText.setText(status);
    this.statusText.setColor(hex(color));

    // Key hints: the key you should press next is highlighted
    const next = this.state === 'race' && this.lastSide ? (this.lastSide === 'L' ? 1 : 0) : -1;
    [1086, 1138].forEach((x, i) => {
      g.fillStyle(i === next ? C.yellow : C.paper, 1).fillRect(x - 23, 72, 46, 30);
      g.lineStyle(2.5, C.ink).strokeRect(x - 23, 72, 46, 30);
      if (this.capTexts[i].text !== this.caps[i]) this.capTexts[i].setText(this.caps[i]);
    });
  }

  // ---------- Messages and cards ----------

  showBig(msg, color) {
    this.bigText.setText(msg).setColor(hex(color)).setVisible(true).setScale(1);
    if (!reducedMotion) {
      this.tweens.add({ targets: this.bigText, scale: { from: 1.35, to: 1 }, duration: 250, ease: 'Back.Out' });
    }
  }

  floatText(msg, color) {
    const p = this.player;
    const t = UI.text(this, this.hipX(p) + 20, p.groundY - 120, msg, {
      fontFamily: FONT_MARKER, fontSize: '22px', color: hex(color), stroke: hex(C.paper), strokeThickness: 6,
    }).setDepth(40);
    this.tweens.add({
      targets: t, alpha: 0, y: reducedMotion ? t.y : t.y - 40, duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  clearCard() {
    this.cardObjs.forEach(o => o.destroy());
    this.cardObjs = [];
  }

  cardAdd(obj, layer = 1) {
    obj.setScrollFactor(0).setDepth(200 + layer);
    this.cardObjs.push(obj);
    return obj;
  }

  drawCard(w, h) {
    this.clearCard();
    const card = UI.card(this, w, h);
    card.objs.forEach(o => this.cardObjs.push(o));
    return card;
  }

  cardText(x, y, str, style = {}, originX = 0.5) {
    return this.cardAdd(UI.text(this, x, y, str, { fontSize: '26px', align: 'center', ...style }, originX));
  }

  cardButton(x, y, str, selected, onPress) {
    const b = UI.button(this, x, y, str, onPress, { depth: 203, boxed: false, size: 24 });
    b.setSelected(selected);
    this.cardObjs.push(b);
    return b;
  }

  highlightRow(cx, y) {
    const hl = this.cardAdd(this.add.graphics(), 1);
    hl.fillStyle(C.yellow, 0.55).fillRect(cx - 390, y - 18, 780, 36);
  }

  showReadyCard() {
    if (this.mode === 'meet') return this.showHeatReadyCard();
    const { cx, top } = this.drawCard(880, 570);
    this.cardText(cx, top + 50, 'PRACTICE RACE', { fontFamily: FONT_MARKER, fontSize: '58px' });
    this.cardText(cx, top + 106, 'Alternate LEFT and RIGHT to run. Keep the needle in the green zone.');

    const rows = [
      ['Keyboard', 'Q / E   (or A / D, or ← / →)'],
      ['Touch', 'tap the left and right sides of the screen'],
      ['Controller', 'L1 / R1   (LB / RB on Xbox)'],
    ];
    rows.forEach(([label, how], i) => {
      this.cardText(cx - 330, top + 162 + i * 40, label, { fontFamily: FONT_MARKER, fontSize: '22px' }, 0);
      this.cardText(cx - 160, top + 162 + i * 40, how, {}, 0);
    });
    this.cardText(cx, top + 298, 'Same side twice = stumble.   Moving during "Set" = false start.', { color: hex(C.red) });

    this.cardText(cx - 250, top + 360, 'Press speed:', { fontFamily: FONT_MARKER, fontSize: '22px' });
    ['easy', 'normal', 'hard'].forEach((key, i) => {
      this.cardButton(cx - 80 + i * 150, top + 360, `${i + 1}  ${DIFFICULTY[key].label}`, key === this.difficulty,
        () => this.setDifficulty(key));
    });
    this.cardText(cx, top + 400, `Green zone: ${this.zone.lo}–${this.zone.hi} presses per second`, { fontSize: '22px', color: hex(C.inkSoft) });

    this.cardText(cx, top + 465, 'Press SPACE, tap, or press A to start', { fontFamily: FONT_MARKER, fontSize: '30px' });
    this.cardText(cx, top + 510, 'P / Esc: pause     M: sound on/off     R: back to this card', { fontSize: '21px', color: hex(C.inkSoft) });
    this.cardButton(cx, top + 545, 'Main menu (B)', false, () => this.scene.start('title'));
  }

  // Meet mode: who you're running, how they feel today, and who they're up against.
  showHeatReadyCard() {
    const h = this.heat, a = h.athlete;
    const { cx, top } = this.drawCard(920, 610);
    this.cardText(cx, top + 44, `HEAT ${h.heatNumber} OF 4`, { fontFamily: FONT_MARKER, fontSize: '50px' });
    this.cardText(cx, top + 90, h.meetName, { fontSize: '24px', color: hex(C.inkSoft) });

    const sign = n => (n > 0 ? '+' : '') + n + '%';
    this.highlightRow(cx, top + 140);
    this.cardText(cx - 380, top + 140, `Lane 3:  ${a.name}`, { fontFamily: FONT_MARKER, fontSize: '24px', color: hex(this.player.color) }, 0);
    this.cardText(cx + 380, top + 140, `Speed ${a.speed}   Focus ${a.focus}`, { fontSize: '24px' }, 1);
    this.cardText(cx, top + 180,
      `Top speed today ${this.player.top.toFixed(2)} m/s   (Energy ${a.energy}: ${sign(h.energyPct)},  Morale ${a.morale}: ${sign(h.moralePct)})`,
      { fontSize: '22px' });
    this.cardText(cx, top + 212, `Green zone: ${this.zone.lo}–${this.zone.hi} presses per second (more Focus = wider zone)`,
      { fontSize: '22px', color: hex(C.inkSoft) });

    this.cardText(cx - 380, top + 262, 'Up against:', { fontFamily: FONT_MARKER, fontSize: '22px' }, 0);
    [...this.rivals].sort((x, y) => x.lane - y.lane).forEach((r, i) => {
      const y = top + 300 + i * 36;
      this.cardText(cx - 380, y, `Lane ${r.lane + 1}:  ${r.name}`, { fontSize: '24px' }, 0);
      this.cardText(cx - 120, y, r.school, { fontSize: '24px', color: hex(r.color) }, 0);
      this.cardText(cx + 380, y, Season.formWords(r.form), { fontSize: '24px', color: hex(C.inkSoft) }, 1);
    });

    const warn = this.falseStarts > 0
      ? 'You already have a false start warning. One more and you\'re disqualified!'
      : 'Wait for the gun! 1st false start = warning, 2nd = disqualified.';
    this.cardText(cx, top + 432, warn, { fontSize: '24px', color: hex(C.red) });
    this.cardText(cx, top + 486, 'Press SPACE, tap, or press A to start', { fontFamily: FONT_MARKER, fontSize: '30px' });
    this.cardText(cx, top + 534, 'Run: Q / E,  A / D,  ← / →,  tap left / right,  or L1 / R1        P: pause   M: sound',
      { fontSize: '20px', color: hex(C.inkSoft) });
  }

  showFalseStartCard(warningOnly) {
    const { cx, top } = this.drawCard(780, 330);
    this.cardText(cx, top + 60, warningOnly ? 'FALSE START: WARNING' : 'FALSE START!',
      { fontFamily: FONT_MARKER, fontSize: '50px', color: hex(C.red) });
    const msg = warningOnly
      ? 'You moved before the gun. This is your one warning.\nOne more false start in this heat and you\'re disqualified.'
      : 'You moved before the gun.\nIn high school track, a false start can get you disqualified.';
    this.cardText(cx, top + 148, msg, { lineSpacing: 6 });
    this.cardText(cx, top + 255, 'Press SPACE, tap, or press A to try again', { fontFamily: FONT_MARKER, fontSize: '28px' });
  }

  showDqCard() {
    const { cx, top } = this.drawCard(780, 330);
    this.cardText(cx, top + 60, 'DISQUALIFIED', { fontFamily: FONT_MARKER, fontSize: '56px', color: hex(C.red) });
    this.cardText(cx, top + 148, `Second false start. ${this.player.name} scores 0 points in this heat.\nThe other runners finish without you.`,
      { lineSpacing: 6 });
    this.cardText(cx, top + 255, 'Press SPACE, tap, or press A to continue', { fontFamily: FONT_MARKER, fontSize: '28px' });
  }

  showPauseCard() {
    const { cx, top } = this.drawCard(640, 260);
    this.cardText(cx, top + 60, 'Paused', { fontFamily: FONT_MARKER, fontSize: '58px' });
    this.cardText(cx, top + 140, 'Press P / Esc, tap, or press Start to keep racing');
    if (this.mode === 'quick') this.cardText(cx, top + 195, 'R: back to the start card', { fontSize: '22px', color: hex(C.inkSoft) });
  }

  showResults() {
    this.state = 'results';
    this.bigText.setVisible(false);
    Sfx.crowd(0.05);

    // Runners still on the track get a projected time.
    for (const r of this.runners) {
      if (!r.finished) r.finishTime = this.raceTime + (100 - r.dist) / Math.max(r.v, 1);
    }
    const order = [...this.runners].sort((a, b) => a.finishTime - b.finishTime);
    const place = order.indexOf(this.player) + 1;
    const myTime = this.player.finishTime;
    const meet = this.mode === 'meet';

    const { cx, top } = this.drawCard(880, 580);
    this.cardText(cx, top + 50, place === 1 ? '1st place!' : `${ordinal(place)} place`,
      { fontFamily: FONT_MARKER, fontSize: '58px', color: hex(place === 1 ? C.greenText : C.ink) });

    if (meet) {
      this.cardText(cx, top + 104, `${this.player.name}: ${myTime.toFixed(2)} s   ·   +${HEAT_POINTS[place - 1]} team points`);
    } else {
      const pbKey = 'pb-' + this.difficulty;
      const oldPb = parseFloat(loadPref(pbKey, ''));
      const newPb = !(oldPb <= myTime);
      if (newPb) savePref(pbKey, myTime.toFixed(2));
      this.cardText(cx, top + 104, `Your time: ${myTime.toFixed(2)} s   ·   ` +
        (newPb ? 'New personal best!' : `Personal best: ${oldPb.toFixed(2)} s`) + `   (${DIFFICULTY[this.difficulty].label})`);
    }

    order.forEach((r, i) => {
      const y = top + 160 + i * 42;
      if (r.isPlayer) this.highlightRow(cx, y);
      this.cardText(cx - 370, y, ordinal(i + 1), { fontFamily: FONT_MARKER, fontSize: '22px' }, 0).setDepth(202);
      this.cardText(cx - 300, y, r.name, {}, 0).setDepth(202);
      this.cardText(cx - 100, y, r.school, { color: hex(r.color) }, 0).setDepth(202);
      this.cardText(cx + (meet ? 260 : 370), y, r.finishTime.toFixed(2) + ' s', { fontFamily: FONT_MARKER, fontSize: '22px' }, 1).setDepth(202);
      if (meet) this.cardText(cx + 370, y, `+${HEAT_POINTS[i]}`, { fontFamily: FONT_MARKER, fontSize: '22px', color: hex(C.greenText) }, 1).setDepth(202);
    });

    const active = this.zoneTime + this.slowTime + this.fastTime;
    const zonePct = active > 0 ? Math.round(this.zoneTime / active * 100) : 0;
    const reaction = this.reaction ?? 0;
    this.cardText(cx, top + 352,
      `Reaction ${reaction.toFixed(2)} s     Top speed ${this.topSpeed.toFixed(1)} m/s     ` +
      `In the zone ${zonePct}%     Stumbles ${this.stumbles}`, { fontSize: '24px' });

    let tip;
    if (this.stumbles >= 4) tip = 'Tip: alternate sides. Pressing the same side twice makes you stumble.';
    else if (reaction > 0.35) tip = 'Tip: start pressing the moment you see BANG! Your reaction was slow.';
    else if (zonePct < 60 && this.slowTime >= this.fastTime) tip = 'Tip: press a little faster to stay in the green zone.';
    else if (zonePct < 60) tip = 'Tip: ease off a little. Pressing faster than the green zone wastes energy.';
    else if (meet && place > 1) tip = 'Tip: you ran well. More Speed training or a better-rested athlete could close the gap.';
    else if (place === 1) tip = meet ? 'Great heat! Winning heats boosts this athlete\'s morale.' : 'Great race! Try Hard press speed, or beat your personal best.';
    else tip = 'Tip: stay in the green zone the whole race to hold top speed.';
    this.cardText(cx, top + 404, tip, { fontSize: '24px', color: hex(C.inkSoft), wordWrap: { width: 780 } });

    if (meet) {
      this.cardText(cx, top + 490, 'Press SPACE, tap, or press A to continue', { fontFamily: FONT_MARKER, fontSize: '28px' });
    } else {
      this.cardText(cx, top + 478, 'Press SPACE, tap, or press A to race again', { fontFamily: FONT_MARKER, fontSize: '28px' });
      this.cardButton(cx - 150, top + 532, 'Change press speed (R)', false, () => this.backToReady());
      this.cardButton(cx + 170, top + 532, 'Main menu (B)', false, () => this.scene.start('title'));
    }
  }
}
