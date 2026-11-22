// audio.js — all sound is synthesized with WebAudio: no audio files, no network.
// A low bass pulse runs as music and gets denser as the alarm rises; one-shots cover
// pickups, lockpick clicks, doors, the alarm sting, getting caught and the getaway.

const AudioSys = {
  ctx: null,
  master: null,
  musicGain: null,
  muted: false,
  alarmLevel: 0, // 0 calm .. 3 lockdown
  musicTimer: null,
  beat: 0,

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.14;
      this.musicGain.connect(this.master);
    } catch (e) {
      this.ctx = null;
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  },

  setAlarm(level) {
    this.alarmLevel = level;
  },

  tone(freq, dur, type, vol, when, slideTo) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (when || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol || 0.2, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  },

  noise(dur, vol, freq, when) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (when || 0);
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq || 1200;
    f.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.value = vol || 0.15;
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0);
  },

  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'pickup':
        this.tone(880, 0.12, 'sine', 0.22);
        this.tone(1318, 0.18, 'sine', 0.2, 0.07);
        break;
      case 'gem':
        this.tone(1046, 0.1, 'triangle', 0.22);
        this.tone(1568, 0.14, 'triangle', 0.2, 0.06);
        this.tone(2093, 0.2, 'sine', 0.16, 0.12);
        break;
      case 'click':
        this.tone(2400, 0.04, 'square', 0.1);
        break;
      case 'pin':
        this.tone(1800, 0.08, 'square', 0.14);
        this.tone(1200, 0.1, 'square', 0.12, 0.05);
        break;
      case 'fail':
        this.tone(220, 0.25, 'sawtooth', 0.16, 0, 110);
        break;
      case 'door':
        this.noise(0.25, 0.12, 500);
        this.tone(180, 0.2, 'triangle', 0.14, 0.05, 90);
        break;
      case 'vault':
        this.tone(392, 0.15, 'triangle', 0.2);
        this.tone(523, 0.15, 'triangle', 0.2, 0.1);
        this.tone(659, 0.3, 'triangle', 0.22, 0.2);
        break;
      case 'alarm':
        this.tone(660, 0.35, 'square', 0.12, 0, 880);
        this.tone(660, 0.35, 'square', 0.12, 0.4, 880);
        break;
      case 'caught':
        this.tone(440, 0.2, 'sawtooth', 0.2, 0, 220);
        this.tone(220, 0.5, 'sawtooth', 0.22, 0.18, 55);
        break;
      case 'emp':
        this.noise(0.4, 0.18, 3000);
        this.tone(1200, 0.35, 'sine', 0.14, 0, 100);
        break;
      case 'smoke':
        this.noise(0.5, 0.16, 800);
        break;
      case 'dash':
        this.noise(0.12, 0.1, 2000);
        break;
      case 'win':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.2, i * 0.12));
        break;
      case 'step':
        this.noise(0.03, 0.04, 900);
        break;
      case 'laser':
        this.tone(1500, 0.12, 'square', 0.1, 0, 700);
        break;
    }
  },

  // A tiny step sequencer: a bass pulse on the beat, a hat off-beat when tense.
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.muted) return;
      const tense = this.alarmLevel >= 1;
      const bassNotes = [55, 55, 65.4, 49];
      const note = bassNotes[this.beat % 4];
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.value = note;
      f.type = 'lowpass';
      f.frequency.value = tense ? 900 : 320;
      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      o.connect(f);
      f.connect(g);
      g.connect(this.musicGain);
      o.start();
      o.stop(this.ctx.currentTime + 0.25);
      if (tense && this.beat % 2 === 1) this.noise(0.04, 0.05, 6000);
      this.beat++;
    }, this.alarmLevel >= 2 ? 300 : 430);
  },
};
