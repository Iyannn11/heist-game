// NEON VAULT — the world. One job: the rules. It owns the thief, the guards, the
// cameras, the loot, the alarm and the tools, and steps them forward one tick at a time.
// The renderer only reads this state; it never changes it.
import {
  FIELD, STEP, PLAYER, GUARD, CAMERA, TOOLS, ALARM_DRAIN, CAUGHT_GRACE,
} from './config.js';
import { LEVELS } from './levels.js';
import { makeGuard, stepGuard, guardSees, conePolygon } from './guards.js';
import { makeCamera, stepCamera, cameraSees, cameraCone } from './cameras.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_LEVEL = 'level';
export const SCREEN_WIN = 'win';

export const EVENT_NONE = 0;
export const EVENT_CAUGHT = 1;
export const EVENT_LEVEL = 2;
export const EVENT_WIN = 4;

function circleHitsWalls(x, y, r, walls) {
  for (let i = 0; i < walls.length; i += 1) {
    const w = walls[i];
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

function moveCircle(state, dx, dy) {
  const p = state.player;
  const r = PLAYER.radius;
  if (dx !== 0) {
    const nx = p.x + dx;
    if (!circleHitsWalls(nx, p.y, r, state.walls)) p.x = nx;
  }
  if (dy !== 0) {
    const ny = p.y + dy;
    if (!circleHitsWalls(p.x, ny, r, state.walls)) p.y = ny;
  }
  p.x = Math.max(16 + r, Math.min(FIELD.width - 16 - r, p.x));
  p.y = Math.max(16 + r, Math.min(FIELD.height - 16 - r, p.y));
}

export function makeWorld(audio) {
  const world = {
    audio,
    levelIndex: 0,
    level: null,
    walls: [],
    guards: [],
    cameras: [],
    loot: [],
    exit: null,
    player: { x: 60, y: 540, angle: -Math.PI / 2, moving: false, stepT: 0 },
    alarm: 0,
    caughtT: 0,
    score: 0,
    lootGot: 0,
    emp: TOOLS.empStart,
    smokeLeft: TOOLS.smokeStart,
    smokes: [],
    emps: [],
    lockT: 0,
    lockTarget: null,
    time: 0,
    timeLeft: 0,
    message: '',
    messageT: 0,
    screen: SCREEN_TITLE,
    best: 0,
  };
  world.loadLevel = (index) => loadLevel(world, index);
  world.reset = () => {
    world.score = 0;
    world.loadLevel(0);
    world.screen = SCREEN_TITLE;
  };
  world.reset();
  return world;
}

function loadLevel(world, index) {
  const def = LEVELS[index];
  world.levelIndex = index;
  world.level = def;
  world.walls = def.walls;
  world.guards = def.guards.map(makeGuard);
  world.cameras = def.cameras.map(makeCamera);
  world.loot = def.loot.map((l) => ({ ...l, got: false }));
  world.exit = def.exit;
  world.player.x = def.start.x;
  world.player.y = def.start.y;
  world.player.angle = -Math.PI / 2;
  world.alarm = def.alarmStart || 0;
  world.caughtT = 0;
  world.lootGot = 0;
  world.emp = TOOLS.empStart;
  world.smokeLeft = TOOLS.smokeStart;
  world.smokes = [];
  world.emps = [];
  world.lockT = 0;
  world.lockTarget = null;
  world.time = 0;
  world.timeLeft = def.timeLimit;
  world.message = def.name;
  world.messageT = 2.2;
  world.screen = SCREEN_PLAY;
  if (world.audio) world.audio.alarmStop();
}

function say(world, text, seconds) {
  world.message = text;
  world.messageT = seconds || 2;
}

/** One fixed tick. `input` is the input state; returns an event bitmask. */
export function stepWorld(world, input, dt) {
  const state = world;
  state.time += dt;
  state.timeLeft -= dt;
  if (state.messageT > 0) state.messageT -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    return finishCaught(world, 'Out of time — the crew left without you.');
  }

  // Guards and cameras keep their own clocks.
  for (let i = 0; i < state.guards.length; i += 1) stepGuard(state.guards[i], dt);
  for (let i = 0; i < state.cameras.length; i += 1) stepCamera(state.cameras[i], dt, state.time);

  // Smoke clouds and EMP pucks fade.
  for (let i = state.smokes.length - 1; i >= 0; i -= 1) {
    state.smokes[i].t -= dt;
    if (state.smokes[i].t <= 0) state.smokes.splice(i, 1);
  }
  for (let i = state.emps.length - 1; i >= 0; i -= 1) {
    state.emps[i].t -= dt;
    if (state.emps[i].t <= 0) state.emps.splice(i, 1);
  }

  // --- The thief moves -------------------------------------------------------
  const p = state.player;
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const moving = mx !== 0 || my !== 0;
  p.moving = moving;
  if (moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    const speed = (input.sneak ? PLAYER.sneakSpeed : PLAYER.speed) * dt;
    p.angle = Math.atan2(my, mx);
    moveCircle(state, mx * speed, my * speed);
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = input.sneak ? 0.55 : 0.34;
      if (state.audio) state.audio.step();
    }
  }

  // --- Tools -----------------------------------------------------------------
  const click = input.takeClick ? input.takeClick() : null;
  if (click && state.emp > 0) {
    state.emp -= 1;
    state.emps.push({ x: click.x, y: click.y, t: 0.6 });
    for (let i = 0; i < state.cameras.length; i += 1) {
      const c = state.cameras[i];
      if (Math.hypot(c.x - click.x, c.y - click.y) < 130) c.dark = CAMERA.empSeconds;
    }
    if (state.audio) state.audio.emp();
    say(state, 'EMP burst — cameras dark for 5s', 1.6);
  }
  if (input.smoke && state.smokeLeft > 0 && !state.smokeHeld) {
    state.smokeHeld = true;
    state.smokeLeft -= 1;
    state.smokes.push({ x: p.x, y: p.y, r: TOOLS.smokeRadius, t: TOOLS.smokeSeconds });
    if (state.audio) state.audio.smoke();
    say(state, 'Smoke out — you are invisible inside it', 1.6);
  }
  if (!input.smoke) state.smokeHeld = false;

  // --- Loot ------------------------------------------------------------------
  let nearLoot = null;
  for (let i = 0; i < state.loot.length; i += 1) {
    const l = state.loot[i];
    if (l.got) continue;
    if (Math.hypot(l.x - p.x, l.y - p.y) < 34) nearLoot = l;
  }
  if (nearLoot && nearLoot.kind !== 'vault' && input.interact) {
    nearLoot.got = true;
    state.lootGot += 1;
    state.score += nearLoot.value;
    if (state.audio) state.audio.pickup();
    say(state, `Loot secured — $${nearLoot.value} (+${nearLoot.value} pts)`, 1.8);
  }
  // The vault core needs a held lockpick: E held still for 2.5 seconds.
  if (nearLoot && nearLoot.kind === 'vault') {
    state.lockTarget = nearLoot;
    if (input.interact && !moving) {
      state.lockT += dt;
      if (state.audio && Math.floor(state.lockT * 4) !== Math.floor((state.lockT - dt) * 4)) state.audio.lockTick();
      if (state.lockT >= TOOLS.lockpickSeconds) {
        nearLoot.got = true;
        state.lootGot += 1;
        state.score += nearLoot.value;
        state.lockT = 0;
        if (state.audio) { state.audio.vaultOpen(); state.audio.pickup(); }
        say(state, 'Vault cracked — the core is yours', 2);
      }
    } else {
      state.lockT = 0;
    }
  } else {
    state.lockT = 0;
    state.lockTarget = null;
  }

  // --- Being seen -------------------------------------------------------------
  let seen = 0;
  for (let i = 0; i < state.guards.length; i += 1) {
    seen = Math.max(seen, guardSees(state.guards[i], p.x, p.y, state.walls, state.smokes));
  }
  for (let i = 0; i < state.cameras.length; i += 1) {
    seen = Math.max(seen, cameraSees(state.cameras[i], p.x, p.y, state.walls, state.smokes));
  }
  const sneak = input.sneak ? PLAYER.sneakFactor : 1;
  if (seen > 0) {
    // A camera's stare fills the meter faster than a guard's glance.
    const rate = GUARD.alarmRate * seen * sneak;
    state.alarm = Math.min(100, state.alarm + rate * dt);
    if (state.alarm > 55 && state.audio) state.audio.alarmStart();
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DRAIN * dt);
    if (state.audio) state.audio.alarmSet(0);
  }
  if (state.audio) state.audio.alarmSet(state.alarm / 100);
  if (state.level.alarmCreep) state.alarm = Math.min(100, state.alarm + state.level.alarmCreep * dt);

  // --- The bust ---------------------------------------------------------------
  if (state.alarm >= 100) {
    state.caughtT += dt;
    if (state.caughtT >= CAUGHT_GRACE) {
      return finishCaught(world, 'Spotted — the guards closed in.');
    }
  } else {
    state.caughtT = 0;
  }

  // --- The exit ----------------------------------------------------------------
  const allLoot = state.lootGot >= state.level.lootNeeded;
  const e = state.exit;
  const inExit = p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h;
  if (inExit && allLoot) {
    const timeBonus = Math.round(state.timeLeft) * 5;
    const toolBonus = (state.emp + state.smokeLeft) * 50;
    state.score += timeBonus + toolBonus;
    if (state.audio) { state.audio.alarmStop(); state.audio.win(); }
    if (state.levelIndex + 1 < LEVELS.length) {
      state.screen = SCREEN_LEVEL;
      return EVENT_LEVEL;
    }
    state.screen = SCREEN_WIN;
    return EVENT_WIN;
  }
  if (inExit && !allLoot) {
    say(state, `The door is sealed — grab ${state.level.lootNeeded - state.lootGot} more loot first`, 1.2);
  }
  return EVENT_NONE;
}

function finishCaught(world, why) {
  world.screen = SCREEN_CAUGHT;
  world.caughtWhy = why;
  if (world.audio) { world.audio.alarmStop(); world.audio.caught(); }
  return EVENT_CAUGHT;
}

/** Cones for the renderer: guards red, cameras amber, each clipped by walls. */
export function worldCones(world) {
  const out = [];
  for (let i = 0; i < world.guards.length; i += 1) {
    const g = world.guards[i];
    out.push({ kind: 'guard', pts: conePolygon(g.x, g.y, g.angle, GUARD.coneHalf, GUARD.coneRange, world.walls) });
  }
  for (let i = 0; i < world.cameras.length; i += 1) {
    const c = world.cameras[i];
    out.push({ kind: 'camera', dark: c.dark > 0, pts: cameraCone(c, world.walls) });
  }
  return out;
}
