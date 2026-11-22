// player.js — the thief: WASD/arrows to move, Shift to sneak, Space to dash,
// E to interact, Q for a smoke bomb, F for an EMP pulse. Plus the lockpick
// minigame: stop the sweeping needle inside the green zone, once per pin.

function makePlayer(x, y) {
  return {
    x,
    y,
    r: 11,
    dir: -Math.PI / 2,
    sneaking: false,
    moving: false,
    dashT: 0,
    dashCd: 0,
    emp: 2,
    smoke: 2,
    stepT: 0,
  };
}

// The lockpick: a needle sweeps the bar; Space (or a click) stops it. Land in the
// green zone to set a pin. The zone shrinks with every pin, and a miss feeds the alarm.
const Lockpick = {
  active: false,
  target: null, // { label, pins }
  pins: 0,
  pin: 0,
  needle: 0,
  needleDir: 1,
  zone: 0.4,
  zoneW: 0.26,

  begin(target) {
    this.active = true;
    this.target = target;
    this.pins = target.pins || 1;
    this.pin = 0;
    this.needle = 0;
    this.needleDir = 1;
    this.newZone();
  },

  newZone() {
    this.zoneW = Math.max(0.18, 0.3 - this.pin * 0.04);
    this.zone = 0.08 + Math.random() * (0.92 - this.zoneW - 0.08);
  },

  update(dt) {
    if (!this.active) return;
    const speed = 1.2 + this.pin * 0.25;
    this.needle += this.needleDir * speed * dt;
    if (this.needle >= 1) {
      this.needle = 1;
      this.needleDir = -1;
    } else if (this.needle <= 0) {
      this.needle = 0;
      this.needleDir = 1;
    }
  },

  // Returns 'hit' | 'miss' | 'done' | null.
  tryStop() {
    if (!this.active) return null;
    const inZone = this.needle >= this.zone && this.needle <= this.zone + this.zoneW;
    if (!inZone) return 'miss';
    this.pin++;
    if (this.pin >= this.pins) {
      this.active = false;
      return 'done';
    }
    this.newZone();
    return 'hit';
  },

  cancel() {
    this.active = false;
    this.target = null;
  },
};

function updatePlayer(p, dt, input, bounds, walls) {
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const len = Math.hypot(mx, my);
  p.moving = len > 0;
  p.sneaking = !!input.sneak && len > 0;

  if (p.dashCd > 0) p.dashCd -= dt;
  if (input.dash && p.dashCd <= 0 && len > 0) {
    p.dashT = 0.16;
    p.dashCd = 2;
    AudioSys.sfx('dash');
    input.dash = false;
  }

  let speed = p.sneaking ? 95 : 172;
  if (p.dashT > 0) {
    speed = 430;
    p.dashT -= dt;
  }
  if (len > 0) {
    mx /= len;
    my /= len;
    p.x += mx * speed * dt;
    p.y += my * speed * dt;
    p.dir = Math.atan2(my, mx);
  }
  p.x = clamp(p.x, bounds.x + p.r, bounds.x + bounds.w - p.r);
  p.y = clamp(p.y, bounds.y + p.r, bounds.y + bounds.h - p.r);
  resolveCircleWalls(p, p.r, walls);

  if (p.moving) {
    p.stepT += dt * (p.sneaking ? 0.6 : 1);
    if (p.stepT > 0.34) {
      p.stepT = 0;
      AudioSys.sfx('step');
    }
  }
}
