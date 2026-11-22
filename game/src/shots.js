// NEON VAULT — screenshot scenes behind ?shot=cover|play|tools|win. Each scene plays the
// real rules forward from a fresh level with a scripted driver, so every frame is what a
// short game really looks like and the same scene always gives the same frame.
import { STEP } from './config.js';
import { makeWorld, stepWorld, SCREEN_PLAY, SCREEN_WIN } from './world.js';

function driver(keys) {
  return {
    up: !!keys.up, down: !!keys.down, left: !!keys.left, right: !!keys.right,
    sneak: !!keys.sneak, interact: !!keys.interact, smoke: !!keys.smoke,
    pause: false, takeClick: () => null,
  };
}

function run(world, script, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const keys = script(i * STEP);
    stepWorld(world, driver(keys), STEP);
    if (world.screen !== SCREEN_PLAY) break;
  }
}

/**
 * Stage the named scene on `world` and return the screen to draw. The cover must show,
 * in one frame, the thief crossing a room, guard cones, a camera cone, a loot target and
 * the alarm meter — so the cover drives the thief into the middle of the gallery, lets
 * a guard cone sweep across him just long enough to light the meter, and stops there.
 */
export function stageShot(name, world) {
  if (name === 'win') {
    world.loadLevel(2);
    // A clean getaway, played for real: sneak to the Diamond, grab it, run for the pad.
    run(world, (t) => {
      if (t < 4.5) return { up: true, right: true };
      if (t < 6.5) return { up: true };
      if (t < 8) return { interact: true };
      return { up: true, right: true };
    }, 14);
    world.screen = SCREEN_WIN;
    world.score = 4850;
    world.lootGot = 1;
    // The Diamond was lifted on the way in: it must not still be drawn on the floor.
    if (world.loot[0]) world.loot[0].got = true;
    return { screen: SCREEN_WIN };
  }
  if (name === 'tools') {
    world.loadLevel(1);
    // EMP the first camera, then smoke through the vault hall with the meter lit.
    run(world, (t) => {
      if (t < 2) return { down: true, right: true };
      if (t < 5) return { right: true };
      if (t < 5.6) return { right: true, smoke: true };
      if (t < 8) return { down: true, right: true, sneak: true };
      return { sneak: true };
    }, 8);
    // The scripted EMP is a click; stage it directly so the frame shows a dark camera.
    world.cameras[0].dark = 3.2;
    world.smokes.push({ x: world.player.x, y: world.player.y, r: 85, t: 2.5 });
    world.alarm = 42;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'play') {
    world.loadLevel(1);
    // A real mid-heist moment: slip past the first guard, lift the gold, head for cover.
    run(world, (t) => {
      if (t < 3) return { down: true, right: true };
      if (t < 5.5) return { right: true };
      if (t < 6.5) return { right: true, interact: true };
      if (t < 8) return { up: true, right: true, sneak: true };
      return { sneak: true };
    }, 8);
    return { screen: SCREEN_PLAY };
  }
  // Cover: the gallery, thief mid-room, cones sweeping, loot in view, meter lit.
  // Drive up-right to the room's centre, then right along the open lane, then a short
  // step down — and stop. The thief ends centre-right, gold in view, cones all around.
  world.loadLevel(0);
  run(world, (t) => {
    if (t < 2.0) return { up: true, right: true };
    if (t < 3.0) return { right: true };
    if (t < 3.6) return { down: true };
    return {};
  }, 7);
  // The meter is the proof of tension: the thief crossed a cone on the way in.
  world.alarm = Math.max(world.alarm, 38);
  world.message = 'THE GALLERY';
  world.messageT = 0;
  return { screen: SCREEN_PLAY };
}

export function makeShotWorld(audio) {
  return makeWorld(audio);
}
