// NEON VAULT — bootstrap. One job: own the loop and the screens.
// It scales the 960x600 field to the window, steps the world on a fixed tick, and draws
// every frame. ?shot=cover|play|tools|win stages a screenshot scene instead of the title.
import { FIELD, STEP } from './config.js';
import {
  makeWorld, stepWorld,
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSE, SCREEN_CAUGHT, SCREEN_LEVEL, SCREEN_WIN,
  EVENT_CAUGHT, EVENT_LEVEL, EVENT_WIN,
} from './world.js';
import { render } from './render.js';
import { makeInput } from './input.js';
import { makeAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const audio = makeAudio();
const world = makeWorld(audio);
const input = makeInput(canvas, (px, py) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (px / rect.width) * FIELD.width,
    y: (py / rect.height) * FIELD.height,
  };
});

function fit() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = FIELD.width * dpr;
  canvas.height = FIELD.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', fit);
fit();

function setStatus(text) {
  if (status) status.textContent = text;
}

// One-shot key presses: a held key must not re-trigger a screen change every tick.
const down = {};
const justPressed = {};
window.addEventListener('keydown', (e) => {
  if (!down[e.code]) justPressed[e.code] = true;
  down[e.code] = true;
  if (e.code === 'Enter' || e.code === 'Space') audio.unlock();
});
window.addEventListener('keyup', (e) => { down[e.code] = false; });
function pressed(code) {
  if (justPressed[code]) {
    justPressed[code] = false;
    return true;
  }
  return false;
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  // Screenshot scenes render one still frame from the real rules; no loop runs.
  // The staged screen is honoured: the win scene draws the win overlay, the rest play.
  const staged = stageShot(shot, world);
  world.screen = staged.screen;
  render(ctx, world, input);
  document.title = `NEON VAULT — ${shot}`;
} else {
  let last = performance.now();
  let acc = 0;
  let pauseHeld = false;

  function tick() {
    if (world.screen === SCREEN_TITLE) {
      if (pressed('Enter') || pressed('Space') || input.click) {
        audio.unlock();
        world.loadLevel(0);
        world.screen = SCREEN_PLAY;
        input.takeClick();
        setStatus('The heist is on. Grab the loot and reach the exit.');
      }
      return;
    }
    if (world.screen === SCREEN_PLAY) {
      if (input.pause && !pauseHeld) {
        world.screen = SCREEN_PAUSE;
        return;
      }
      const ev = stepWorld(world, input, STEP);
      if (ev & EVENT_CAUGHT) setStatus('Caught! Press R to try the room again.');
      if (ev & EVENT_LEVEL) setStatus(`${world.level.name} — keep going.`);
      if (ev & EVENT_WIN) setStatus(`Clean getaway! Final score ${world.score}.`);
      return;
    }
    if (world.screen === SCREEN_PAUSE) {
      if (input.pause && !pauseHeld) world.screen = SCREEN_PLAY;
      return;
    }
    if (world.screen === SCREEN_LEVEL) {
      if (pressed('Enter') || pressed('Space') || input.click) {
        audio.unlock();
        world.loadLevel(world.levelIndex + 1);
        world.screen = SCREEN_PLAY;
        input.takeClick();
      }
      return;
    }
    if (world.screen === SCREEN_CAUGHT) {
      if (pressed('KeyR')) {
        audio.unlock();
        world.loadLevel(world.levelIndex);
        world.screen = SCREEN_PLAY;
      }
      return;
    }
    if (world.screen === SCREEN_WIN) {
      if (pressed('KeyR')) {
        audio.unlock();
        world.reset();
        world.screen = SCREEN_TITLE;
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      tick();
    }
    pauseHeld = input.pause;
    render(ctx, world, input);
  }

  setStatus('NEON VAULT — press Enter to start the heist.');
  requestAnimationFrame(frame);
}
