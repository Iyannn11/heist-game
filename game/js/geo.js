// geo.js — small geometry helpers shared by guards, cameras and the player.
// All coordinates are canvas pixels. Walls are axis-aligned rectangles {x, y, w, h}.

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function dist2(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

// Smallest absolute difference between two angles, in radians.
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Does the segment (x1,y1)-(x2,y2) pass through any wall? Sampled in ~7px steps:
// cheap, robust, and good enough for vision cones on a 1280x800 board.
function segmentBlocked(x1, y1, x2, y2, walls) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 7));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    for (let w = 0; w < walls.length; w++) {
      if (pointInRect(px, py, walls[w])) return true;
    }
  }
  return false;
}

// Circle (cx, cy, r) vs rectangle collision: returns the push-out vector, or null.
function circleRectPush(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nx;
  const dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;
  if (d2 === 0) return { x: 0, y: -r };
  const d = Math.sqrt(d2);
  return { x: (dx / d) * (r - d), y: (dy / d) * (r - d) };
}

// Resolve a circle against every wall: move it out of all overlaps.
function resolveCircleWalls(p, r, walls) {
  for (let i = 0; i < 3; i++) {
    let moved = false;
    for (const w of walls) {
      const push = circleRectPush(p.x, p.y, r, w);
      if (push) {
        p.x += push.x;
        p.y += push.y;
        moved = true;
      }
    }
    if (!moved) break;
  }
}
