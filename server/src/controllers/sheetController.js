import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as v from '../utils/validators.js';
import Topic from '../models/Topic.js';
import Problem from '../models/Problem.js';
import { listProblems, getProblem } from '../services/problemService.js';
import { loadSheet } from '../services/dataService.js';

export const health = asyncHandler(async (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  const problems = dbUp ? await Problem.estimatedDocumentCount() : null;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    database: dbUp ? 'connected' : 'disconnected',
    problems,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

export const meta = asyncHandler(async (req, res) => {
  const { meta: info, report } = await loadSheet();
  res.json({ ...info, unverified: report.unverified, excludedLessons: report.excludedLessons });
});

export const topics = asyncHandler(async (req, res) => {
  const rows = await Topic.find().sort({ step: 1 }).lean();
  res.json({
    items: rows.map(({ _id, ...t }) => t), // eslint-disable-line no-unused-vars
    totalProblems: rows.reduce((n, t) => n + t.problemCount, 0),
  });
});

function parseListQuery(query, { requireQ = false } = {}) {
  const q = v.searchQuery(query.q, { required: requireQ });
  const step = v.intInRange(query.step, { name: 'step', min: 1, max: 100, fallback: undefined });
  const topic = typeof query.topic === 'string' && query.topic.trim() ? query.topic.trim().slice(0, 100) : undefined;
  return {
    filters: {
      q,
      step,
      topic,
      difficulty: v.oneOf(query.difficulty, v.DIFFICULTIES, 'difficulty'),
      platform: v.oneOf(query.platform, v.PLATFORMS, 'platform'),
    },
    status: v.oneOf(query.status, v.STATUSES, 'status') || 'all',
    sort: v.oneOf(query.sort, v.SORTS, 'sort') || 'order',
    order: v.oneOf(query.order, ['asc', 'desc'], 'order') || 'asc',
    page: v.intInRange(query.page, { name: 'page', min: 1, max: 10000, fallback: 1 }),
    limit: v.intInRange(query.limit, { name: 'limit', min: 1, max: 500, fallback: 50 }),
  };
}

export const problems = asyncHandler(async (req, res) => {
  const params = parseListQuery(req.query);
  if (params.status !== 'all' && !req.user) {
    throw ApiError.unauthorized('Sign in (or start a guest session) to filter by status');
  }
  res.json(await listProblems({ ...params, userId: req.user?._id }));
});

export const search = asyncHandler(async (req, res) => {
  const params = parseListQuery(req.query, { requireQ: true });
  res.json(await listProblems({ ...params, status: 'all', userId: req.user?._id }));
});

export const problemById = asyncHandler(async (req, res) => {
  const id = v.problemId(req.params.id);
  const problem = await getProblem(id, req.user?._id);
  if (!problem) throw ApiError.notFound(`Problem ${id} not found`);
  res.json(problem);
});
