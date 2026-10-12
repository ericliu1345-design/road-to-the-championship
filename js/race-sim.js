// Race physics, shared by the live race and by simulated heats.
// Speeds are in meters per second. A runner object needs: top, accel, dist, v, finished.

// Rivals aren't the same every race. Each race they get a random "form of the day" (up to ±3.5% top speed,
// about ±0.3 s), and during the race they surge and fade a little at random moments.
const RIVAL_FORM_SWING = 0.035;
const RIVAL_SURGE = 0.025;

// How much of top speed the current press rhythm allows.
function strideEfficiency(cadence, zone) {
  if (cadence <= 0) return 0;
  if (cadence < zone.lo) return Math.pow(cadence / zone.lo, 1.3);
  if (cadence <= zone.hi) return 1;
  return Math.max(0.8, 1 - 0.05 * (cadence - zone.hi));
}

function randomForm() {
  return Phaser.Math.FloatBetween(1 - RIVAL_FORM_SWING, 1 + RIVAL_FORM_SWING);
}

// Speed up toward the target speed (quickly at first, slower near top speed), or slow down.
function moveRunner(r, target, dt) {
  if (target > r.v) r.v = Math.min(target, r.v + 5.2 * r.accel * (1 - 0.55 * r.v / r.top) * dt);
  else r.v = Math.max(target, r.v - (r.finished ? 4 : 3) * dt);
  r.dist += r.v * dt;
}

// Get a rival ready for a new race.
function prepareRival(r) {
  r.reaction = Phaser.Math.FloatBetween(...r.reactionRange);
  if (r.form == null) r.form = randomForm();
  r.surge = 0;
  r.surgeTarget = 0;
  r.surgeTimer = 0;
}

// The speed a rival is trying to run right now.
function rivalTarget(r, raceTime, dt) {
  // Every second or so, pick a new random surge (speed up) or fade (slow down) and ease into it.
  r.surgeTimer -= dt;
  if (r.surgeTimer <= 0) {
    r.surgeTarget = Phaser.Math.FloatBetween(-RIVAL_SURGE, RIVAL_SURGE);
    r.surgeTimer = Phaser.Math.FloatBetween(0.6, 1.4);
  }
  r.surge += (r.surgeTarget - r.surge) * Math.min(1, dt * 2);

  if (r.finished || raceTime < r.reaction) return 0;
  const late = clamp((r.dist - r.fadeAt) / (100 - r.fadeAt), 0, 1);
  return r.top * r.form * (1 - r.fade * late) * (1 + r.surge);
}

// Run a whole heat instantly (no drawing) and return each lane's finish time by id.
// The player's runner holds playerEfficiency of their top speed (a steady but not perfect race).
function simulateHeat(lanes, playerEfficiency) {
  const runners = lanes.map(l => ({ ...l, dist: 0, v: 0, finished: false, finishTime: null }));
  for (const r of runners) {
    if (r.isPlayer) r.reaction = Phaser.Math.FloatBetween(0.18, 0.26);
    else prepareRival(r);
  }
  const dt = 1 / 60;
  let t = 0;
  while (t < 40 && runners.some(r => !r.finished)) {
    t += dt;
    for (const r of runners) {
      const target = r.isPlayer
        ? (t >= r.reaction && !r.finished ? r.top * playerEfficiency : 0)
        : rivalTarget(r, t, dt);
      moveRunner(r, target, dt);
      if (!r.finished && r.dist >= 100) {
        r.finished = true;
        r.finishTime = t - (r.dist - 100) / Math.max(r.v, 0.1);
      }
    }
  }
  const times = {};
  for (const r of runners) times[r.id] = r.finishTime ?? t + (100 - r.dist) / Math.max(r.v, 1);
  return times;
}
