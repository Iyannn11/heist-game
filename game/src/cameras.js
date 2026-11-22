// NEON VAULT — security cameras. One job: sweep a cone back and forth on a wall mount.
// A camera is fixed in place and rotates around a base angle. An EMP throws it dark for a
// few seconds; while dark it sees nothing and its cone is drawn dead grey.
import { CAMERA } from './config.js';
import { conePolygon, losClear } from './guards.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    speed: def.speed,
    // Deterministic phase from the mount point, so the same scene always sweeps the same way.
    phase: (((def.x * 7 + def.y * 13) % 628) / 100),
    dark: 0,
  };
}

export function stepCamera(camera, dt, time) {
  if (camera.dark > 0) camera.dark -= dt;
  camera.angle = camera.base + Math.sin(time * camera.speed + camera.phase) * camera.sweep;
}

/** 0..1 how clearly this camera sees the point; 0 while dark. */
export function cameraSees(camera, px, py, walls, smoke) {
  if (camera.dark > 0) return 0;
  const dx = px - camera.x;
  const dy = py - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA.coneRange) return 0;
  let diff = Math.atan2(dy, dx) - camera.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA.coneHalf) return 0;
  if (!losClear(camera.x, camera.y, px, py, walls)) return 0;
  if (smoke) {
    for (let i = 0; i < smoke.length; i += 1) {
      const s = smoke[i];
      const d = Math.hypot(px - s.x, py - s.y);
      if (d < s.r) return 0;
    }
  }
  const centre = 1 - Math.abs(diff) / CAMERA.coneHalf;
  return Math.max(0.3, centre);
}

export function cameraCone(camera, walls) {
  return conePolygon(camera.x, camera.y, camera.angle, CAMERA.coneHalf, CAMERA.coneRange, walls);
}
