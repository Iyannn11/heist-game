# NEON VAULT — Make the best heist game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Iyannn11/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Iyannn11/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down 2D canvas heist game, built for the [make.fun bounty](https://make.fun/bounty/best-heist-game-20261122-0559). Sneak past guards and their vision cones, dodge sweeping security cameras, lift the loot, and slip out the exit before the alarm peaks — across three rooms: The Gallery, The Vault, and a rooftop getaway.

## Play

Open `game/index.html` in a desktop browser (no network needed, no build step).

- **WASD / arrows** — move · **Shift** — sneak (slower, harder to spot)
- **E** — grab loot / hold to lockpick the vault · **Click** — throw an EMP (kills cameras for 5s)
- **F** — smoke bomb (invisible inside the cloud) · **P** — pause · **R** — retry after a bust

The alarm meter fills while a guard or camera sees you and drains when you break line of sight. Get spotted at 100% and the crew is caught — unless you vanish into smoke first.

## Files

- `game/index.html` — the shell (canvas + module entry)
- `game/src/config.js` — the numbers every module agrees on
- `game/src/levels.js` — the three rooms: walls, patrols, cameras, loot
- `game/src/guards.js` — patrol routes, vision cones, line of sight
- `game/src/cameras.js` — sweeping cameras and their cones
- `game/src/world.js` — the rules: movement, detection, tools, win / caught
- `game/src/render.js` — everything you see on the canvas
- `game/src/audio.js` — WebAudio synth sounds (no audio files)
- `game/src/input.js` — keyboard + mouse
- `game/src/shots.js` — the screenshot scenes (`?shot=cover|play|tools|win`)
- `game/src/main.js` — the loop and the screens
- `main.ts` — hands the game in: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
