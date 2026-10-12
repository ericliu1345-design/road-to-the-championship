// Shared screen pieces in the doodle style: background, cards, buttons, bars, morale faces,
// and keyboard/controller menu navigation.

const UI = {
  background(scene) {
    if (!scene.textures.exists('paper')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(C.paper);
      g.fillRect(0, 0, 48, 48);
      g.lineStyle(1, C.grid, 0.35);
      g.lineBetween(0, 0.5, 48, 0.5);
      g.lineBetween(0.5, 0, 0.5, 48);
      g.generateTexture('paper', 48, 48);
      g.destroy();
    }
    return scene.add.tileSprite(0, 0, W, H, 'paper').setOrigin(0).setScrollFactor(0).setDepth(-10);
  },

  text(scene, x, y, str, style = {}, ox = 0.5, oy = 0.5) {
    return scene.add.text(x, y, str, {
      fontFamily: FONT_HAND, fontSize: '24px', color: hex(C.ink), resolution: 2, ...style,
    }).setOrigin(ox, oy);
  },

  wobblyRect(g, x, y, w, h, width, color, seed) {
    Doodle.wobblyLine(g, x, y, x + w, y, width, color, seed + 1, 1.5);
    Doodle.wobblyLine(g, x + w, y, x + w, y + h, width, color, seed + 2, 1.5);
    Doodle.wobblyLine(g, x + w, y + h, x, y + h, width, color, seed + 3, 1.5);
    Doodle.wobblyLine(g, x, y + h, x, y, width, color, seed + 4, 1.5);
  },

  // An index card with a strip of tape on top. Returns where to put things on it.
  card(scene, w, h, { depth = 200, dim = true, y = null } = {}) {
    const objs = [];
    if (dim) objs.push(scene.add.rectangle(W / 2, H / 2, W, H, C.ink, 0.25).setScrollFactor(0).setDepth(depth));
    const g = scene.add.graphics().setScrollFactor(0).setDepth(depth);
    const x = W / 2 - w / 2, top = y ?? (H - h) / 2 + 20;
    g.fillStyle(C.ink, 0.18).fillRect(x + 10, top + 12, w, h);
    g.fillStyle(C.paper, 1).fillRect(x, top, w, h);
    UI.wobblyRect(g, x, top, w, h, 3, C.ink, 500);
    g.fillStyle(C.yellow, 0.6).fillRect(W / 2 - 70, top - 14, 140, 28);
    objs.push(g);
    return { objs, cx: W / 2, left: x, top, w, h };
  },

  // A doodle button. Clicks/taps call onPress. Use setSelected/setFocused for highlights.
  button(scene, x, y, label, onPress, opts = {}) {
    const size = opts.size || 24;
    const depth = opts.depth ?? 10;
    const t = UI.text(scene, x, y, label, {
      fontFamily: FONT_MARKER, fontSize: size + 'px', color: hex(opts.color ?? C.ink),
    }, opts.ox ?? 0.5).setDepth(depth + 0.5).setScrollFactor(0);
    const g = scene.add.graphics().setDepth(depth).setScrollFactor(0);
    const padX = opts.padX ?? 14, padY = opts.padY ?? 6;
    const boxed = opts.boxed !== false;

    t.redraw = () => {
      g.clear();
      if (!t.visible) return;
      const w = (opts.width || t.width + padX * 2);
      const h = t.height + padY * 2;
      const left = t.x - t.originX * t.width - (w - t.width) / 2;
      const top = t.y - t.originY * t.height - padY;
      if (t.selected) g.fillStyle(C.yellow, 0.85).fillRect(left, top, w, h);
      else if (boxed) g.fillStyle(C.paper, 1).fillRect(left, top, w, h);
      if (t.hovered && !t.selected) g.fillStyle(C.yellow, 0.3).fillRect(left, top, w, h);
      if (boxed) g.lineStyle(2.5, C.ink).strokeRect(left, top, w, h);
      if (t.focused) g.lineStyle(3, C.blue).strokeRect(left - 5, top - 5, w + 10, h + 10);
    };
    t.press = () => {
      Sfx.unlock();
      Sfx.click();
      onPress();
    };
    t.setSelected = v => { t.selected = v; t.redraw(); return t; };
    t.setFocused = v => { t.focused = v; t.redraw(); return t; };
    const w = opts.width || t.width + padX * 2;
    t.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-(w - t.width) / 2, -padY, w, t.height + padY * 2),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    t.on('pointerdown', () => t.press());
    t.on('pointerover', () => { t.hovered = true; t.redraw(); });
    t.on('pointerout', () => { t.hovered = false; t.redraw(); });
    t.on('destroy', () => g.destroy());
    t.bg = g;
    t.redraw();
    return t;
  },

  // A labeled 0–100 bar.
  bar(g, x, y, w, h, value, color) {
    g.fillStyle(C.paper, 1).fillRect(x, y, w, h);
    g.fillStyle(color, 0.75).fillRect(x, y, w * clamp(value, 0, 100) / 100, h);
    g.lineStyle(2, C.ink).strokeRect(x, y, w, h);
  },

  energyColor(v) { return v >= 60 ? C.green : v >= 30 ? C.orange : C.red; },
  moraleColor(v) { return v >= 50 ? C.green : v >= 20 ? C.orange : C.red; },

  // A doodled face: smiling, flat or frowning depending on morale.
  face(g, x, y, r, morale) {
    g.lineStyle(2.5, C.ink);
    g.fillStyle(C.paper, 1).fillCircle(x, y, r);
    g.strokeCircle(x, y, r);
    g.fillStyle(C.ink).fillCircle(x - r * 0.35, y - r * 0.25, r * 0.12).fillCircle(x + r * 0.35, y - r * 0.25, r * 0.12);
    g.beginPath();
    if (morale >= 50) g.arc(x, y + r * 0.05, r * 0.5, 0.15 * Math.PI, 0.85 * Math.PI, false);
    else if (morale >= 20) { g.moveTo(x - r * 0.4, y + r * 0.35); g.lineTo(x + r * 0.4, y + r * 0.35); }
    else g.arc(x, y + r * 0.75, r * 0.45, 1.15 * Math.PI, 1.85 * Math.PI, false);
    g.strokePath();
  },

  // Keyboard and controller navigation for a list of buttons: arrow keys move, Enter/Space presses.
  // Returns an object with setIndex() and destroy().
  keyMenu(scene, buttons, { start = 0 } = {}) {
    let i = clamp(start, 0, buttons.length - 1);
    const show = () => buttons.forEach((b, k) => b.setFocused(k === i));
    const move = d => { i = (i + d + buttons.length) % buttons.length; show(); };
    const onKey = e => {
      if (e.repeat) return;
      Sfx.unlock();
      if (e.code === 'ArrowDown' || e.code === 'ArrowRight') move(1);
      else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') move(-1);
      else if (e.code === 'Enter' || e.code === 'Space') buttons[i].press();
    };
    const onPad = (pad, button) => {
      if (button.index === 13 || button.index === 15) move(1);
      else if (button.index === 12 || button.index === 14) move(-1);
      else if (button.index === 0) buttons[i].press();
    };
    scene.input.keyboard.on('keydown', onKey);
    scene.input.gamepad?.on('down', onPad);
    show();
    return {
      setIndex(k) { i = k; show(); },
      destroy() {
        scene.input.keyboard.off('keydown', onKey);
        scene.input.gamepad?.off('down', onPad);
      },
    };
  },
};
