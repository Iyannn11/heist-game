// game.js — AURUM HEIST: the state machine, the alarm, the tools, the lockpick
// flow, room transitions, particles and the main loop. Renders through render.js.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const G = {
  state: 'title', // title | play | lockpick | roomcard | paused | busted | win
  time: 0,
  elapsed: 0,
  roomIndex: 0,
  room: LEVELS[0],
  blocks: [],
  walls: [],
  guards: [],
  cameras: [],
  loot: [],
  lasers: [],
  player: null,
  alarm: 0,
  lockdownT: 0,
  laserCd: 0,
  smokes: [],
  particles: [],
  lootValue: 0,
  keptValue: 0,
  valueAtRoomStart: 0,
  exitOpen: false,
  toast: '',
  toastT: 0,
  flashT: 0,
  cardT: 0,
  bustedReason: '',
  alarmsRaised: 0,
  timesSpotted: 0,
  ghost: true,
  score: 0,
  speedBonus: 0,
  best: 0,
};

try {
  G.best = parseInt(localStorage.getItem('aurum-best') || '0', 10) || 0;
} catch (e) {
  G.best = 0;
}

function showToast(text) {
  G.toast = text;
  G.toastT = 2.5;
}

function spawnSparkle(x, y, color, n) {
  for (let i = 0; i < (n || 14); i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 90;
    G.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      t: 0,
      life: 0.5 + Math.random() * 0.5,
      size: 2 + Math.random() * 3,
      color: color || 'rgba(251,191,36,A)',
    });
  }
}

function loadRoom(index, keepValue) {
  const def = LEVELS[index];
  G.roomIndex = index;
  G.room = def;
  G.blocks = def.blocks.map((b) => ({ ...b }));
  if (def.vaultDoor) G.blocks.push({ ...def.vaultDoor, kind: 'vaultdoor' });
  G.walls = G.blocks;
  G.guards = def.guards.map(makeGuard);
  G.cameras = def.cameras.map(makeCamera);
  G.loot = def.loot.map((l) => ({ ...l, taken: false }));
  G.lasers = def.lasers.map((l) => ({ ...l }));
  G.player = makePlayer(def.playerStart.x, def.playerStart.y);
  G.smokes = [];
  G.particles = [];
  G.alarm = 0;
  G.lockdownT = 0;
  G.valueAtRoomStart = keepValue || 0;
  G.lootValue = keepValue || 0;
  G.exitOpen = false;
  G.state = 'roomcard';
  G.cardT = 1.4;
}

function roomLootTaken() {
  return G.loot.filter((l) => l.taken).length;
}

function roomLootTotal() {
  return G.loot.length;
}

function checkExitOpen() {
  if (G.roomIndex === 0) {
    G.exitOpen = roomLootTaken() >= G.room.needLoot;
  } else if (G.roomIndex === 1) {
    G.exitOpen = G.loot.some((l) => l.kind === 'diamond' && l.taken);
  } else {
    G.exitOpen = true;
  }
}

function smokeBlocks(x1, y1, x2, y2) {
  for (const s of G.smokes) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 10));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      if (Math.hypot(px - s.x, py - s.y) < s.r) return true;
    }
  }
  return false;
}

function onSpotted(src) {
  G.alarm = Math.min(100, G.alarm + 18);
  G.timesSpotted++;
  G.ghost = false;
  G.flashT = 1;
  G.alarmsRaised++;
  AudioSys.sfx('alarm');
  showToast(src.kind === 'dog' ? 'THE DOG SMELLED YOU!  ALARM +18' : 'SPOTTED!  ALARM +18');
  if (G.alarm >= 90 && G.lockdownT <= 0) {
    G.lockdownT = 10;
    showToast('LOCKDOWN! Doors sealed for 10s — break line of sight!');
    AudioSys.sfx('alarm');
  }
}

function nearestInteractable() {
  const p = G.player;
  let best = null;
  let bestD = 52;
  for (const l of G.loot) {
    if (l.taken) continue;
    const d = Math.hypot(l.x - p.x, l.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = { type: 'loot', loot: l, label: l.label, pins: l.pins };
    }
  }
  if (G.room.vaultDoor) {
    const vd = G.blocks.find((b) => b.kind === 'vaultdoor');
    if (vd) {
      const cx = vd.x + vd.w / 2;
      const cy = vd.y + vd.h / 2;
      const d = Math.hypot(cx - p.x, cy - p.y);
      if (d < bestD + 10) {
        bestD = d;
        best = { type: 'vault', label: 'Vault door', pins: vd.pins };
      }
    }
  }
  return best;
}

