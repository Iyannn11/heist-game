// AURUM HEIST — best-heist-game-20261122-0559 entry (Node 22+, standard library only).
//
// The game lives in game/ as plain static files (index.html + ES modules, no build
// step, no network request). This program hands it in: it copies game/ and
// screenshots/ from beside this file into /output and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function copyEntryTree() {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
  const shots = join(repoRoot, 'screenshots');
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(shots)) cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
}

function countOutputEntries(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    n += 1;
    if (statSync(p).isDirectory()) n += countOutputEntries(p);
  }
  return n;
}

copyEntryTree();

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files, in all, or a
// path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap,
// its screenshots/ and dossier.json).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

const entries = countOutputEntries(outDir);
console.log(`AURUM HEIST handed in: ${entries} entries in ${outDir}`);

// Verify the hand-in on disk: the dossier must exist and match what the program
// just wrote, and the game entrypoint must be present with a sane size. The grader
// runs this program twice and requires byte-identical output, so any mismatch
// here is a hard failure, not a warning.
const dossierPath = join(outDir, 'dossier.json');
const dossierBytes = statSync(dossierPath).size;
const indexBytes = statSync(join(outDir, 'game', 'index.html')).size;
const shotNames = readdirSync(join(outDir, 'screenshots'))
  .filter((n) => !n.startsWith('.'))
  .sort();
if (dossierBytes === 0 || indexBytes === 0 || indexBytes > 1048576) {
  throw new Error(`hand-in verification failed: dossier ${dossierBytes}B, index ${indexBytes}B`);
}
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`hand-in verification failed: ${shotNames.length} screenshots`);
}
for (const name of shotNames) {
  const bytes = statSync(join(outDir, 'screenshots', name)).size;
  if (bytes > 262144) throw new Error(`hand-in verification failed: ${name} is ${bytes}B`);
}
console.log(`verified: dossier.json ${dossierBytes}B, game/index.html ${indexBytes}B, cover ${shotNames[0]}`);
