import ApiError from './ApiError.js';

export const DIFFICULTIES = ['Basic', 'Core', 'Pro', 'Unrated'];
export const PLATFORMS = ['leetcode', 'gfg', 'both', 'none', 'any'];
export const STATUSES = ['all', 'solved', 'unsolved', 'bookmarked'];
export const SORTS = ['order', 'title', 'difficulty'];
export const PROBLEM_ID_RE = /^a2z-\d{1,7}$/;
export const NOTES_MAX = 2000;

export function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function oneOf(value, allowed, name) {
  if (value === undefined || value === '') return undefined;
  const v = String(value);
  if (!allowed.includes(v)) {
    throw ApiError.badRequest(`Invalid ${name}. Allowed: ${allowed.join(', ')}`);
  }
  return v;
}

export function intInRange(value, { name, min, max, fallback }) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw ApiError.badRequest(`${name} must be an integer between ${min} and ${max}`);
  }
  return n;
}

export function problemId(value) {
  if (!PROBLEM_ID_RE.test(String(value || ''))) {
    throw ApiError.badRequest('Invalid problem id');
  }
  return String(value);
}

export function searchQuery(value, { required = false } = {}) {
  const q = typeof value === 'string' ? value.trim() : '';
  if (required && !q) throw ApiError.badRequest('Query parameter "q" is required');
  if (q.length > 100) throw ApiError.badRequest('Search query is too long (max 100 characters)');
  return q;
}

export function email(value) {
  const e = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) || e.length > 254) {
    throw ApiError.badRequest('A valid email is required');
  }
  return e;
}

export function password(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw ApiError.badRequest('Password must be 8-128 characters long');
  }
  return value;
}

export function displayName(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = String(value).trim();
  if (n.length > 60) throw ApiError.badRequest('Name must be at most 60 characters');
  return n || undefined;
}