function takeLoot(l) {
  l.taken = true;
  G.lootValue += l.value;
  spawnSparkle(l.x, l.y, l.kind === 'diamond' ? 'rgba(224,242,254,A)' : 'rgba(251,191,36,A)', 18);
  AudioSys.sfx(l.kind === 'diamond' ? 'vault' : l.kind === 'gem' ? 'gem' : 'pickup');
  showToast(`${l.label} — +$${l.value}`);
  checkExitOpen();
  if (G.exitOpen && G.roomIndex === 0) showToast('Exit open — get to the east door!');
  if (G.exitOpen && G.roomIndex === 1) showToast('Diamond secured — get to the east door!');
}

function interact() {
  if (G.state !== 'play') return;
  const target = nearestInteractable();
  if (!target) return;
  if (target.pins > 0) {
    Lockpick.begin(target);
    G.state = 'lockpick';
    AudioSys.sfx('click');
  } else {
    takeLoot(target.loot);
  }
}

function useSmoke() {
  const p = G.player;
  if (G.state !== 'play' || p.smoke <= 0) return;
  p.smoke--;
  G.smokes.push({ x: p.x, y: p.y, r: 72, life: 6, t: 0, seed: Math.random() * 10 });
  AudioSys.sfx('smoke');
  showToast('Smoke out — their cones cannot see through it');
}

function useEMP() {
  const p = G.player;
  if (G.state !== 'play' || p.emp <= 0) return;
  p.emp--;
  for (const c of G.cameras) c.disabledT = 8;
  AudioSys.sfx('emp');
  showToast('EMP pulse — cameras down for 8 seconds');
}

function lockpickDone() {
  const target = Lockpick.target;
  AudioSys.sfx('vault');
  if (target.type === 'vault') {
    G.blocks = G.blocks.filter((b) => b.kind !== 'vaultdoor');
    G.walls = G.blocks;
    showToast('VAULT OPEN — take the Aurum Diamond!');
    spawnSparkle(640, 140, 'rgba(224,242,254,A)', 24);
  } else {
    takeLoot(target.loot);
  }
  G.state = 'play';
}

function updateAlarm(dt, anySeeing) {
  if (G.lockdownT > 0) {
    G.lockdownT -= dt;
    G.alarm = 100;
    if (G.lockdownT <= 0) {
      G.alarm = 55;
      showToast('Lockdown lifted — stay out of the cones');
    }
    return;
  }
  if (anySeeing) {
    G.alarm = Math.min(100, G.alarm + dt * 2.5);
  } else {
    G.alarm = Math.max(0, G.alarm - dt * 1.6);
  }
  if (G.alarm >= 90) {
    G.lockdownT = 10;
    showToast('LOCKDOWN! Doors sealed for 10s — break line of sight!');
    AudioSys.sfx('alarm');
  }
  AudioSys.setAlarm(G.alarm >= 90 ? 3 : G.alarm >= 60 ? 2 : G.alarm >= 30 ? 1 : 0);
}

function checkCaught() {
  const p = G.player;
  for (const g of G.guards) {
    const d = Math.hypot(g.x - p.x, g.y - p.y);
    const grab = g.kind === 'dog' ? 24 : 20;
    if (d < grab) {
      bust(g.kind === 'dog' ? 'The K-9 unit ran you down.' : 'A guard got a hand on you.');
      return;
    }
  }
}

function bust(reason) {
  G.state = 'busted';
  G.bustedReason = reason;
  G.keptValue = G.valueAtRoomStart;
  AudioSys.sfx('caught');
}

function winGame() {
  G.state = 'win';
  G.speedBonus = Math.max(0, 600 - Math.floor(G.elapsed) * 3);
  G.score = G.lootValue + G.speedBonus + (G.ghost ? 500 : 0);
  if (G.score > G.best) {
    G.best = G.score;
    try {
      localStorage.setItem('aurum-best', String(G.best));
    } catch (e) {
      /* storage unavailable */
    }
  }
  AudioSys.sfx('win');
}

