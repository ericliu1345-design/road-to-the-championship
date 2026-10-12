// Hand-drawn "marker doodle" drawing helpers.
// Everything in the game is drawn with code (no image files), in the style of the Courir running GIF:
// thick black marker lines, a slight wobble, and scribbly highlighter streaks.

const INK = 0x1d1d1f;
const INK_FAR = 0x4a4a52;   // limbs on the far side of the body, slightly lighter so the near side reads in front

const Doodle = {
  // Repeatable random number (0 to 1) for a given seed, so a wobble looks the same until we change the seed.
  rand(seed) {
    let t = (seed * 2654435761) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },

  // One marker stroke with round ends.
  stroke(g, x1, y1, x2, y2, width, color, alpha = 1) {
    g.lineStyle(width, color, alpha);
    g.lineBetween(x1, y1, x2, y2);
    g.fillStyle(color, alpha);
    g.fillCircle(x1, y1, width / 2);
    g.fillCircle(x2, y2, width / 2);
  },

  // Connected strokes through a list of points (used for arms and legs).
  chain(g, pts, width, color, alpha = 1) {
    g.lineStyle(width, color, alpha);
    for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    g.fillStyle(color, alpha);
    for (const p of pts) g.fillCircle(p.x, p.y, width / 2);
  },

  // A long hand-drawn line that drifts a little side to side, like it was drawn with a ruler-less hand.
  wobblyLine(g, x1, y1, x2, y2, width, color, seed, wobble = 2) {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const steps = Math.max(2, Math.round(len / 60));
    const nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const off = i === 0 || i === steps ? 0 : (Doodle.rand(seed * 1000 + i) - 0.5) * 2 * wobble;
      pts.push({ x: x1 + (x2 - x1) * t + nx * off, y: y1 + (y2 - y1) * t + ny * off });
    }
    Doodle.chain(g, pts, width, color);
  },

  // Joint positions for a running stick figure, measured from the ground point under the hips.
  //   phase: 0..1 position in the running cycle
  //   run:   0 = standing still, 1 = full sprint
  //   leanDeg: how far the body tips forward (the GIF leans a lot at top speed)
  pose(phase, run, leanDeg) {
    const TAU = Math.PI * 2, RAD = Math.PI / 180;
    const THIGH = 26, SHIN = 27, FOOT = 9;

    const legs = [0, 0.5].map((offset, i) => {
      const s = Math.sin((phase + offset) * TAU), c = Math.cos((phase + offset) * TAU);
      const thigh = ((1 - run) * (i ? -7 : 7) + run * 52 * s) * RAD;
      // The knee folds the most while the leg swings forward (heel kicks up toward the hips).
      const bend = (10 + run * (12 + 95 * Math.max(0, c))) * RAD;
      const shin = thigh - bend;
      const knee = { x: Math.sin(thigh) * THIGH, y: Math.cos(thigh) * THIGH };
      const foot = { x: knee.x + Math.sin(shin) * SHIN, y: knee.y + Math.cos(shin) * SHIN };
      const toe = { x: foot.x + Math.cos(shin) * FOOT, y: foot.y - Math.sin(shin) * FOOT };
      return { knee, foot, toe };
    });

    // Plant the lowest foot on the ground; this also makes the body bob up and down naturally.
    let low = 0;
    for (const l of legs) low = Math.max(low, l.foot.y, l.toe.y);
    const hip = { x: 0, y: -low };
    const add = p => ({ x: p.x + hip.x, y: p.y + hip.y });

    const lean = leanDeg * RAD;
    const neck = add({ x: Math.sin(lean) * 32, y: -Math.cos(lean) * 32 });
    const shoulder = add({ x: Math.sin(lean) * 27, y: -Math.cos(lean) * 27 });
    const headLean = lean * 0.7;
    const head = { x: neck.x + Math.sin(headLean) * 12, y: neck.y - Math.cos(headLean) * 12 };

    // Each arm swings opposite to the leg on the same side. At the back of the swing the arm is
    // almost straight and horizontal, like the GIF.
    const arms = [0.5, 0].map((offset, i) => {
      const s = Math.sin((phase + offset) * TAU);
      const upper = ((1 - run) * (i ? -10 : 10) + run * (-20 + 70 * s)) * RAD;
      const elbowBend = (15 + run * (-5 + 80 * (s + 1) / 2)) * RAD;
      const fore = upper + elbowBend;
      const elbow = { x: shoulder.x + Math.sin(upper) * 19, y: shoulder.y + Math.cos(upper) * 19 };
      const hand = { x: elbow.x + Math.sin(fore) * 17, y: elbow.y + Math.cos(fore) * 17 };
      return { elbow, hand };
    });

    return {
      hip, neck, shoulder, head, arms,
      legs: legs.map(l => ({ knee: add(l.knee), foot: add(l.foot), toe: add(l.toe) })),
    };
  },

  // Draw a runner. (x, groundY) is the spot on the ground under the hips.
  // opts: scale, jersey (team color), wobble (pixels of hand-drawn jitter), seed (changes the jitter)
  runner(g, x, groundY, P, opts) {
    const s = opts.scale, w = 4.8 * s, amp = opts.wobble || 0;
    let k = 0;
    const pt = p => {
      k++;
      const jx = amp ? (Doodle.rand(opts.seed * 101 + k) - 0.5) * 2 * amp : 0;
      const jy = amp ? (Doodle.rand(opts.seed * 103 + k + 77) - 0.5) * 2 * amp : 0;
      return { x: x + p.x * s + jx, y: groundY + p.y * s + jy };
    };
    const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

    const hip = pt(P.hip), neck = pt(P.neck), shoulder = pt(P.shoulder), head = pt(P.head);
    const leg = l => [hip, pt(l.knee), pt(l.foot), pt(l.toe)];
    const arm = a => [shoulder, pt(a.elbow), pt(a.hand)];

    // Far side first, then torso, then near side on top.
    Doodle.chain(g, leg(P.legs[1]), w * 0.9, INK_FAR);
    Doodle.chain(g, arm(P.arms[1]), w * 0.9, INK_FAR);

    // Torso: a team-colored shirt outlined in marker.
    const a = lerp(hip, neck, 0.08), b = lerp(hip, neck, 0.88);
    Doodle.stroke(g, a.x, a.y, b.x, b.y, w * 2.6, INK);
    Doodle.stroke(g, a.x, a.y, b.x, b.y, w * 1.6, opts.jersey);
    Doodle.stroke(g, b.x, b.y, neck.x, neck.y, w, INK);

    g.lineStyle(w * 0.9, INK);
    g.strokeCircle(head.x, head.y, 10 * s);

    Doodle.chain(g, leg(P.legs[0]), w, INK);
    Doodle.chain(g, arm(P.arms[0]), w, INK);
  },

  // The yellow speed streak behind a runner at top speed.
  // x: hip position, headY: top of the runner, k: strength 0..1 (longer and brighter when faster)
  streak(g, x, groundY, headY, k, seed, color) {
    const n = 11, top = headY - 6, bottom = groundY - 4;
    const len = 70 + 190 * k;
    for (let i = 0; i < n; i++) {
      const r1 = Doodle.rand(seed * 53 + i * 7 + 1);
      const r2 = Doodle.rand(seed * 29 + i * 11 + 2);
      const r3 = Doodle.rand(seed * 17 + i * 5 + 3);
      const y1 = top + (bottom - top) * ((i + 0.2 + r1 * 0.6) / n);
      const y2 = y1 + (r3 - 0.5) * 4;
      // Starts just behind the head and slants back toward the feet.
      const front = x + 22 - (i / n) * 18 + r2 * 10;
      const back = front - len * (0.7 + 0.3 * r3);
      const width = 6 + r1 * 3;
      const alpha = (0.5 + 0.25 * r2) * k;
      g.lineStyle(width, color, alpha);
      g.lineBetween(front, y1, back, y2);
      g.fillStyle(color, alpha);
      g.fillCircle(front, y1, width / 2);
      g.fillCircle(back, y2, width / 2);
    }
  },

  // A footprint, used for the touch-screen tap zones.
  footprint(g, x, y, mirror, color, alpha) {
    const m = mirror ? -1 : 1;
    g.fillStyle(color, alpha);
    g.fillEllipse(x, y + 18, 44, 70);
    g.fillEllipse(x + m * 4, y - 26, 34, 30);
    [[-16, -52, 9], [-4, -58, 8], [8, -56, 7], [17, -50, 6], [24, -42, 5]].forEach(([dx, dy, r]) => {
      g.fillCircle(x + m * dx, y + dy, r);
    });
  },
};
