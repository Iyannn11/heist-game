// NEON VAULT — shared constants. One job: the numbers every other module agrees on.
export const FIELD = { width: 960, height: 600 };
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  speed: 185,
  sneakSpeed: 100,
  // How much slower the alarm fills while sneaking.
  sneakFactor: 0.5,
};

export const GUARD = {
  radius: 14,
  speed: 78,
  // Vision cone: half-angle in radians, and how far the guard sees.
  coneHalf: 0.5,
  coneRange: 175,
  // Seconds the guard pauses at each patrol waypoint.
  pause: 1.1,
  // Alarm fills per second while the thief is seen, at point-blank range.
  alarmRate: 95,
};

export const CAMERA = {
  coneHalf: 0.42,
  coneRange: 200,
  alarmRate: 130,
  // Seconds an EMP keeps a camera dark.
  empSeconds: 5,
};

export const TOOLS = {
  empStart: 2,
  smokeStart: 1,
  smokeSeconds: 4,
  smokeRadius: 85,
  lockpickSeconds: 2.5,
};

// The alarm drains this fast per second while nobody sees the thief.
export const ALARM_DRAIN = 26;
// A short grace flash before the bust lands once the meter hits the top.
export const CAUGHT_GRACE = 0.7;

export const COLORS = {
  floorA: '#131f3d',
  floorB: '#0e1830',
  wall: '#2b3f6e',
  wallTop: '#3b548f',
  cone: 'rgba(255, 64, 64, 0.30)',
  coneEdge: 'rgba(255, 90, 90, 0.55)',
  camCone: 'rgba(255, 170, 40, 0.26)',
  camConeEdge: 'rgba(255, 190, 60, 0.5)',
  loot: '#f5c542',
  lootGlow: 'rgba(245, 197, 66, 0.35)',
  player: '#2dd4ff',
  playerDark: '#0e7ea6',
  guard: '#ff5a4e',
  guardDark: '#8f1d16',
  camera: '#ffb02e',
  smoke: 'rgba(190, 200, 220, 0.55)',
  exit: '#37e08b',
  text: '#eef3ff',
  muted: '#93a4cf',
};
