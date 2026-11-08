// Runs Biome and applies a ratchet: errors always fail, and the number of warnings per rule may never go UP.
// Existing warnings (for example `any` types or unused state setters) are recorded in lint-baseline.json and cleaned up
// over time. Run `node scripts/lint.mjs --update` after fixing some, to lower the recorded numbers.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const BASELINE = new URL('../lint-baseline.json', import.meta.url);
const update = process.argv.includes('--update');

const run = spawnSync('npx', ['--no-install', 'biome', 'lint', '.', '--max-diagnostics=5000', '--reporter=json'], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
let report;
try {
  report = JSON.parse(run.stdout);
} catch {
  console.error('Could not read Biome output.\n' + (run.stderr || run.stdout).slice(0, 2000));
  process.exit(1);
}

const where = (d) => `${d.location?.path ?? '?'}:${d.location?.start?.line ?? '?'}`;
const errors = report.diagnostics.filter((d) => d.severity === 'error' || d.severity === 'fatal');

// counts[rule][file] = number of warnings. Per file, so a failure points at the file that got worse.
const counts = {};
for (const d of report.diagnostics.filter((x) => x.severity === 'warning')) {
  const file = d.location?.path ?? '?';
  counts[d.category] ??= {};
  counts[d.category][file] = (counts[d.category][file] ?? 0) + 1;
}
const sortDeep = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, typeof v === 'object' ? sortDeep(v) : v]));
const totalOf = (o) => Object.values(o).reduce((a, v) => a + Object.values(v).reduce((x, y) => x + y, 0), 0);

if (errors.length) {
  console.error(`Lint found ${errors.length} error(s):`);
  for (const d of errors) console.error(`  ${where(d)}  ${d.category}  ${d.message}`);
  process.exit(1);
}

if (update) {
  writeFileSync(BASELINE, JSON.stringify(sortDeep(counts), null, 2) + '\n');
  console.log(`Wrote lint-baseline.json: ${totalOf(counts)} warnings across ${Object.keys(counts).length} rules.`);
  process.exit(0);
}

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {};
const worse = [];
let fewer = 0;
for (const [rule, files] of Object.entries(counts)) {
  for (const [file, n] of Object.entries(files)) {
    const allowed = baseline[rule]?.[file] ?? 0;
    if (n > allowed) worse.push({ rule, file, n, allowed });
  }
}
for (const [rule, files] of Object.entries(baseline)) {
  for (const [file, allowed] of Object.entries(files)) if ((counts[rule]?.[file] ?? 0) < allowed) fewer += allowed - (counts[rule]?.[file] ?? 0);
}

if (worse.length) {
  console.error('Lint warnings went up (the ratchet only lets the count go down). Fix these:');
  for (const w of worse) {
    console.error(`  ${w.file}  ${w.rule.replace('lint/', '')}: ${w.n} (allowed ${w.allowed})`);
    for (const d of report.diagnostics.filter((x) => x.category === w.rule && x.location?.path === w.file)) console.error(`    line ${d.location?.start?.line}`);
  }
  console.error('If the warnings moved with the code and are not new, run: npm run lint:baseline');
  process.exit(1);
}
console.log(`Lint OK: 0 errors, ${totalOf(counts)} known warnings (none new).`);
if (fewer) console.log(`${fewer} fewer warning(s) than recorded. Lock that in with: npm run lint:baseline`);
