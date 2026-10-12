// How to Play: all the rules on one page. Opened from the title screen or the clipboard.

class HowToScene extends Phaser.Scene {
  constructor() {
    super('howto');
  }

  init(data) {
    this.back = (data && data.back) || 'title';
  }

  create() {
    UI.background(this);
    const { cx, top, left } = UI.card(this, 1200, 680, { dim: false, y: 22 });
    const t = (x, y, str, style = {}) => UI.text(this, x, y, str, { fontSize: '20px', lineSpacing: 3, ...style }, 0, 0).setDepth(210);
    const head = (x, y, str) => t(x, y, str, { fontFamily: FONT_MARKER, fontSize: '22px' });

    UI.text(this, cx, top + 34, 'HOW TO PLAY', { fontFamily: FONT_MARKER, fontSize: '40px' }).setDepth(210);

    const col1 = left + 40, col2 = left + 620, wrap = { wordWrap: { width: 540 } };
    head(col1, top + 70, 'Goal');
    t(col1, top + 98, 'Coach your high school track team through a 5-week season. Finish in the top 2 at Regionals to reach State, then beat Skibidi Verity High School to become State Champions.', wrap);

    head(col1, top + 178, 'Each week');
    t(col1, top + 206, '1. On the clipboard, pick a practice for each of your 4 athletes.\n2. At the meet, each athlete runs one 100m heat against the other schools.\n3. Places score team points: 1st 5, 2nd 3, 3rd 2, 4th 1. Most points wins the meet.', wrap);

    head(col1, top + 318, 'Practice');
    t(col1, top + 346, 'Speed work: +Speed, −32 Energy (−10 Morale if already exhausted)\nFocus drills: +Focus, −18 Energy\nRest day: +35 Energy, +4 Morale\nTeam bonding: +14 Morale (+5 for teammates), −6 Energy\nEvery week: +12 Energy back. Each race: −8 Energy.', wrap);

    head(col1, top + 482, 'Stats');
    t(col1, top + 510, 'Speed = top speed.   Focus = how wide the green zone is.\nEnergy under 50 = slower (up to −10%).\nMorale: up to +1% when happy, −4% when unhappy. At 0 the athlete refuses to race. If 3 athletes hit 0, the team falls apart.', wrap);

    head(col2, top + 70, 'Racing');
    t(col2, top + 98, 'Alternate LEFT and RIGHT to run:\nKeyboard Q / E  (or A / D, or ← / →)\nTouch: tap the left and right sides of the screen\nController: L1 / R1  (LB / RB)\nKeep the needle in the GREEN ZONE. Same side twice = stumble.', wrap);

    head(col2, top + 254, 'The start');
    t(col2, top + 282, 'Wait for BANG! Moving during "Set" is a false start. In season meets, the 1st false start is a warning and the 2nd is a disqualification (0 points).', wrap);

    head(col2, top + 352, 'Simulate');
    t(col2, top + 380, 'In weekly meets you can Simulate a heat instead of racing it. Simulated heats run at 94–98% of the athlete\'s potential (more Focus = higher), so a good race does better. Regionals and State must be raced.', wrap);

    head(col2, top + 462, 'Endings');
    t(col2, top + 490, 'There are 6 different endings, from "The Team Fell Apart" to a "Perfect Season". Your choices decide which one you get.', wrap);

    head(col2, top + 544, 'Settings');
    t(col2, top + 572, 'Press speed (Easy / Normal / Hard) on the title screen.\nP or Esc pauses a race. M turns sound on or off.', wrap);

    UI.button(this, cx, top + 646, 'Back  (Enter)', () => this.scene.start(this.back), { size: 22, depth: 211 }).setSelected(true);
    this.input.keyboard.on('keydown', e => {
      if (['Enter', 'Escape', 'Backspace', 'Space', 'KeyH', 'KeyB'].includes(e.code)) this.scene.start(this.back);
    });
    this.input.gamepad?.on('down', (pad, button) => { if (button.index === 0 || button.index === 1) this.scene.start(this.back); });
  }
}
