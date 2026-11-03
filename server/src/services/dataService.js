import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Problem from '../models/Problem.js';
import Topic from '../models/Topic.js';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

let cache;
export async function loadSheet() {
  if (!cache) {
    const [sheet, report] = await Promise.all([
      readFile(path.join(dataDir, 'a2zSheet.json'), 'utf8').then(JSON.parse),
      readFile(path.join(dataDir, 'verificationReport.json'), 'utf8').then(JSON.parse),
    ]);
    cache = { ...sheet, report };
  }
  return cache;
}

// Upserts every topic and problem from the dataset and removes rows that are no longer in it.
// User progress is never touched.
export async function seedDatabase({ log = () => {} } = {}) {
  const { topics, problems } = await loadSheet();

  const topicOps = topics.map((t) => ({
    replaceOne: { filter: { step: t.step }, replacement: t, upsert: true },
  }));
  await Topic.bulkWrite(topicOps);
  await Topic.deleteMany({ step: { $nin: topics.map((t) => t.step) } });

  const ids = problems.map((p) => p.id);
  const removed = await Problem.deleteMany({ _id: { $nin: ids } });

  // Only write problems that are new or whose data changed, so re-seeding is cheap and idempotent.
  const existing = new Map((await Problem.find({}).lean()).map((d) => [d._id, d]));
  const fields = (o) => JSON.stringify(Object.keys(o).filter((k) => !['_id', 'id', 'createdAt', 'updatedAt'].includes(k)).sort().map((k) => [k, o[k]]));
  const changed = problems.filter((p) => !existing.has(p.id) || fields(existing.get(p.id)) !== fields(p));
  if (changed.length) {
    await Problem.bulkWrite(
      changed.map(({ id, ...rest }) => ({
        replaceOne: { filter: { _id: id }, replacement: { _id: id, ...rest }, upsert: true },
      }))
    );
  }

  log(`Seeded ${topics.length} topics and ${problems.length} problems (${changed.length} written, ${removed.deletedCount} stale removed).`);
  return { topics: topics.length, problems: problems.length, written: changed.length, removed: removed.deletedCount };
}

export async function seedIfEmpty({ log } = {}) {
  const count = await Problem.estimatedDocumentCount();
  if (count === 0) return seedDatabase({ log });
  return null;
}
