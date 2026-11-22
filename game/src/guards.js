// NEON VAULT — guards. One job: patrol a route and see through a vision cone.
// A guard walks its waypoints, pauses at each, and faces where it is going. It sees the
// thief only inside its cone AND with a clear line of sight (walls block the view).
import { GUARD } from './config.js';

/** True when the segment (x1,y1)-(x2,y2) crosses the rectangle r. */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

export function losClear(x1, y1, x2, y2, walls) {
  for (let i = 0; i < walls.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, walls[i])) return false;
  }
  return true;
}

/** Distance from (x,y) along direction (dx,dy) to the nearest wall, capped at maxDist. */
export function rayDistance(x, y, dx, dy, walls, maxDist) {
  let best = maxDist;
  for (let i = 0; i < walls.length; i += 1) {
    const r = walls[i];
    // Slab test, keeping the nearest positive hit.
    let tmin = 0;
    let tmax = best;
    let ok = true;
    if (dx === 0) {
      if (x < r.x || x > r.x + r.w) ok = false;
    } else {
      let t1 = (r.x - x) / dx;
      let t2 = (r.x + r.w - x) / dx;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) ok = false;
    }
    if (ok) {
      if (dy === 0) {
        if (y < r.y || y > r.y + r.h) ok = false;
      } else {
        let t1 = (r.y - y) / dy;
        let t2 = (r.y + r.h - y) / dy;
        if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) ok = false;
      }
    }
    if (ok && tmin < best && tmin >= 0) best = tmin;
  }
  return best;
}

export function makeGuard(def) {
  const start = def.waypoints[0];
  return {
    x: start[0],
    y: start[1],
    waypoints: def.waypoints,
    target: 1 % def.waypoints.length,
    speed: def.speed || GUARD.speed,
    angle: 0,
    pause: 0,
    // Stunned by nothing yet; kept for the EMP-vs-guard idea, unused by design.
    stun: 0,
  };
}

function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function turnToward(angle, target, maxStep) {
  let diff = target - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) <= maxStep) return target;
  return angle + Math.sign(diff) * maxStep;
}

export function stepGuard(guard, dt) {
  if (guard.stun > 0) {
    guard.stun -= dt;
    return;
  }
  if (guard.pause > 0) {
    guard.pause -= dt;
    return;
  }
  const wp = guard.waypoints[guard.target];
  const dx = wp[0] - guard.x;
  const dy = wp[1] - guard.y;
  const dist = Math.hypot(dx, dy);
  const want = angleTo(guard.x, guard.y, wp[0], wp[1]);
  guard.angle = turnToward(guard.angle, want, dt * 6);
  if (dist < 4) {
    guard.target = (guard.target + 1) % guard.waypoints.length;
    guard.pause = GUARD.pause;
    return;
  }
  const step = Math.min(dist, guard.speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
}

/** 0..1 how clearly this guard sees the point: 0 when out of cone, blocked, or in smoke. */
export function guardSees(guard, px, py, walls, smoke) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.coneRange) return 0;
  let diff = Math.atan2(dy, dx) - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD.coneHalf) return 0;
  if (!losClear(guard.x, guard.y, px, py, walls)) return 0;
  if (smoke) {
    for (let i = 0; i < smoke.length; i += 1) {
      const s = smoke[i];
      if (segmentHitsRect(guard.x, guard.y, px, py, { x: s.x - s.r, y: s.y - s.r, w: s.r * 2, h: s.r * 2 })) return 0;
    }
  }
  // Closer and more centred reads as clearer: the meter fills faster up close.
  const centre = 1 - Math.abs(diff) / GUARD.coneHalf;
  const near = 1 - (dist / GUARD.coneRange) * 0.5;
  return Math.max(0.25, centre * near);
}

/** The vision cone as a polygon, clipped by walls, for the renderer. */
export function conePolygon(x, y, angle, half, range, walls) {
  const rays = 22;
  const pts = [[x, y]];
  for (let i = 0; i <= rays; i += 1) {
    const a = angle - half + (2 * half * i) / rays;
    const d = rayDistance(x, y, Math.cos(a), Math.sin(a), walls, range);
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return pts;
}
