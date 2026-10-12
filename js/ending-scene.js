// The end of the season: which ending you got, and a recap of how you got there.

class EndingScene extends Phaser.Scene {
  constructor() {
    super('ending');
  }

  create() {
    const s = Season.state;
    const end = ENDINGS[s.ending];
    Season.clear();                       // the season is over; the title screen won't offer Continue

    UI.background(this);
    const { cx, top, left, w } = UI.card(this, 1180, 660, { dim: false, y: 34 });
    const t = (x, y, str, style = {}, ox = 0) => UI.text(this, x, y, str, { fontSize: '21px', ...style }, ox, 0).setDepth(210);

    if (s.ending === 'perfect' || s.ending === 'champions') {
      const g = this.add.graphics().setDepth(209);
      g.fillStyle(C.yellow, 0.5).fillRect(cx - 360, top + 22, 720, 64);
    }
    UI.text(this, cx, top + 54, end.title, { fontFamily: FONT_MARKER, fontSize: '54px', color: hex(end.color) }).setDepth(210);
    UI.text(this, cx, top + 118, end.text, { fontSize: '23px', align: 'center', wordWrap: { width: 1000 } }).setDepth(210);

    // Meet results
    const c1 = left + 40, c2 = left + 360, c3 = left + 860;
    const head = (x, str) => t(x, top + 176, str, { fontFamily: FONT_MARKER, fontSize: '22px' });
    head(c1, 'Season results');
    s.results.forEach((r, i) => {
      t(c1, top + 214 + i * 30, `${SCHEDULE_LABELS[r.week - 1].padEnd(10)}  ${ordinal(r.place)} of ${r.standings.length}`,
        { color: hex(r.place === 1 ? C.greenText : C.ink) });
    });

    // Athlete growth
    head(c2, 'Your athletes');
    s.athletes.forEach((a, i) => {
      const y = top + 214 + i * 56;
      t(c2, y, `${a.name} (${a.role})`, { fontFamily: FONT_MARKER, fontSize: '19px', color: hex(s.color) });
      const best = a.best ? `best ${a.best.toFixed(2)} s` : 'no finished race';
      t(c2, y + 24, `Speed ${a.startSpeed}→${a.speed}   Focus ${a.startFocus}→${a.focus}   ${best}   heat wins ${a.heatWins}`,
        { fontSize: '19px', color: hex(C.inkSoft) });
    });

    // Practice choices
    head(c3, 'Your coaching');
    const pc = s.practiceCounts;
    PRACTICE_KEYS.forEach((k, i) => t(c3, top + 214 + i * 30, `${PRACTICE[k].label}: ${pc[k]}`));

    // One lesson based on what happened
    const most = s.athletes.reduce((m, a) => (a.speed - a.startSpeed > m.speed - m.startSpeed ? a : m), s.athletes[0]);
    let lesson;
    if (s.ending === 'fellapart') lesson = 'Coach\'s lesson: winning needs a happy team. Mix in rest days and team bonding before morale runs out.';
    else if (pc.rest === 0) lesson = 'Coach\'s lesson: you never used a rest day. Fresh legs (Energy over 60) run at full speed.';
    else if (pc.speed === 0) lesson = 'Coach\'s lesson: Speed work is how athletes get faster. Use it, then rest to recover.';
    else lesson = `Coach's lesson: ${most.name} improved the most (Speed +${most.speed - most.startSpeed}). Balancing hard training with rest is how teams peak for State.`;
    UI.text(this, cx, top + 470, lesson, { fontSize: '22px', align: 'center', wordWrap: { width: 1060 }, color: hex(C.inkSoft) }).setDepth(210);

    UI.text(this, cx, top + 530, `${s.school} ${s.mascot}  ·  Coach ${s.coach}`, { fontFamily: FONT_MARKER, fontSize: '24px', color: hex(s.color) }).setDepth(210);

    const buttons = [
      UI.button(this, cx - 160, top + 600, 'New season', () => this.scene.start('setup'), { size: 26, depth: 211 }),
      UI.button(this, cx + 160, top + 600, 'Main menu', () => this.scene.start('title'), { size: 26, depth: 211 }),
    ];
    UI.keyMenu(this, buttons);
    if (s.ending === 'perfect' || s.ending === 'champions') Sfx.cheer();
  }
}
