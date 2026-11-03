import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as v from '../utils/validators.js';
import * as progressService from '../services/progressService.js';

export const getProgress = asyncHandler(async (req, res) => {
  res.json(await progressService.getProgress(req.user._id));
});

export const putProgress = asyncHandler(async (req, res) => {
  const problemId = v.problemId(req.params.problemId);
  const { solved, notes } = req.body || {};
  if (solved === undefined && notes === undefined) {
    throw ApiError.badRequest('Provide "solved" (boolean) and/or "notes" (string)');
  }
  if (solved !== undefined && typeof solved !== 'boolean') throw ApiError.badRequest('"solved" must be a boolean');
  if (notes !== undefined && typeof notes !== 'string') throw ApiError.badRequest('"notes" must be a string');
  if (notes !== undefined && notes.length > v.NOTES_MAX) {
    throw ApiError.badRequest(`"notes" must be at most ${v.NOTES_MAX} characters`);
  }
  res.json(await progressService.updateProgress(req.user._id, problemId, { solved, notes }));
});

export const getBookmarks = asyncHandler(async (req, res) => {
  const items = await progressService.listBookmarks(req.user._id);
  res.json({ items, total: items.length });
});

export const putBookmark = asyncHandler(async (req, res) => {
  const problemId = v.problemId(req.params.problemId);
  const { bookmarked } = req.body || {};
  if (typeof bookmarked !== 'boolean') throw ApiError.badRequest('"bookmarked" must be a boolean');
  res.json(await progressService.setBookmark(req.user._id, problemId, bookmarked));
});
