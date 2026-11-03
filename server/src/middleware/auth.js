import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

function readToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

async function resolveUser(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  return user;
}

// Requires a valid token; attaches req.user.
export async function requireAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) throw ApiError.unauthorized();
    req.user = await resolveUser(token);
    next();
  } catch (err) {
    next(err);
  }
}

// Attaches req.user when a valid token is present; continues anonymously otherwise.
// An invalid token is still rejected so the client knows to discard it.
export async function optionalAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (token) req.user = await resolveUser(token);
    next();
  } catch (err) {
    next(err);
  }
}

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), guest: user.isGuest }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}
