// render.js — every pixel of AURUM HEIST: neon rooms, wall-clipped vision cones,
// loot, guards, cameras, HUD, minimap and all screens. Nothing here changes state.

function rayHit(x, y, angle, range, walls) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let d = 6; d <= range; d += 6) {
    const px = x + dx * d;
    const py = y + dy * d;
    for (const w of walls) {
      if (pointInRect(px, py, w)) return d;
    }
  }
  return range;
}

// A vision cone clipped by walls: cast rays across the arc, build the polygon.
function conePolygon(x, y, dir, half, range, walls, rays) {
  const pts = [[x, y]];
  const n = rays || 22;
  for (let i = 0; i <= n; i++) {
    const a = dir - half + (2 * half * i) / n;
    const d = rayHit(x, y, a, range, walls);
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return pts;
}

function drawCone(ctx, x, y, dir, half, range, walls, color, edge) {
  const pts = conePolygon(x, y, dir, half, range, walls);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const PALETTE = {
  floorA: '#171f3a',
  floorB: '#131a30',
  hud: '#0a0f24',
  wall: '#3d4f86',
  wallEdge: '#7ea4ff',
  caseGlass: 'rgba(140,200,255,0.16)',
  gold: '#fbbf24',
  cyan: '#22d3ee',
  red: '#f43f5e',
  green: '#34d399',
  orange: '#fb923c',
};

function drawFloor(ctx, G) {
  const b = G.room.bounds;
  ctx.fillStyle = '#0b1024';
  ctx.fillRect(0, 64, 1280, 736);
  if (G.room.skyline) drawSkyline(ctx, G);
  ctx.fillStyle = '#1b2547';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  const tile = 64;
  let ty = 0;
  for (let y = b.y; y < b.y + b.h; y += tile, ty++) {
    let tx = 0;
    for (let x = b.x + ((ty % 2) * tile) / 2; x < b.x + b.w; x += tile, tx++) {
      if ((tx * 7 + ty * 13) % 17 === 0) {
        ctx.fillStyle = '#232f57';
        ctx.fillRect(x, y, tile - 1, tile - 1);
      } else {
        ctx.fillStyle = '#161e3a';
        ctx.fillRect(x, y, tile - 1, tile - 1);
      }
    }
  }
  if (G.room.skyline) {
    // painted guide line from the stair door to the helipad
    ctx.strokeStyle = 'rgba(251,191,36,0.5)';
    ctx.setLineDash([14, 12]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(90, 700);
    ctx.lineTo(1050, 260);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = 'rgba(126,164,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
}

function drawSkyline(ctx, G) {
  const b = G.room.bounds;
  // city lights beyond the rooftop parapet, in the margin around the roof
  const buildings = [
    [0, 96, 90, 260], [100, 70, 70, 300], [180, 110, 110, 240], [300, 80, 80, 280],
    [390, 120, 60, 220], [460, 90, 120, 260], [590, 110, 70, 230], [670, 75, 90, 290],
    [770, 115, 100, 240], [880, 85, 75, 275], [965, 120, 90, 230], [1065, 95, 80, 265],
    [1155, 115, 125, 240],
  ];
  ctx.fillStyle = '#16204a';
  for (const [x, y, w, h] of buildings) {
    ctx.fillRect(x, 64 + (b.y - 64) - h + 46, w, h);
  }
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < 90; i++) {
    const bx = (i * 137) % 1280;
    const by = 76 + ((i * 89) % 150);
    if ((i * 7) % 3 === 0) ctx.fillRect(bx, by, 4, 5);
  }
  // moon
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(1180, 100, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(253,230,138,0.25)';
  ctx.beginPath();
  ctx.arc(1180, 100, 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawBlocks(ctx, G) {
  for (const bl of G.blocks) {
    const { x, y, w, h, kind } = bl;
    if (kind === 'wall') {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = PALETTE.wallEdge;
      ctx.fillRect(x, y, w, 3);
      ctx.fillRect(x, y, 3, h);
    } else if (kind === 'case') {
      ctx.fillStyle = '#22335f';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = PALETTE.caseGlass;
      ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      ctx.strokeStyle = '#8ec8ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(x + w / 2 - 14, y + h / 2 - 7, 28, 14);
    } else if (kind === 'crate') {
      ctx.fillStyle = '#5b4a2f';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#8a6d3b';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      ctx.moveTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.stroke();
    } else if (kind === 'desk') {
      ctx.fillStyle = '#2c2417';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#4a3a22';
      ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(x + 14, y + 12, 22, 16);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(x + 42, y + 14, 8, 8);
    } else if (kind === 'plant') {
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x + w / 2 - 5, y + h / 2 - 4, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'bench') {
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x, y, w, 6);
    } else if (kind === 'pillar') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + 4, y + 4, w - 8, 6);
    } else if (kind === 'ac') {
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#64748b';
      for (let i = 0; i < 5; i++) ctx.fillRect(x + 10, y + 10 + i * 13, w - 20, 5);
    } else if (kind === 'vent') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#475569';
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 8, y + 8 + i * 12, w - 16, 4);
    } else if (kind === 'vaultdoor') {
      ctx.fillStyle = '#78716c';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawLoot(ctx, G) {
  const pulse = 0.6 + 0.4 * Math.sin(G.time * 3);
  for (const l of G.loot) {
    if (l.taken) continue;
    const glow = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 34);
    glow.addColorStop(0, `rgba(251,191,36,${0.5 * pulse})`);
    glow.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 34, 0, Math.PI * 2);
    ctx.fill();
    if (l.kind === 'painting') {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(l.x - 22, l.y - 15, 44, 30);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(l.x - 18, l.y - 11, 36, 22);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(l.x - 18, l.y - 11, 36, 10);
      ctx.fillStyle = '#166534';
      ctx.fillRect(l.x - 18, l.y + 2, 36, 9);
    } else if (l.kind === 'gem') {
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 13);
      ctx.lineTo(l.x + 11, l.y);
      ctx.lineTo(l.x, l.y + 13);
      ctx.lineTo(l.x - 11, l.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(l.x - 3, l.y - 6);
      ctx.lineTo(l.x + 2, l.y - 2);
      ctx.lineTo(l.x - 2, l.y + 4);
      ctx.closePath();
      ctx.fill();
    } else if (l.kind === 'gold') {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(l.x - 14, l.y - 4, 28, 9);
      ctx.fillRect(l.x - 10, l.y - 12, 20, 8);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(l.x - 14, l.y - 4, 28, 3);
    } else if (l.kind === 'diamond') {
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 18);
      ctx.lineTo(l.x + 15, l.y - 4);
      ctx.lineTo(l.x + 10, l.y + 14);
      ctx.lineTo(l.x - 10, l.y + 14);
      ctx.lineTo(l.x - 15, l.y - 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(l.x - 4, l.y - 8);
      ctx.lineTo(l.x + 3, l.y - 3);
      ctx.lineTo(l.x - 2, l.y + 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$' + l.value, l.x, l.y + 30);
    ctx.textAlign = 'left';
  }
}

function drawLasers(ctx, G) {
  for (const L of G.lasers) {
    const on = laserIsOn(L, G.time);
    const x2 = L.vertical ? L.x : L.x + L.len;
    const y2 = L.vertical ? L.y + L.len : L.y;
    if (on) {
      ctx.strokeStyle = 'rgba(239,68,68,0.35)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(239,68,68,0.25)';
      ctx.setLineDash([4, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(L.x - 5, L.y - 5, 10, 10);
    ctx.fillRect(x2 - 5, y2 - 5, 10, 10);
    ctx.fillStyle = on ? '#ef4444' : '#64748b';
    ctx.beginPath();
    ctx.arc(L.x, L.y, 3, 0, Math.PI * 2);
    ctx.arc(x2, y2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function laserIsOn(L, t) {
  const phase = ((t + L.phase) % L.period) / L.period;
  return phase < L.onFrac;
}

function drawExit(ctx, G) {
  if (G.roomIndex === 2) {
    const hp = G.room.helipad;
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(hp.x, hp.y, hp.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(hp.x, hp.y, hp.r - 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 64px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('H', hp.x, hp.y + 22);
    ctx.textAlign = 'left';
    drawHelicopter(ctx, hp.x, hp.y - 10, G.time);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GETAWAY — REACH THE HELICOPTER', hp.x, hp.y + hp.r + 22);
    ctx.textAlign = 'left';
    return;
  }
  const e = G.room.exit;
  const open = G.exitOpen;
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  ctx.fillStyle = open ? 'rgba(52,211,153,0.25)' : 'rgba(244,63,94,0.25)';
  ctx.fillRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
  ctx.fillStyle = open ? '#34d399' : '#f43f5e';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  // labels go LEFT of the door (the door sits on the screen edge)
  ctx.fillStyle = '#0a0f24';
  ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', e.x - 12, cy + 4);
  ctx.textAlign = 'left';
  if (!open) {
    ctx.fillStyle = '#fda4af';
    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(G.roomIndex === 0 ? 'steal 3 pieces first' : 'the diamond first', e.x - 12, cy + 22);
    ctx.textAlign = 'left';
  }
}

function drawHelicopter(ctx, x, y, t) {
  const bob = Math.sin(t * 1.4) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#374151';
  ctx.fillRect(-34, -4, -22, 6);
  ctx.fillStyle = '#67e8f9';
  ctx.beginPath();
  ctx.ellipse(14, -3, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  const rotor = Math.sin(t * 22) * 40;
  ctx.strokeStyle = 'rgba(229,231,235,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rotor, -16);
  ctx.lineTo(rotor, -16);
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, -16, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGuards(ctx, G) {
  for (const g of G.guards) {
    const alerted = g.state === 'chase' || g.detect > 0.5;
    const coneColor = alerted ? 'rgba(255,64,64,0.30)' : 'rgba(255,214,64,0.20)';
    const coneEdge = alerted ? 'rgba(255,64,64,0.5)' : 'rgba(255,214,64,0.35)';
    drawCone(ctx, g.x, g.y, g.dir, guardConeHalf(g), guardVisionRange(g), G.walls, coneColor, coneEdge);
  }
  for (const c of G.cameras) {
    if (c.disabledT > 0) {
      drawCone(ctx, c.x, c.y, c.dir, 0.42, c.range, G.walls, 'rgba(148,163,184,0.10)', null);
    } else {
      drawCone(ctx, c.x, c.y, c.dir, 0.42, c.range, G.walls, 'rgba(255,150,60,0.22)', 'rgba(255,150,60,0.4)');
    }
  }
  for (const c of G.cameras) {
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.disabledT > 0 ? '#64748b' : '#fb923c';
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.dir) * 5, c.y + Math.sin(c.dir) * 5, 4, 0, Math.PI * 2);
    ctx.fill();
    if (c.detect > 0.4) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', c.x, c.y - 14);
      ctx.textAlign = 'left';
    }
  }
  for (const g of G.guards) {
    const alerted = g.state === 'chase';
    if (g.kind === 'dog') {
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, 14, 9, g.dir, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.dir) * 12, g.y + Math.sin(g.dir) * 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.dir) * 12 - Math.sin(g.dir) * 4, g.y + Math.sin(g.dir) * 12 + Math.cos(g.dir) * 4, 2.5, 0, Math.PI * 2);
      ctx.arc(g.x + Math.cos(g.dir) * 12 + Math.sin(g.dir) * 4, g.y + Math.sin(g.dir) * 12 - Math.cos(g.dir) * 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = alerted ? '#dc2626' : '#be123c';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fecdd3';
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.dir) * 5, g.y + Math.sin(g.dir) * 5, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.dir) * 7, g.y + Math.sin(g.dir) * 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (g.detect > 0.25 || g.state !== 'patrol') {
      ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      if (g.state === 'chase') {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('!', g.x, g.y - 18);
      } else if (g.detect > 0.25) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('?', g.x, g.y - 18);
      }
      ctx.textAlign = 'left';
    }
    if (g.detect > 0.05 && g.detect < 1) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.detect);
      ctx.stroke();
    }
  }
}

function drawPlayer(ctx, G) {
  const p = G.player;
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(34,211,238,0.4)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (p.dashT > 0) {
    ctx.strokeStyle = 'rgba(34,211,238,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#0e7490';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#164e63';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.dir) * 5, p.y + Math.sin(p.dir) * 5, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // little thief mask
  ctx.strokeStyle = '#164e63';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.dir + 0.5) * 9, p.y + Math.sin(p.dir + 0.5) * 9);
  ctx.lineTo(p.x + Math.cos(p.dir - 0.5) * 9, p.y + Math.sin(p.dir - 0.5) * 9);
  ctx.stroke();
}

function drawSmoke(ctx, G) {
  for (const s of G.smokes) {
    const a = Math.min(1, s.t / 0.4) * Math.min(1, (s.life - s.t) / 1.2 + 0.4);
    ctx.fillStyle = `rgba(203,213,225,${0.5 * Math.max(0, a)})`;
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2 + s.seed;
      const rr = s.r * (0.45 + 0.4 * Math.sin(s.seed * 3 + i));
      ctx.beginPath();
      ctx.arc(s.x + Math.cos(ang) * rr * 0.5, s.y + Math.sin(ang) * rr * 0.5, rr * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawParticles(ctx, G) {
  for (const pt of G.particles) {
    const a = Math.max(0, 1 - pt.t / pt.life);
    ctx.fillStyle = pt.color.replace('A', a.toFixed(2));
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * a + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function alarmLabel(v) {
  if (v >= 90) return 'LOCKDOWN';
  if (v >= 60) return 'HUNTED';
  if (v >= 30) return 'SUSPICIOUS';
  return 'CALM';
}

function alarmColor(v) {
  if (v >= 90) return '#ef4444';
  if (v >= 60) return '#f97316';
  if (v >= 30) return '#fbbf24';
  return '#34d399';
}

function drawHUD(ctx, G) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('AURUM HEIST', 14, 26);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(G.room.name, 14, 46);
  // objective
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(G.room.objective, 300, 26);
  // loot
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('$' + G.lootValue.toLocaleString(), 300, 48);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px "Segoe UI", system-ui, sans-serif';
  const takenCount = G.loot.filter((l) => l.taken).length;
  ctx.fillText(`loot ${takenCount}/${G.loot.length}   ·   time ${fmtTime(G.elapsed)}`, 420, 48);
  // tools
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`EMP ×${G.player.emp} [F]`, 700, 26);
  ctx.fillText(`SMOKE ×${G.player.smoke} [Q]`, 830, 26);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('dash [Space] · sneak [Shift]', 700, 46);
  ctx.fillText(AudioSys.muted ? 'sound OFF [M]' : 'sound on [M]', 880, 46);
  // alarm meter
  const ax = 1010;
  const aw = 256;
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, ax, 14, aw, 18, 4);
  ctx.fill();
  ctx.fillStyle = alarmColor(G.alarm);
  if (G.alarm > 0) {
    roundRect(ctx, ax, 14, (aw * G.alarm) / 100, 18, 4);
    ctx.fill();
  }
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  roundRect(ctx, ax, 14, aw, 18, 4);
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`ALARM ${Math.round(G.alarm)}% — ${alarmLabel(G.alarm)}`, ax, 48);
  if (G.alarm >= 60) {
    ctx.fillStyle = G.time % 0.6 < 0.3 ? '#ef4444' : '#fca5a5';
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('⚠ GUARDS ARE HUNTING YOU', ax, 62);
  }
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss < 10 ? '0' : ''}${ss}`;
}

function drawMinimap(ctx, G) {
  const mx = 1050;
  const my = 660;
  const mw = 216;
  const mh = 124;
  const b = G.room.bounds;
  const sx = mw / b.w;
  const sy = mh / b.h;
  ctx.fillStyle = 'rgba(10,15,36,0.88)';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mx, my, mw, mh);
  const X = (x) => mx + (x - b.x) * sx;
  const Y = (y) => my + (y - b.y) * sy;
  ctx.fillStyle = '#334155';
  for (const bl of G.blocks) ctx.fillRect(X(bl.x), Y(bl.y), Math.max(1, bl.w * sx), Math.max(1, bl.h * sy));
  for (const l of G.loot) {
    if (l.taken) continue;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(X(l.x), Y(l.y), 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const c of G.cameras) {
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.arc(X(c.x), Y(c.y), 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const g of G.guards) {
    ctx.fillStyle = g.state === 'chase' ? '#ef4444' : '#f43f5e';
    ctx.beginPath();
    ctx.arc(X(g.x), Y(g.y), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (G.roomIndex === 2 && G.room.helipad) {
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(X(G.room.helipad.x), Y(G.room.helipad.y), 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (G.room.exit) {
    ctx.fillStyle = G.exitOpen ? '#34d399' : '#f43f5e';
    ctx.fillRect(X(G.room.exit.x) - 3, Y(G.room.exit.y) - 3, 6, 10);
  }
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(X(G.player.x), Y(G.player.y), 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(X(G.player.x), Y(G.player.y), 4.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('MAP', mx + 4, my + 11);
}

function drawToast(ctx, G) {
  if (!G.toast || G.toastT <= 0) return;
  const a = Math.min(1, G.toastT);
  ctx.fillStyle = `rgba(10,15,36,${0.85 * a})`;
  const w = ctx.measureText(G.toast).width + 36;
  roundRect(ctx, 640 - w / 2, 76, w, 30, 6);
  ctx.fill();
  ctx.fillStyle = `rgba(253,230,138,${a})`;
  ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(G.toast, 640, 96);
  ctx.textAlign = 'left';
}

function drawLockpick(ctx, G) {
  const L = Lockpick;
  ctx.fillStyle = 'rgba(5,8,20,0.72)';
  ctx.fillRect(0, 64, 1280, 736);
  const px = 430;
  const py = 300;
  const pw = 420;
  const ph = 210;
  ctx.fillStyle = '#0f172a';
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CRACKING: ' + (L.target ? L.target.label : 'LOCK'), 640, py + 34);
  ctx.textAlign = 'left';
  for (let i = 0; i < L.pins; i++) {
    ctx.fillStyle = i < L.pin ? '#34d399' : '#334155';
    ctx.beginPath();
    ctx.arc(640 - ((L.pins - 1) * 18) + i * 36, py + 58, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  const bx = px + 40;
  const by = py + 96;
  const bw = pw - 80;
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, bx, by, bw, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#34d399';
  ctx.fillRect(bx + L.zone * bw, by, L.zoneW * bw, 26);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(bx + L.needle * bw - 2, by - 6, 4, 38);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE or CLICK to stop the needle in the green zone', 640, py + 156);
  ctx.fillText('ESC to back away — a miss feeds the alarm', 640, py + 178);
  ctx.textAlign = 'left';
}

function drawRoomCard(ctx, G) {
  const a = G.cardT > 1 ? (1.4 - G.cardT) / 0.4 : 1;
  ctx.fillStyle = `rgba(5,8,20,${0.75 * a})`;
  ctx.fillRect(0, 64, 1280, 736);
  ctx.fillStyle = `rgba(34,211,238,${a})`;
  ctx.font = 'bold 44px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(G.room.name, 640, 380);
  ctx.fillStyle = `rgba(226,232,240,${a})`;
  ctx.font = '18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(G.room.sub, 640, 420);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, G) {
  ctx.fillStyle = '#0a0f24';
  ctx.fillRect(0, 0, 1280, 800);
  drawSkyline(ctx, { room: { bounds: { x: 0, y: 700, w: 1280, h: 100 } }, time: G.time });
  ctx.fillStyle = 'rgba(10,15,36,0.55)';
  ctx.fillRect(0, 0, 1280, 800);
  const pulse = 0.7 + 0.3 * Math.sin(G.time * 2.4);
  ctx.fillStyle = `rgba(34,211,238,${pulse})`;
  ctx.font = 'bold 92px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AURUM', 640, 250);
  ctx.fillStyle = `rgba(251,191,36,${pulse})`;
  ctx.fillText('HEIST', 640, 340);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '20px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Three rooms. One diamond. Zero witnesses.', 640, 390);
  ctx.font = '15px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('WASD / arrows — move      Shift — sneak      Space — dash', 640, 450);
  ctx.fillText('E — grab / crack a lock      Q — smoke bomb      F — EMP pulse', 640, 478);
  ctx.fillText('Dodge the cones. Read the patrols. Mind the cameras. Get out rich.', 640, 510);
  ctx.fillStyle = `rgba(52,211,153,${0.6 + 0.4 * Math.sin(G.time * 3)})`;
  ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('PRESS ENTER TO START THE JOB', 640, 580);
  ctx.fillStyle = '#fbbf24';
  ctx.font = '15px "Segoe UI", system-ui, sans-serif';
  if (G.best > 0) ctx.fillText('Best score: ' + G.best.toLocaleString(), 640, 620);
  ctx.textAlign = 'left';
}

function drawPaused(ctx, G) {
  ctx.fillStyle = 'rgba(5,8,20,0.7)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 44px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 640, 360);
  ctx.font = '16px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('P / Esc — resume      M — sound      R — restart the job', 640, 410);
  ctx.textAlign = 'left';
}

function drawBusted(ctx, G) {
  ctx.fillStyle = 'rgba(60,5,10,0.78)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = '#fca5a5';
  ctx.font = 'bold 56px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BUSTED!', 640, 330);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(G.bustedReason || 'A guard got a hand on you.', 640, 380);
  ctx.fillText(`Loot kept from finished rooms: $${G.keptValue.toLocaleString()}`, 640, 420);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Press R to retry this room', 640, 480);
  ctx.textAlign = 'left';
}

function drawWin(ctx, G) {
  ctx.fillStyle = 'rgba(4,20,12,0.82)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 54px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLEAN GETAWAY!', 640, 280);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 30px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('The Aurum Diamond is yours — $' + G.lootValue.toLocaleString() + ' in loot', 640, 340);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`Time ${fmtTime(G.elapsed)}   ·   Alarms raised ${G.alarmsRaised}   ·   Times spotted ${G.timesSpotted}`, 640, 390);
  ctx.fillText(`Ghost bonus (never spotted): ${G.ghost ? '+500' : '—'}      Speed bonus: +${G.speedBonus}`, 640, 424);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('SCORE  ' + G.score.toLocaleString(), 640, 480);
  if (G.score > G.best) {
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('NEW BEST SCORE!', 640, 516);
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Best: ' + G.best.toLocaleString(), 640, 516);
  }
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Press R to run it again', 640, 570);
  ctx.textAlign = 'left';
}

function drawGame(ctx, G) {
  if (G.state === 'title') {
    drawTitle(ctx, G);
    return;
  }
  drawFloor(ctx, G);
  drawLoot(ctx, G);
  drawBlocks(ctx, G);
  drawLasers(ctx, G);
  drawExit(ctx, G);
  drawGuards(ctx, G);
  drawPlayer(ctx, G);
  drawSmoke(ctx, G);
  drawParticles(ctx, G);
  drawHUD(ctx, G);
  drawMinimap(ctx, G);
  drawToast(ctx, G);
  if (G.flashT > 0) {
    ctx.fillStyle = `rgba(239,68,68,${0.18 * G.flashT})`;
    ctx.fillRect(0, 64, 1280, 736);
  }
  if (G.state === 'lockpick') drawLockpick(ctx, G);
  if (G.state === 'roomcard') drawRoomCard(ctx, G);
  if (G.state === 'paused') drawPaused(ctx, G);
  if (G.state === 'busted') drawBusted(ctx, G);
  if (G.state === 'win') drawWin(ctx, G);
}
