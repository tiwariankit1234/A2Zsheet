import env from '../config/env.js';

// Small in-memory, fixed-window rate limiter keyed by client IP.
// Good enough for a single instance (Render free tier runs one); swap for a shared store
// such as Redis if the API is ever scaled out to several instances.
export function rateLimit({ windowMs, max, message = 'Too many requests, please try again later.' }) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Drop expired entries so the map cannot grow without bound.
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return function rateLimitMiddleware(req, res, next) {
    if (env.isTest) return next();

    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil((entry.resetAt - now) / 1000)));

    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: { message } });
    }
    next();
  };
}

const MINUTE = 60 * 1000;

// Every API route: generous, only stops floods.
export const apiLimiter = rateLimit({ windowMs: MINUTE, max: 300 });

// Login and register: slows down password guessing.
export const authLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  max: 20,
  message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
});

// Guest sessions: stops scripts from filling the database with empty guest users.
export const guestLimiter = rateLimit({
  windowMs: 60 * MINUTE,
  max: 30,
  message: 'Too many new sessions from this network. Please try again later.',
});
