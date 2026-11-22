// guard.js — patrol guards and the K-9 dog: waypoints, vision cones, suspicion,
// chase and return. A guard sees you when you are inside its cone, close enough,
// and no wall stands between you. Getting very close is heard, not seen.

function makeGuard(def) {
  return {
    x: def.x,
    y: def.y,
    kind: def.kind || 'guard',
    path: def.path.map((p) => ({ x: p[0], y: p[1] })),
    wp: 0,
    speed: def.speed,
    dir: def.path.length > 1
      ? Math.atan2(def.path[1][1] - def.y, def.path[1][0] - def.x)
      : 0,
    state: 'patrol', // patrol | chase | investigate | return
    detect: 0,
    pauseT: 0,
    lookT: 0,
    lastSeen: null,
    lostT: 0,
    r: 11,
  };
}

function guardVisionRange(g) {
  return g.kind === 'dog' ? 150 : 175;
}

function guardConeHalf(g) {
  return g.kind === 'dog' ? 0.42 : 0.5;
}

// Returns { seen, strength }. strength scales how fast the suspicion fills.
function guardCanSee(g, px, py, walls, sneaking, smokeBlocks) {
  const d = Math.hypot(px - g.x, py - g.y);
  const hearR = g.kind === 'dog' ? 72 : 34;
  if (smokeBlocks && smokeBlocks(g.x, g.y, px, py)) return { seen: false, strength: 0 };
  if (d < hearR * 0.6) return { seen: true, strength: 1.3 };
  if (d < hearR && !sneaking) return { seen: true, strength: 1.5 };
  const range = guardVisionRange(g);
  if (d > range) return { seen: false, strength: 0 };
  const ang = Math.atan2(py - g.y, px - g.x);
  if (angleDiff(ang, g.dir) > guardConeHalf(g)) return { seen: false, strength: 0 };
  if (segmentBlocked(g.x, g.y, px, py, walls)) return { seen: false, strength: 0 };
  const strength = (1.35 - d / range) * (sneaking ? 0.45 : 1);
  return { seen: true, strength };
}

function turnToward(g, targetAngle, dt) {
  let d = targetAngle - g.dir;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const maxTurn = 4.5 * dt;
  g.dir += Math.max(-maxTurn, Math.min(maxTurn, d));
}

function moveGuardToward(g, tx, ty, speed, dt, walls) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  g.x += (dx / d) * step;
  g.y += (dy / d) * step;
  turnToward(g, Math.atan2(dy, dx), dt);
  resolveCircleWalls(g, g.r, walls);
  return d - step < 3;
}

function updateGuard(g, dt, ctx) {
  const p = ctx.player;
  const seen = guardCanSee(g, p.x, p.y, ctx.walls, p.sneaking, ctx.smokeBlocks);
  if (seen.seen) {
    g.detect = Math.min(1, g.detect + dt * 0.55 * seen.strength);
    g.lastSeen = { x: p.x, y: p.y };
    g.lostT = 0;
  } else {
    g.detect = Math.max(0, g.detect - dt * 0.35);
    g.lostT += dt;
  }

  if (g.detect >= 1 && g.state !== 'chase') {
    g.state = 'chase';
    g.detect = 0.6;
    ctx.onSpotted(g);
  }

  const fast = ctx.alarm >= 60 ? 1.25 : 1;
  const chaseSpeed = g.speed * fast * (g.kind === 'dog' ? 1.55 : 1.7);

  if (g.state === 'chase') {
    const arrived = moveGuardToward(g, p.x, p.y, chaseSpeed, dt, ctx.walls);
    if (arrived || g.lostT > 3) {
      g.state = 'investigate';
      g.lookT = 2;
    }
  } else if (g.state === 'investigate') {
    if (g.lastSeen) {
      const arrived = moveGuardToward(g, g.lastSeen.x, g.lastSeen.y, g.speed * fast, dt, ctx.walls);
      if (arrived) {
        g.lookT -= dt;
        g.dir += dt * 1.6; // scan the area
        if (g.lookT <= 0) {
          g.state = 'return';
          g.lastSeen = null;
        }
      }
    } else {
      g.state = 'return';
    }
  } else if (g.state === 'return') {
    const home = g.path[0];
    const arrived = moveGuardToward(g, home.x, home.y, g.speed * fast, dt, ctx.walls);
    if (arrived) {
      g.state = 'patrol';
      g.wp = 0;
    }
  } else {
    // patrol
    if (g.pauseT > 0) {
      g.pauseT -= dt;
      g.dir += dt * 0.7; // idle scan at each waypoint
    } else {
      const target = g.path[g.wp];
      const arrived = moveGuardToward(g, target.x, target.y, g.speed * fast, dt, ctx.walls);
      if (arrived) {
        g.wp = (g.wp + 1) % g.path.length;
        g.pauseT = 0.9;
      }
    }
  }

  // A rising alarm makes idle guards drift toward the last known position.
  if (g.state === 'patrol' && ctx.alarm >= 30 && g.lastSeen && Math.random() < dt * 0.25) {
    g.state = 'investigate';
    g.lookT = 1.5;
  }
}
