import Problem from '../models/Problem.js';
import UserProblem from '../models/UserProblem.js';
import { escapeRegex } from '../utils/validators.js';

const DIFFICULTY_RANK = { Basic: 1, Core: 2, Pro: 3 };

function buildFilter({ q, step, topic, difficulty, platform }) {
  const filter = {};
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };
  if (step) filter.step = step;
  if (topic) filter.topic = topic;
  if (difficulty) filter.difficulty = difficulty === 'Unrated' ? null : difficulty;
  if (platform === 'leetcode') filter.leetcode = { $ne: null };
  if (platform === 'gfg') filter.gfg = { $ne: null };
  if (platform === 'both') {
    filter.leetcode = { $ne: null };
    filter.gfg = { $ne: null };
  }
  if (platform === 'any') filter.platformAvailability = { $exists: true, $ne: [] };
  if (platform === 'none') filter.platformAvailability = { $size: 0 };
  return filter;
}

const sorters = {
  order: (a, b) => a.order - b.order,
  title: (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }) || a.order - b.order,
  difficulty: (a, b) =>
    (DIFFICULTY_RANK[a.difficulty] || 9) - (DIFFICULTY_RANK[b.difficulty] || 9) || a.order - b.order,
};

export async function getUserStateMap(userId, problemIds) {
  if (!userId) return new Map();
  const query = { user: userId };
  if (problemIds) query.problem = { $in: problemIds };
  const rows = await UserProblem.find(query).lean();
  return new Map(rows.map((r) => [r.problem, r]));
}

function withUserState(problem, state) {
  return {
    ...problem,
    userState: {
      solved: Boolean(state?.solved),
      bookmarked: Boolean(state?.bookmarked),
      notes: state?.notes || '',
    },
  };
}

function toPlain(doc) {
  const { _id, createdAt, updatedAt, ...rest } = doc; // eslint-disable-line no-unused-vars
  return { id: _id, ...rest };
}

/**
 * Lists problems with filtering, sorting and pagination.
 * The collection is small (~450 rows) so sorting/pagination happen in memory after the DB filter,
 * which keeps difficulty sorting ordinal (Basic < Core < Pro) and works on any MongoDB-compatible server.
 */
export async function listProblems({ filters, status, sort = 'order', order = 'asc', page, limit, userId }) {
  let docs = (await Problem.find(buildFilter(filters)).lean()).map(toPlain);

  let stateMap = new Map();
  if (userId) {
    stateMap = await getUserStateMap(userId);
    if (status === 'solved') docs = docs.filter((p) => stateMap.get(p.id)?.solved);
    if (status === 'unsolved') docs = docs.filter((p) => !stateMap.get(p.id)?.solved);
    if (status === 'bookmarked') docs = docs.filter((p) => stateMap.get(p.id)?.bookmarked);
  }

  docs.sort(sorters[sort]);
  if (order === 'desc') docs.reverse();

  const total = docs.length;
  const start = (page - 1) * limit;
  const items = docs.slice(start, start + limit).map((p) => (userId ? withUserState(p, stateMap.get(p.id)) : p));

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getProblem(id, userId) {
  const doc = await Problem.findById(id).lean();
  if (!doc) return null;
  const problem = toPlain(doc);
  if (!userId) return problem;
  const state = (await getUserStateMap(userId, [id])).get(id);
  return withUserState(problem, state);
}
