// levels.js — the three rooms of AURUM HEIST, as data only (no logic here).
// Play area for rooms 1-2 is x 8..1272, y 72..792; room 3 is a rooftop inset.
// blocks: solid furniture/walls, {x, y, w, h, kind} — they block movement and sight.
// loot: {x, y, kind, value, label, pins} — pins > 0 means it needs lockpicking.
// guards: {x, y, path, speed, kind} — kind 'guard' or 'dog'.
// cameras: {x, y, angle, sweep, speed, range} — angle 0 = east, PI/2 = south.
// lasers: {x, y, len, vertical, period, onFrac, phase} — a beam that toggles on/off.
// exit: the door to the next room (or the helipad in room 3).

const PLAY_BOUNDS = { x: 8, y: 72, w: 1264, h: 720 };

const LEVELS = [
  {
    name: 'ROOM 1 — THE GILDED GALLERY',
    sub: 'Lift three pieces without waking the house',
    objective: 'Steal 3 pieces, then leave east',
    needLoot: 3,
    bounds: PLAY_BOUNDS,
    skyline: false,
    helipad: null,
    playerStart: { x: 60, y: 430 },
    exit: { x: 1252, y: 380, w: 20, h: 80, label: 'TO THE VAULT HALL' },
    blocks: [
      { x: 420, y: 72, w: 26, h: 330, kind: 'wall' },
      { x: 420, y: 502, w: 26, h: 290, kind: 'wall' },
      { x: 860, y: 72, w: 26, h: 200, kind: 'wall' },
      { x: 860, y: 372, w: 26, h: 420, kind: 'wall' },
      { x: 560, y: 300, w: 300, h: 24, kind: 'wall' },
      { x: 420, y: 560, w: 300, h: 24, kind: 'wall' },
      { x: 190, y: 190, w: 100, h: 56, kind: 'case' },
      { x: 190, y: 580, w: 100, h: 56, kind: 'case' },
      { x: 620, y: 160, w: 100, h: 56, kind: 'case' },
      { x: 620, y: 640, w: 100, h: 56, kind: 'case' },
      { x: 1030, y: 190, w: 100, h: 56, kind: 'case' },
      { x: 1030, y: 580, w: 100, h: 56, kind: 'case' },
      { x: 60, y: 120, w: 34, h: 34, kind: 'plant' },
      { x: 60, y: 690, w: 34, h: 34, kind: 'plant' },
      { x: 1180, y: 120, w: 34, h: 34, kind: 'plant' },
      { x: 1180, y: 690, w: 34, h: 34, kind: 'plant' },
      { x: 300, y: 420, w: 80, h: 30, kind: 'bench' },
      { x: 740, y: 420, w: 80, h: 30, kind: 'bench' },
    ],
    loot: [
      { x: 640, y: 100, kind: 'painting', value: 400, label: 'Sunset over the Bay', pins: 0 },
      { x: 700, y: 762, kind: 'painting', value: 350, label: 'The Duchess', pins: 0 },
      { x: 1100, y: 420, kind: 'gem', value: 600, label: 'Star Sapphire', pins: 0 },
      { x: 84, y: 260, kind: 'painting', value: 300, label: 'Harbour Lights', pins: 0 },
    ],
    guards: [
      { x: 150, y: 150, path: [[150, 150], [640, 150], [1100, 150], [1100, 260]], speed: 55, kind: 'guard' },
      { x: 150, y: 660, path: [[150, 660], [600, 660], [1100, 660]], speed: 55, kind: 'guard' },
      { x: 640, y: 220, path: [[640, 220], [640, 620]], speed: 50, kind: 'guard' },
    ],
    cameras: [
      { x: 1264, y: 100, angle: 2.35, sweep: 0.8, speed: 0.5, range: 230 },
      { x: 16, y: 740, angle: -0.7, sweep: 0.8, speed: 0.45, range: 230 },
    ],
    lasers: [],
    vaultDoor: null,
  },
  {
    name: 'ROOM 2 — THE VAULT HALL',
    sub: 'Timed lasers, a vault guard, and the Aurum Diamond',
    objective: 'Crack the vault, take the diamond, leave east',
    needLoot: 0,
    bounds: PLAY_BOUNDS,
    skyline: false,
    helipad: null,
    playerStart: { x: 60, y: 430 },
    exit: { x: 1252, y: 430, w: 20, h: 80, label: 'TO THE ROOFTOP' },
    blocks: [
      { x: 560, y: 72, w: 24, h: 140, kind: 'wall' },
      { x: 696, y: 72, w: 24, h: 140, kind: 'wall' },
      { x: 560, y: 72, w: 160, h: 24, kind: 'wall' },
      { x: 380, y: 600, w: 90, h: 56, kind: 'crate' },
      { x: 880, y: 140, w: 90, h: 56, kind: 'crate' },
      { x: 620, y: 420, w: 44, h: 44, kind: 'pillar' },
      { x: 150, y: 300, w: 110, h: 50, kind: 'desk' },
      { x: 1010, y: 480, w: 110, h: 50, kind: 'desk' },
      { x: 150, y: 640, w: 110, h: 50, kind: 'desk' },
      { x: 1010, y: 180, w: 110, h: 50, kind: 'desk' },
    ],
    loot: [
      { x: 640, y: 140, kind: 'diamond', value: 2000, label: 'The Aurum Diamond', pins: 0 },
      { x: 300, y: 130, kind: 'gold', value: 500, label: 'Gold bars', pins: 1 },
      { x: 980, y: 660, kind: 'gold', value: 500, label: 'Gold bars', pins: 1 },
    ],
    guards: [
      { x: 500, y: 260, path: [[500, 260], [780, 260], [780, 520], [500, 520]], speed: 60, kind: 'guard' },
      { x: 150, y: 150, path: [[150, 150], [150, 660], [360, 660]], speed: 55, kind: 'guard' },
      { x: 600, y: 300, path: [[520, 300], [760, 300]], speed: 40, kind: 'guard' },
    ],
    cameras: [
      { x: 1264, y: 80, angle: 2.5, sweep: 0.7, speed: 0.5, range: 230 },
      { x: 16, y: 80, angle: 0.6, sweep: 0.7, speed: 0.45, range: 230 },
    ],
    lasers: [
      { x: 500, y: 300, len: 220, vertical: true, period: 2.6, onFrac: 0.55, phase: 0 },
      { x: 820, y: 300, len: 220, vertical: true, period: 2.6, onFrac: 0.55, phase: 1.3 },
    ],
    vaultDoor: { x: 584, y: 196, w: 112, h: 16, pins: 3, id: 'vault' },
  },
  {
    name: 'ROOM 3 — MIDNIGHT ROOFTOP',
    sub: 'One dog, two guards, and a helicopter waiting',
    objective: 'Reach the helicopter on the helipad',
    needLoot: 0,
    bounds: { x: 40, y: 110, w: 1200, h: 640 },
    skyline: true,
    helipad: { x: 1100, y: 200, r: 95 },
    playerStart: { x: 80, y: 700 },
    exit: null,
    blocks: [
      { x: 180, y: 200, w: 130, h: 80, kind: 'ac' },
      { x: 180, y: 560, w: 130, h: 80, kind: 'ac' },
      { x: 950, y: 200, w: 130, h: 80, kind: 'ac' },
      { x: 950, y: 560, w: 130, h: 80, kind: 'ac' },
      { x: 600, y: 150, w: 70, h: 44, kind: 'vent' },
      { x: 600, y: 640, w: 70, h: 44, kind: 'vent' },
    ],
    loot: [
      { x: 1120, y: 700, kind: 'gold', value: 450, label: 'Rooftop stash', pins: 0 },
      { x: 100, y: 140, kind: 'gem', value: 400, label: 'Crew drop', pins: 0 },
    ],
    guards: [
      { x: 150, y: 700, path: [[150, 700], [1100, 700]], speed: 60, kind: 'guard' },
      { x: 150, y: 150, path: [[150, 150], [150, 650]], speed: 55, kind: 'guard' },
      { x: 500, y: 320, path: [[500, 320], [900, 320], [900, 520], [500, 520]], speed: 95, kind: 'dog' },
    ],
    cameras: [
      { x: 1240, y: 740, angle: -2.2, sweep: 0.7, speed: 0.5, range: 230 },
    ],
    lasers: [],
    vaultDoor: null,
  },
];