function update(dt) {
  G.time += dt;
  if (G.toastT > 0) G.toastT -= dt;
  if (G.flashT > 0) G.flashT -= dt * 1.4;

  if (G.state === 'title') return;
  if (G.state === 'roomcard') {
    G.cardT -= dt;
    if (G.cardT <= 0) G.state = 'play';
    return;
  }
  if (G.state === 'paused' || G.state === 'busted' || G.state === 'win') return;

  if (G.state === 'lockpick') {
    Lockpick.update(dt);
    G.elapsed += dt;
  } else if (G.state === 'play') {
    G.elapsed += dt;
    updatePlayer(G.player, dt, input, G.room.bounds, G.walls);
  }

  // smoke clouds age
  for (const s of G.smokes) s.t += dt;
  G.smokes = G.smokes.filter((s) => s.t < s.life);

  // particles
  for (const pt of G.particles) {
    pt.t += dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
  }
  G.particles = G.particles.filter((pt) => pt.t < pt.life);

  // lasers
  if (G.laserCd > 0) G.laserCd -= dt;
  if (G.state === 'play' && G.laserCd <= 0) {
    for (const L of G.lasers) {
      if (!laserIsOn(L, G.time)) continue;
      const d = laserPlayerDist(L, G.player);
      if (d < 14) {
        G.alarm = Math.min(100, G.alarm + 8);
        G.laserCd = 1;
        AudioSys.sfx('laser');
        showToast('LASER TRIP!  ALARM +8');
        break;
      }
    }
  }

  const ctxShared = {
    player: G.player,
    walls: G.walls,
    alarm: G.alarm,
    smokeBlocks,
    onSpotted,
  };
  for (const g of G.guards) updateGuard(g, dt, ctxShared);
  for (const c of G.cameras) updateCamera(c, dt, ctxShared);

  const anySeeing = G.guards.some((g) => g.detect > 0.55) || G.cameras.some((c) => c.detect > 0.55);
  updateAlarm(dt, anySeeing);

  if (G.state === 'play') {
    checkCaught();
    if (G.state !== 'play') return;
    // exit / helipad
    if (G.roomIndex < 2 && G.exitOpen) {
      const e = G.room.exit;
      if (pointInRect(G.player.x, G.player.y, { x: e.x - 8, y: e.y - 8, w: e.w + 16, h: e.h + 16 })) {
        AudioSys.sfx('door');
        loadRoom(G.roomIndex + 1, G.lootValue);
        return;
      }
    }
    if (G.roomIndex === 2 && G.room.helipad) {
      const hp = G.room.helipad;
      if (Math.hypot(G.player.x - hp.x, G.player.y - hp.y) < 55) {
        winGame();
      }
    }
  }
}

function laserPlayerDist(L, p) {
  if (L.vertical) {
    const y1 = L.y;
    const y2 = L.y + L.len;
    if (p.y < y1 || p.y > y2) return 999;
    return Math.abs(p.x - L.x);
  }
  const x1 = L.x;
  const x2 = L.x + L.len;
  if (p.x < x1 || p.x > x2) return 999;
  return Math.abs(p.y - L.y);
}

