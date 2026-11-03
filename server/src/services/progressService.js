import Problem from '../models/Problem.js';
import Topic from '../models/Topic.js';
import UserProblem from '../models/UserProblem.js';
import ApiError from '../utils/ApiError.js';

async function assertProblemExists(problemId) {
  const exists = await Problem.exists({ _id: problemId });
  if (!exists) throw ApiError.notFound(`Problem ${problemId} not found`);
}

// Removes rows that carry no information so the collection stays small.
async function pruneIfEmpty(row) {
  if (!row.solved && !row.bookmarked && !row.notes) {
    await UserProblem.deleteOne({ _id: row._id });
  }
}

export async function updateProgress(userId, problemId, { solved, notes }) {
  await assertProblemExists(problemId);
  const set = {};
  if (solved !== undefined) {
    set.solved = solved;
    set.solvedAt = solved ? new Date() : null;
  }
  if (notes !== undefined) set.notes = notes;

  const row = await UserProblem.findOneAndUpdate(
    { user: userId, problem: problemId },
    { $set: set, $setOnInsert: { user: userId, problem: problemId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  const result = row.toPublic();
  await pruneIfEmpty(row);
  return result;
}

export async function setBookmark(userId, problemId, bookmarked) {
  await assertProblemExists(problemId);
  const row = await UserProblem.findOneAndUpdate(
    { user: userId, problem: problemId },
    {
      $set: { bookmarked, bookmarkedAt: bookmarked ? new Date() : null },
      $setOnInsert: { user: userId, problem: problemId },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const result = row.toPublic();
  await pruneIfEmpty(row);
  return result;
}

export async function getProgress(userId) {
  const [rows, problems, topics] = await Promise.all([
    UserProblem.find({ user: userId }).lean(),
    Problem.find({}, { _id: 1, step: 1, difficulty: 1 }).lean(),
    Topic.find().sort({ step: 1 }).lean(),
  ]);

  const stepOf = new Map(problems.map((p) => [p._id, p]));
  const solvedRows = rows.filter((r) => r.solved && stepOf.has(r.problem));

  const byStep = new Map(topics.map((t) => [t.step, { step: t.step, name: t.name, total: t.problemCount, solved: 0 }]));
  const byDifficulty = {};
  for (const p of problems) {
    const key = p.difficulty || 'Unrated';
    byDifficulty[key] ??= { total: 0, solved: 0 };
    byDifficulty[key].total += 1;
  }
  for (const r of solvedRows) {
    const p = stepOf.get(r.problem);
    const s = byStep.get(p.step);
    if (s) s.solved += 1;
    byDifficulty[p.difficulty || 'Unrated'].solved += 1;
  }

  const total = problems.length;
  const solved = solvedRows.length;
  return {
    summary: {
      total,
      solved,
      remaining: total - solved,
      percentage: total ? Math.round((solved / total) * 1000) / 10 : 0,
      bookmarked: rows.filter((r) => r.bookmarked).length,
      byTopic: [...byStep.values()],
      byDifficulty,
    },
    items: rows.map((r) => ({
      problemId: r.problem,
      solved: r.solved,
      solvedAt: r.solvedAt,
      bookmarked: r.bookmarked,
      bookmarkedAt: r.bookmarkedAt,
      notes: r.notes,
    })),
  };
}

export async function listBookmarks(userId) {
  const rows = await UserProblem.find({ user: userId, bookmarked: true }).sort({ bookmarkedAt: -1 }).lean();
  const problems = await Problem.find({ _id: { $in: rows.map((r) => r.problem) } }).lean();
  const byId = new Map(problems.map((p) => [p._id, p]));
  return rows
    .filter((r) => byId.has(r.problem))
    .map((r) => {
      const { _id, createdAt, updatedAt, ...p } = byId.get(r.problem); // eslint-disable-line no-unused-vars
      return {
        id: _id,
        ...p,
        bookmarkedAt: r.bookmarkedAt,
        userState: { solved: r.solved, bookmarked: true, notes: r.notes },
      };
    });
}
