// camera.js — wall-mounted security cameras: a cone that sweeps back and forth.
// A camera fills your suspicion fast but never grabs you itself — it feeds the alarm.
// An EMP pulse freezes every camera for 8 seconds.

function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.angle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    t: Math.random() * 6,
    dir: def.angle,
    disabledT: 0,
    detect: 0,
  };
}

function cameraCanSee(c, px, py, walls, smokeBlocks) {
  if (c.disabledT > 0) return { seen: false, strength: 0 };
  const d = Math.hypot(px - c.x, py - c.y);
  if (d > c.range) return { seen: false, strength: 0 };
  const ang = Math.atan2(py - c.y, px - c.x);
  if (angleDiff(ang, c.dir) > 0.42) return { seen: false, strength: 0 };
  if (smokeBlocks && smokeBlocks(c.x, c.y, px, py)) return { seen: false, strength: 0 };
  if (segmentBlocked(c.x, c.y, px, py, walls)) return { seen: false, strength: 0 };
  return { seen: true, strength: 1.4 - (d / c.range) * 0.6 };
}

function updateCamera(c, dt, ctx) {
  c.t += dt;
  if (c.disabledT > 0) {
    c.disabledT -= dt;
    c.detect = Math.max(0, c.detect - dt);
    return;
  }
  c.dir = c.baseAngle + Math.sin(c.t * c.speed) * c.sweep;
  const p = ctx.player;
  const seen = cameraCanSee(c, p.x, p.y, ctx.walls, ctx.smokeBlocks);
  if (seen.seen) {
    c.detect = Math.min(1, c.detect + dt * 0.7 * seen.strength);
  } else {
    c.detect = Math.max(0, c.detect - dt * 0.4);
  }
  if (c.detect >= 1) {
    c.detect = 0.5;
    ctx.onSpotted(c);
  }
}