// ---- input ----
const input = {
  up: false, down: false, left: false, right: false,
  sneak: false, dash: false,
};

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  AudioSys.init();
  AudioSys.resume();
  if (e.repeat) return;
  const mapped = KEYMAP[e.code];
  if (mapped) input[mapped] = true;
  if (e.code === 'Space') {
    if (G.state === 'lockpick') {
      const res = Lockpick.tryStop();
      if (res === 'miss') {
        G.alarm = Math.min(100, G.alarm + 8);
        AudioSys.sfx('fail');
        showToast('Missed the pin — ALARM +8');
      } else if (res === 'hit') {
        AudioSys.sfx('pin');
        showToast(`Pin set (${Lockpick.pin}/${Lockpick.pins})`);
      } else if (res === 'done') {
        lockpickDone();
      }
    } else if (G.state === 'play') {
      input.dash = true;
    }
  }
  if (e.code === 'KeyE' && G.state === 'play') interact();
  if (e.code === 'KeyQ') useSmoke();
  if (e.code === 'KeyF') useEMP();
  if (e.code === 'KeyM') {
    const muted = AudioSys.toggleMute();
    showToast(muted ? 'Sound off' : 'Sound on');
  }
  if (e.code === 'Enter' && G.state === 'title') {
    AudioSys.startMusic();
    loadRoom(0, 0);
  }
  if ((e.code === 'KeyP' || e.code === 'Escape')) {
    if (G.state === 'play') G.state = 'paused';
    else if (G.state === 'paused') G.state = 'play';
    else if (G.state === 'lockpick') {
      Lockpick.cancel();
      G.state = 'play';
    }
  }
  if (e.code === 'KeyR' && (G.state === 'busted' || G.state === 'win' || G.state === 'paused')) {
    if (G.state === 'win') {
      G.lootValue = 0;
      G.timesSpotted = 0;
      G.alarmsRaised = 0;
      G.ghost = true;
      G.elapsed = 0;
      loadRoom(0, 0);
    } else {
      loadRoom(G.roomIndex, G.valueAtRoomStart);
    }
  }
});

window.addEventListener('keyup', (e) => {
  const mapped = KEYMAP[e.code];
  if (mapped) input[mapped] = false;
});

canvas.addEventListener('mousedown', (e) => {
  AudioSys.init();
  AudioSys.resume();
  if (G.state === 'title') {
    AudioSys.startMusic();
    loadRoom(0, 0);
    return;
  }
  if (G.state === 'lockpick') {
    const res = Lockpick.tryStop();
    if (res === 'miss') {
      G.alarm = Math.min(100, G.alarm + 8);
      AudioSys.sfx('fail');
      showToast('Missed the pin — ALARM +8');
    } else if (res === 'hit') {
      AudioSys.sfx('pin');
      showToast(`Pin set (${Lockpick.pin}/${Lockpick.pins})`);
    } else if (res === 'done') {
      lockpickDone();
    }
    return;
  }
  if (G.state === 'play') interact();
});

// ---- photo mode: ?scene=cover|vault|roof|title stages a real game state ----
function applyScene(name) {
  if (name === 'title') {
    G.state = 'title';
    return;
  }
  const room = name === 'vault' ? 1 : name === 'roof' ? 2 : 0;
  loadRoom(room, 0);
  G.state = 'play';
  if (name === 'cover') {
    G.player.x = 700;
    G.player.y = 430;
    G.player.dir = Math.PI;
    G.alarm = 35;
    G.loot[3].taken = true;
    G.lootValue = 300;
    G.guards[0].x = 640;
    G.guards[0].y = 150;
    G.guards[0].dir = Math.PI / 2;
    G.guards[1].x = 600;
    G.guards[1].y = 660;
    G.guards[1].dir = -Math.PI / 2;
    G.guards[2].x = 640;
    G.guards[2].y = 380;
    G.guards[2].dir = Math.PI;
    G.guards[2].detect = 0.35;
  } else if (name === 'vault') {
    G.player.x = 640;
    G.player.y = 330;
    G.player.dir = -Math.PI / 2;
    G.alarm = 55;
    G.loot[1].taken = true;
    G.lootValue = 500;
    G.guards[0].x = 760;
    G.guards[0].y = 420;
    G.guards[0].dir = Math.PI;
    G.guards[2].x = 640;
    G.guards[2].y = 250;
    G.guards[2].dir = Math.PI / 2;
    G.guards[2].detect = 0.6;
  } else if (name === 'roof') {
    G.player.x = 700;
    G.player.y = 500;
    G.player.dir = -Math.PI / 4;
    G.player.sneaking = true;
    G.alarm = 20;
    G.lootValue = 3300;
    G.loot[0].taken = true;
    G.guards[0].x = 500;
    G.guards[0].y = 700;
    G.guards[0].dir = 0;
    G.guards[2].x = 800;
    G.guards[2].y = 420;
    G.guards[2].dir = Math.PI;
  }
  checkExitOpen();
}

const params = new URLSearchParams(location.search);
if (params.get('scene')) {
  applyScene(params.get('scene'));
}

// Debug handle for headless playtests: read-only state, never used by the game.
window.__aurum = G;
window.__aurumReady = true;

// ---- main loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  drawGame(ctx, G);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
