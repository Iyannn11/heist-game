// NEON VAULT — sound. One job: every sound the game makes, synthesised live with
// WebAudio. No audio files, no network: oscillators and filtered noise only. The context
// is created on the first user gesture, so browsers never block it.
export function makeAudio() {
  let ctx = null;
  let master = null;
  let alarmNodes = null;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      return true;
    } catch (err) {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, freq, when) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + (when || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
  }

  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    step() { noise(0.05, 0.05, 900); },
    pickup() { tone(880, 0.12, 'sine', 0.25); tone(1318, 0.18, 'sine', 0.22, 0.07); },
    emp() { tone(1400, 0.25, 'square', 0.12, 0, 220); noise(0.2, 0.1, 3200); },
    smoke() { noise(0.5, 0.14, 700); },
    lockTick() { tone(1200, 0.05, 'square', 0.08); },
    vaultOpen() { tone(523, 0.14, 'triangle', 0.25); tone(659, 0.14, 'triangle', 0.25, 0.1); tone(784, 0.22, 'triangle', 0.25, 0.2); },
    caught() { tone(392, 0.5, 'sawtooth', 0.22, 0, 110); tone(196, 0.7, 'sawtooth', 0.18, 0.15, 65); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.25, i * 0.12));
      tone(1318, 0.4, 'triangle', 0.22, 0.5);
    },
    alarmStart() {
      if (!ensure() || alarmNodes) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 620;
      gain.gain.value = 0.0;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 3.2;
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      lfo.start();
      alarmNodes = { osc, gain, lfo };
    },
    alarmSet(level) {
      if (!alarmNodes) return;
      alarmNodes.gain.gain.setTargetAtTime(level > 0.02 ? 0.045 + level * 0.05 : 0, ctx.currentTime, 0.1);
    },
    alarmStop() {
      if (!alarmNodes) return;
      try { alarmNodes.osc.stop(); alarmNodes.lfo.stop(); } catch (err) { /* already stopped */ }
      alarmNodes = null;
    },
  };
}
