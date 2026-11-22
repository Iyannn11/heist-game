// NEON VAULT — the renderer. One job: draw the world. It reads state, never changes it.
// The look: a dark-blue museum floor, red guard cones, amber camera cones, gold loot,
// a cyan thief. Everything a player needs is readable at a glance, even shrunk.
import { FIELD, COLORS, PLAYER, GUARD, CAMERA } from './config.js';
import { worldCones } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, cone) {
  const pts = cone.pts;
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (cone.kind === 'guard') {
    ctx.fillStyle = COLORS.cone;
    ctx.strokeStyle = COLORS.coneEdge;
  } else if (cone.dark) {
    ctx.fillStyle = 'rgba(120, 130, 150, 0.10)';
    ctx.strokeStyle = 'rgba(140, 150, 170, 0.3)';
  } else {
    ctx.fillStyle = COLORS.camCone;
    ctx.strokeStyle = COLORS.camConeEdge;
  }
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floorB;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const tile = 60;
  for (let y = 0; y < FIELD.height; y += tile) {
    for (let x = 0; x < FIELD.width; x += tile) {
      if (((x / tile) + (y / tile)) % 2 === 0) {
        ctx.fillStyle = COLORS.floorA;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  // A faint neon grid so the room reads as a place, not a void.
  ctx.strokeStyle = 'rgba(70, 110, 200, 0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= FIELD.width; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD.height); ctx.stroke();
  }
  for (let y = 0; y <= FIELD.height; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD.width, y); ctx.stroke();
  }
}

function drawWalls(ctx, walls) {
  for (let i = 0; i < walls.length; i += 1) {
    const w = walls[i];
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    if (w.h <= 18) ctx.fillRect(w.x, w.y, w.w, 4);
    else ctx.fillRect(w.x, w.y, 4, w.h);
  }
}

function drawLoot(ctx, loot, time) {
  for (let i = 0; i < loot.length; i += 1) {
    const l = loot[i];
    if (l.got) continue;
    const bob = Math.sin(time * 2.4 + i * 1.7) * 2;
    ctx.save();
    ctx.translate(l.x, l.y + bob);
    ctx.fillStyle = COLORS.lootGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    if (l.kind === 'painting') {
      ctx.fillStyle = '#7a5a1e';
      ctx.fillRect(-16, -12, 32, 24);
      ctx.fillStyle = '#e8b64c';
      ctx.fillRect(-13, -9, 26, 18);
      ctx.fillStyle = '#3f6fb5';
      ctx.fillRect(-13, -9, 26, 8);
      ctx.fillStyle = '#f5c542';
      ctx.beginPath(); ctx.arc(4, 4, 5, 0, Math.PI * 2); ctx.fill();
    } else if (l.kind === 'gold') {
      ctx.fillStyle = '#8a6d1f';
      ctx.beginPath();
      ctx.moveTo(-13, 8); ctx.lineTo(-8, -8); ctx.lineTo(8, -8); ctx.lineTo(13, 8); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COLORS.loot;
      ctx.beginPath();
      ctx.moveTo(-10, 6); ctx.lineTo(-6, -6); ctx.lineTo(6, -6); ctx.lineTo(10, 6); ctx.closePath();
      ctx.fill();
    } else if (l.kind === 'vault') {
      ctx.fillStyle = '#4a4f5e';
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9cedb';
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b2f3a';
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b2f3a';
      ctx.lineWidth = 2;
      for (let a = 0; a < 8; a += 1) {
        const an = (a / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(an) * 6, Math.sin(an) * 6);
        ctx.lineTo(Math.cos(an) * 11, Math.sin(an) * 11);
        ctx.stroke();
      }
    } else {
      // The Diamond: a faceted gem that catches the eye from anywhere.
      ctx.fillStyle = '#b8f1ff';
      ctx.beginPath();
      ctx.moveTo(0, -16); ctx.lineTo(13, -4); ctx.lineTo(8, 13); ctx.lineTo(-8, 13); ctx.lineTo(-13, -4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-13, -4); ctx.lineTo(13, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, 13); ctx.stroke();
    }
    ctx.restore();
  }
}

function drawExit(ctx, exit, open, time) {
  const pulse = open ? 0.55 + Math.sin(time * 5) * 0.25 : 0.3;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.restore();
  ctx.strokeStyle = COLORS.exit;
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = '#eafff3';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'ESCAPE' : 'LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
}

function drawGuards(ctx, guards) {
  for (let i = 0; i < guards.length; i += 1) {
    const g = guards[i];
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath(); ctx.ellipse(0, 4, 15, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath(); ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.guardDark;
    ctx.beginPath(); ctx.arc(0, 0, GUARD.radius - 5, 0, Math.PI * 2); ctx.fill();
    // Facing tick: the guard looks where its cone points.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(g.angle) * (GUARD.radius + 5), Math.sin(g.angle) * (GUARD.radius + 5));
    ctx.stroke();
    ctx.restore();
  }
}

function drawCameras(ctx, cameras) {
  for (let i = 0; i < cameras.length; i += 1) {
    const c = cameras[i];
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = c.dark > 0 ? '#5a6270' : COLORS.camera;
    roundRect(ctx, -3, -7, 22, 14, 4);
    ctx.fill();
    ctx.fillStyle = c.dark > 0 ? '#3a4048' : '#fff3c4';
    ctx.beginPath(); ctx.arc(19, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Wall mount.
    ctx.fillStyle = '#39415a';
    ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPlayer(ctx, player, sneaking) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath(); ctx.ellipse(0, 4, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(player.angle);
  // A hooded thief: cloak body, hood, and a glinting mask line.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath(); ctx.arc(0, 0, PLAYER.radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath(); ctx.arc(-3, 0, PLAYER.radius - 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#eafcff';
  ctx.beginPath(); ctx.arc(6, -4, 2.4, 0, Math.PI * 2); ctx.arc(6, 4, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0b2b38';
  ctx.fillRect(6, -2, 7, 4);
  ctx.restore();
  if (sneaking) {
    ctx.strokeStyle = 'rgba(45, 212, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(player.x, player.y, PLAYER.radius + 5, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawTools(ctx, world) {
  for (let i = 0; i < world.smokes.length; i += 1) {
    const s = world.smokes[i];
    ctx.fillStyle = COLORS.smoke;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220, 230, 245, 0.5)';
    ctx.beginPath(); ctx.arc(s.x - 20, s.y - 12, 18, 0, Math.PI * 2); ctx.arc(s.x + 22, s.y + 10, 16, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < world.emps.length; i += 1) {
    const e = world.emps[i];
    ctx.strokeStyle = 'rgba(120, 220, 255, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(e.x, e.y, 26 - e.t * 30, 0, Math.PI * 2); ctx.stroke();
  }
  // Lockpick progress ring over the vault.
  if (world.lockTarget && world.lockT > 0) {
    const l = world.lockTarget;
    const frac = world.lockT / 2.5;
    ctx.strokeStyle = 'rgba(245, 197, 66, 0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(l.x, l.y, 26, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PICKING…', l.x, l.y - 32);
  }
}

function drawHud(ctx, world) {
  const pad = 12;
  ctx.save();
  // Top bar: level, loot, tools, timer, score.
  ctx.fillStyle = 'rgba(8, 12, 26, 0.72)';
  roundRect(ctx, pad, pad, FIELD.width - pad * 2, 46, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.level.name, pad + 14, pad + 24);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`LOOT ${world.lootGot}/${world.level.lootNeeded}`, 210, pad + 24);
  ctx.fillStyle = COLORS.loot;
  ctx.fillText(`EMP ${world.emp}   SMOKE ${world.smokeLeft}`, 330, pad + 24);
  ctx.fillStyle = world.timeLeft < 20 ? '#ff7a6e' : COLORS.text;
  ctx.fillText(`⏱ ${Math.ceil(world.timeLeft)}s`, 540, pad + 24);
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${world.score}`, FIELD.width - pad - 14, pad + 24);
  ctx.textAlign = 'left';

  // Alarm meter, bottom centre: the tension gauge.
  const mw = 340;
  const mx = (FIELD.width - mw) / 2;
  const my = FIELD.height - 40;
  ctx.fillStyle = 'rgba(8, 12, 26, 0.72)';
  roundRect(ctx, mx - 52, my - 8, mw + 104, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#ff5a4e';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ALARM', mx - 48, my + 7);
  ctx.fillStyle = '#232c48';
  roundRect(ctx, mx, my, mw, 14, 7);
  ctx.fill();
  const frac = world.alarm / 100;
  const grad = ctx.createLinearGradient(mx, 0, mx + mw, 0);
  grad.addColorStop(0, '#ffb02e');
  grad.addColorStop(0.6, '#ff7a3c');
  grad.addColorStop(1, '#ff3b30');
  ctx.fillStyle = grad;
  if (frac > 0.01) {
    roundRect(ctx, mx, my, Math.max(14, mw * frac), 14, 7);
    ctx.fill();
  }
  if (world.alarm >= 100) {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('SPOTTED!', mx + mw + 8, my + 7);
  }
  ctx.restore();

  // Toast message under the top bar.
  if (world.messageT > 0 && world.message) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, world.messageT);
    ctx.fillStyle = 'rgba(8, 12, 26, 0.8)';
    ctx.font = '14px system-ui, sans-serif';
    const w = ctx.measureText(world.message).width + 28;
    roundRect(ctx, (FIELD.width - w) / 2, 66, w, 30, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(world.message, FIELD.width / 2, 82);
    ctx.restore();
  }
  // Controls hint, bottom left.
  ctx.fillStyle = 'rgba(147, 164, 207, 0.85)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('WASD move · Shift sneak · E grab / pick · Click EMP · F smoke · P pause', pad, FIELD.height - 14);
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 9, 20, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent || COLORS.text;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText(title, FIELD.width / 2, 190);
  ctx.fillStyle = COLORS.text;
  ctx.font = '17px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, FIELD.width / 2, 250 + i * 30);
  });
}

export function render(ctx, world, input) {
  const time = world.time;
  drawFloor(ctx);
  const cones = worldCones(world);
  for (let i = 0; i < cones.length; i += 1) drawCone(ctx, cones[i]);
  drawWalls(ctx, world.walls);
  drawLoot(ctx, world.loot, time);
  drawExit(ctx, world.exit, world.lootGot >= world.level.lootNeeded, time);
  drawCameras(ctx, world.cameras);
  drawGuards(ctx, world.guards);
  drawTools(ctx, world);
  drawPlayer(ctx, world.player, input ? input.sneak : false);
  drawHud(ctx, world);

  if (world.screen === 'title') {
    overlay(ctx, 'NEON VAULT', [
      'A top-down heist in three rooms. Cross the floor, dodge the cones,',
      'lift the loot, and slip out the exit before the alarm peaks.',
      '',
      'WASD / arrows — move    Shift — sneak    E — grab / lockpick',
      'Click — throw EMP (kills cameras 5s)    F — smoke bomb    P — pause',
      '',
      'Press ENTER or click to start',
    ], '#2dd4ff');
  } else if (world.screen === 'pause') {
    overlay(ctx, 'PAUSED', ['Take a breath. The guards are not waiting — but they are close.', '', 'Press P to keep going'], COLORS.muted);
  } else if (world.screen === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      world.caughtWhy || 'The guards closed in.',
      `Score: ${world.score}   ·   Loot: ${world.lootGot}/${world.level.lootNeeded}`,
      '',
      'Press R to try this room again',
    ], '#ff5a4e');
  } else if (world.screen === 'level') {
    overlay(ctx, 'CLEAN GETAWAY', [
      `${world.level.name} cleared. The next room is already watching.`,
      `Score: ${world.score}`,
      '',
      'Press ENTER for the next room',
    ], '#37e08b');
  } else if (world.screen === 'win') {
    overlay(ctx, 'THE VAULT IS YOURS', [
      'Every room cleared. The Diamond, the gold, the paintings — all gone,',
      'and the crew is already on the chopper.',
      `Final score: ${world.score}`,
      '',
      'Press R to run it all again',
    ], '#f5c542');
  }
  // Red flash as the bust lands.
  if (world.alarm >= 100 && world.screen === 'play') {
    ctx.fillStyle = `rgba(255, 40, 40, ${0.12 + 0.1 * Math.sin(time * 14)})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
}
