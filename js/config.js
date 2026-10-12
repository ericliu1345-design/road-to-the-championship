// Shared settings, colors and small helpers used by every screen.

const W = 1280, H = 720;

const C = {
  ink: 0x1d1d1f, inkSoft: 0x5b5b63, paper: 0xf7f3e8, grid: 0x9cc2e6,
  yellow: 0xf7d417, gold: 0xe0a800, green: 0x5cc977, greenText: 0x23803e, orange: 0xd9771f, track: 0xd9825b,
  blue: 0x2f62d0, red: 0xd94848, teal: 0x1f9e89, purple: 0x8a4fd1,
  board: 0xb98a5a, metal: 0x9aa0a8,
};

// Colors a player can choose for their school (none of them match a rival school).
const TEAM_COLORS = [
  { name: 'Royal blue', value: 0x2f62d0 },
  { name: 'Orange', value: 0xe8742a },
  { name: 'Pink', value: 0xd94f95 },
  { name: 'Maroon', value: 0x8c2f39 },
  { name: 'Sky blue', value: 0x3fa7d6 },
  { name: 'Navy', value: 0x22336b },
];

const hex = n => '#' + n.toString(16).padStart(6, '0');

const FONT_MARKER = '"Permanent Marker", "Comic Sans MS", cursive';
const FONT_HAND = '"Patrick Hand", "Comic Sans MS", cursive';

// "Press speed" settings: the middle of the green zone, in presses per second.
const DIFFICULTY = {
  easy: { label: 'Easy', center: 6, half: 1.5 },
  normal: { label: 'Normal', center: 8, half: 1.5 },
  hard: { label: 'Hard', center: 9.5, half: 1.5 },
};

// The green zone for a press-speed setting. Higher Focus makes the zone wider (easier to stay in).
// Focus 50 gives the normal width; Focus 100 is 40% wider; Focus 0 is 40% narrower.
function zoneFor(difficultyKey, focus = 50) {
  const d = DIFFICULTY[difficultyKey] || DIFFICULTY.normal;
  const f = 0.6 + focus * 0.008;
  return { lo: Math.round((d.center - d.half * f) * 10) / 10, hi: Math.round((d.center + d.half * f) * 10) / 10 };
}

function loadPref(key, fallback) {
  try { return localStorage.getItem('rtc-' + key) ?? fallback; } catch (e) { return fallback; }
}
function savePref(key, value) {
  try { localStorage.setItem('rtc-' + key, value); } catch (e) { /* storage blocked: fine */ }
}

function getDifficulty() {
  const d = loadPref('difficulty', 'normal');
  return DIFFICULTY[d] ? d : 'normal';
}

const ordinal = n => n + (['th', 'st', 'nd', 'rd'][n] || 'th');
const clamp = Phaser.Math.Clamp;
const reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
