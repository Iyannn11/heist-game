// NEON VAULT — level data. One job: the rooms. Each level is walls, patrol routes,
// cameras, loot and an exit. Walls are axis-aligned rectangles; everything else is
// placed in open floor so every route a player imagines is a real route.
import { FIELD } from './config.js';

function wall(x, y, w, h) {
  return { x, y, w, h };
}

// A room is the play field with a border and a few interior walls that break sightlines
// without sealing the space: every zone stays reachable from at least two directions.
export const LEVELS = [
  {
    name: 'THE GALLERY',
    sub: 'Lift the paintings. Mind the guards.',
    lootNeeded: 3,
    timeLimit: 150,
    start: { x: 60, y: 540 },
    exit: { x: 880, y: 40, w: 56, h: 56 },
    walls: [
      wall(0, 0, FIELD.width, 16), wall(0, FIELD.height - 16, FIELD.width, 16),
      wall(0, 0, 16, FIELD.height), wall(FIELD.width - 16, 0, 16, FIELD.height),
      wall(250, 120, 18, 180), wall(250, 420, 18, 120),
      wall(520, 90, 18, 150), wall(520, 360, 18, 150),
      wall(700, 240, 170, 18), wall(90, 300, 110, 18),
    ],
    guards: [
      { waypoints: [[330, 120], [330, 480], [620, 480], [620, 120]], speed: 78 },
      { waypoints: [[760, 480], [760, 140], [450, 140]], speed: 70 },
    ],
    cameras: [
      { x: 480, y: 66, base: Math.PI / 2, sweep: 0.9, speed: 0.55 },
    ],
    loot: [
      { kind: 'painting', x: 130, y: 90, value: 400 },
      { kind: 'painting', x: 880, y: 520, value: 400 },
      { kind: 'gold', x: 620, y: 300, value: 250 },
    ],
  },
  {
    name: 'THE VAULT',
    sub: 'Crack the vault core. The cameras never blink.',
    lootNeeded: 3,
    timeLimit: 180,
    start: { x: 60, y: 60 },
    exit: { x: 880, y: 520, w: 56, h: 56 },
    walls: [
      wall(0, 0, FIELD.width, 16), wall(0, FIELD.height - 16, FIELD.width, 16),
      wall(0, 0, 16, FIELD.height), wall(FIELD.width - 16, 0, 16, FIELD.height),
      wall(200, 0, 18, 200), wall(200, 330, 18, 270),
      wall(480, 120, 18, 220), wall(480, 430, 18, 170),
      wall(700, 0, 18, 170), wall(700, 300, 18, 140),
      wall(330, 470, 180, 18), wall(120, 250, 90, 18),
    ],
    guards: [
      { waypoints: [[300, 120], [300, 520], [580, 520], [580, 120]], speed: 84 },
      { waypoints: [[800, 120], [800, 520], [640, 520]], speed: 76 },
      { waypoints: [[120, 480], [420, 480], [420, 90], [120, 90]], speed: 70 },
    ],
    cameras: [
      { x: 480, y: 66, base: Math.PI / 2, sweep: 1.0, speed: 0.7 },
      { x: 22, y: 300, base: 0, sweep: 0.8, speed: 0.6 },
    ],
    loot: [
      { kind: 'vault', x: 880, y: 90, value: 1000 },
      { kind: 'gold', x: 620, y: 250, value: 250 },
      { kind: 'gold', x: 120, y: 380, value: 250 },
    ],
  },
  {
    name: 'THE ROOFTOP',
    sub: 'Grab the Diamond. Reach the chopper before the heat peaks.',
    lootNeeded: 1,
    timeLimit: 90,
    start: { x: 60, y: 540 },
    exit: { x: 880, y: 40, w: 64, h: 64 },
    // The alarm starts hot on the getaway and keeps climbing: run the plan, don't linger.
    alarmStart: 25,
    alarmCreep: 1.4,
    walls: [
      wall(0, 0, FIELD.width, 16), wall(0, FIELD.height - 16, FIELD.width, 16),
      wall(0, 0, 16, FIELD.height), wall(FIELD.width - 16, 0, 16, FIELD.height),
      wall(240, 100, 18, 200), wall(240, 420, 18, 120),
      wall(560, 80, 18, 180), wall(560, 380, 18, 140),
      wall(760, 240, 140, 18), wall(100, 320, 120, 18),
    ],
    guards: [
      { waypoints: [[340, 110], [340, 500], [660, 500], [660, 110]], speed: 92 },
      { waypoints: [[820, 500], [820, 150], [470, 150]], speed: 84 },
      { waypoints: [[130, 130], [130, 470], [430, 470]], speed: 78 },
    ],
    cameras: [
      { x: 480, y: 66, base: Math.PI / 2, sweep: 1.1, speed: 0.85 },
      { x: 938, y: 300, base: Math.PI, sweep: 0.9, speed: 0.75 },
    ],
    loot: [
      { kind: 'diamond', x: 480, y: 300, value: 2000 },
    ],
  },
];
