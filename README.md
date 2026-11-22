# AURUM HEIST

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Iyannn11/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Iyannn11/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

An original top-down 2D canvas heist game for the [make.fun best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559).

**Three rooms. One diamond. Zero witnesses.**

You are the thief. Cross the Gilded Gallery, crack the Vault Hall, and reach the
helicopter on the Midnight Rooftop — without letting a guard, a camera, or a
laser grid raise the alarm.

## How to play

- **WASD / arrows** — move · **Shift** — sneak (slower, harder to spot)
- **Space** — dash · **E** — grab loot / crack a lock · **Q** — smoke bomb
- **F** — EMP pulse (cameras down 8s) · **M** — sound · **P / Esc** — pause

## The job

1. **Room 1 — The Gilded Gallery.** Steal any 3 of the 4 pieces (paintings, the
   Star Sapphire) past 3 patrol guards and 2 sweeping cameras, then leave east.
2. **Room 2 — The Vault Hall.** Time the laser gates, crack the vault door
   (3-pin lockpick), take the Aurum Diamond — and the gold bars if you dare.
3. **Room 3 — Midnight Rooftop.** One patrol, one guard, one K-9 dog that hears
   you coming. Reach the helicopter and you are gone.

Vision cones are clipped by walls, so cover is real cover. Get spotted and the
alarm climbs: CALM → SUSPICIOUS → HUNTED → LOCKDOWN. At 100% the doors seal
for 10 seconds and every guard converges on you. A guard (or the dog) that
touches you ends the run — retry the room, keeping loot from finished rooms.

Tools cost: 2 EMP pulses and 2 smoke bombs for the whole job. Lockpicking is a
timed needle minigame — a miss feeds the alarm. Finish unspotted for the Ghost
bonus (+500) and fast for the speed bonus.

## Tech

Vanilla JS + canvas, no libraries, no network. All sound is synthesized with
WebAudio (the bass pulse thickens as the alarm rises). Source is split by job:
`geo.js` (vision math), `levels.js` (the three rooms), `guard.js` / `camera.js`
(patrols and detection), `player.js` (movement, tools, lockpick), `render.js`
(every pixel), `game.js` (state machine, alarm, loop).

Serve `game/` with any static server and open `index.html`.
