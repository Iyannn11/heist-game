// NEON VAULT — input. One job: turn keyboard and mouse into a small state the world reads.
// WASD/arrows move, Shift sneaks, E interacts, F throws a smoke bomb, P/Esc pauses.
// A mouse click throws an EMP puck at the clicked point. The canvas reports clicks in
// field coordinates so the world never has to know about pixels.
export function makeInput(canvas, toField) {
  const input = {
    up: false, down: false, left: false, right: false,
    sneak: false, interact: false, smoke: false, pause: false,
    click: null,
  };
  const keys = {};
  const map = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyE: 'interact',
    KeyF: 'smoke',
    KeyP: 'pause', Escape: 'pause',
  };
  function sync() {
    input.up = !!keys.KeyW || !!keys.ArrowUp;
    input.down = !!keys.KeyS || !!keys.ArrowDown;
    input.left = !!keys.KeyA || !!keys.ArrowLeft;
    input.right = !!keys.KeyD || !!keys.ArrowRight;
    input.sneak = !!keys.ShiftLeft || !!keys.ShiftRight;
    input.interact = !!keys.KeyE;
    input.smoke = !!keys.KeyF;
    input.pause = !!keys.KeyP || !!keys.Escape;
  }
  window.addEventListener('keydown', (event) => {
    if (map[event.code]) event.preventDefault();
    if (!event.repeat) keys[event.code] = true;
    sync();
  });
  window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
    sync();
  });
  window.addEventListener('blur', () => {
    for (const code of Object.keys(keys)) keys[code] = false;
    sync();
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.click = toField(event.clientX - rect.left, event.clientY - rect.top);
  });
  // Drive the same state from a scripted driver (screenshots, tests) without a real keyboard.
  input.drive = (state) => {
    input.up = !!state.up; input.down = !!state.down;
    input.left = !!state.left; input.right = !!state.right;
    input.sneak = !!state.sneak; input.interact = !!state.interact;
    input.smoke = !!state.smoke; input.pause = !!state.pause;
    input.click = state.click || null;
  };
  input.takeClick = () => {
    const click = input.click;
    input.click = null;
    return click;
  };
  return input;
}
