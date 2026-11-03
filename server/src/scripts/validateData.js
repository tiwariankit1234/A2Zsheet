// Usage: npm run validate:data
// Checks the problem dataset for structural problems. Exits with code 1 when errors are found.
import { fileURLToPath } from 'node:url';
import { loadSheet } from '../services/dataService.js';

const LC_RE = /^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/;
const GFG_RE = /^https:\/\/www\.geeksforgeeks\.org\/problems\/[a-z0-9-]+\/1$/;
const LC_VERIFIED = new Set(['reference-sheet+catalog', 'user-supplied+catalog']);
const GFG_VERIFIED = new Set(['exact-title', 'manual-review']);

export function validateSheet({ topics, problems }) {
  const errors = [];
  const warnings = [];
  const err = (p, msg) => errors.push(`${p?.id ?? '?'} (${p?.title ?? 'untitled'}): ${msg}`);

  const ids = new Map();
  const orders = new Set();
  const titleKeys = new Map();
  const lcUse = new Map();
  const steps = new Map(topics.map((t) => [t.step, t]));

  for (const p of problems) {
    if (!p.id) err(p, 'missing id');
    else if (ids.has(p.id)) err(p, `duplicate id (also at order ${ids.get(p.id)})`);
    else ids.set(p.id, p.order);

    if (!p.title || !String(p.title).trim()) err(p, 'missing title');
    if (!p.topic) err(p, 'missing topic');
    if (!p.subtopic) err(p, 'missing subtopic');
    if (!Number.isInteger(p.step)) err(p, 'missing step');
    else if (!steps.has(p.step)) err(p, `step ${p.step} has no topic entry`);
    else if (steps.get(p.step).name !== p.topic) err(p, `topic "${p.topic}" does not match step ${p.step}`);

    if (!Number.isInteger(p.order)) err(p, 'missing order');
    else if (orders.has(p.order)) err(p, `duplicate order ${p.order}`);
    else orders.add(p.order);

    const key = `${p.topic}|${p.subtopic}|${String(p.title).toLowerCase()}`;
    if (titleKeys.has(key)) err(p, `duplicate entry of ${titleKeys.get(key)} in the same subtopic`);
    else titleKeys.set(key, p.id);

    if (p.difficulty !== null && !['Basic', 'Core', 'Pro'].includes(p.difficulty)) err(p, `unknown difficulty "${p.difficulty}"`);

    if (p.leetcode) {
      if (!LC_RE.test(p.leetcode.url)) err(p, `malformed LeetCode URL ${p.leetcode.url}`);
      if (!LC_VERIFIED.has(p.leetcode.verification)) err(p, 'unverified LeetCode mapping');
      if (p.leetcode.premium) warnings.push(`${p.id} (${p.title}): LeetCode problem is Premium-only`);
      lcUse.set(p.leetcode.slug, [...(lcUse.get(p.leetcode.slug) || []), p.id]);
    }
    if (p.gfg) {
      if (!GFG_RE.test(p.gfg.url)) err(p, `malformed GFG URL ${p.gfg.url}`);
      if (!GFG_VERIFIED.has(p.gfg.verification)) err(p, 'unverified GFG mapping');
    }
    const expected = ['leetcode', 'gfg'].filter((k) => p[k]);
    if (JSON.stringify(expected) !== JSON.stringify(p.platformAvailability)) err(p, 'platformAvailability out of sync');
  }

  for (const t of topics) {
    const n = problems.filter((p) => p.step === t.step).length;
    if (n !== t.problemCount) errors.push(`Topic step ${t.step} "${t.name}": problemCount ${t.problemCount} but ${n} problems`);
  }
  const sorted = [...orders].sort((a, b) => a - b);
  if (sorted.some((o, i) => o !== i + 1)) errors.push('order values are not contiguous from 1');

  for (const [slug, used] of lcUse) {
    if (used.length > 1) warnings.push(`LeetCode "${slug}" is linked from ${used.length} problems: ${used.join(', ')}`);
  }

  const stats = {
    problems: problems.length,
    topics: topics.length,
    withLeetcode: problems.filter((p) => p.leetcode).length,
    withGfg: problems.filter((p) => p.gfg).length,
    withBoth: problems.filter((p) => p.leetcode && p.gfg).length,
    noPlatformLink: problems.filter((p) => !p.leetcode && !p.gfg).length,
    unrated: problems.filter((p) => !p.difficulty).length,
  };
  return { errors, warnings, stats };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sheet = await loadSheet();
  const { errors, warnings, stats } = validateSheet(sheet);
  console.log('Dataset stats:', stats);
  console.log(`\nUnverified / unavailable mappings recorded in verificationReport.json: ${sheet.report.unverified.length}`);
  for (const u of sheet.report.unverified) console.log(`  - ${u.id} ${u.title} [${u.platform}]: ${u.reason}`);
  console.log(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
  console.log(`\nErrors (${errors.length}):`);
  for (const e of errors) console.log(`  - ${e}`);
  process.exit(errors.length ? 1 : 0);
}
