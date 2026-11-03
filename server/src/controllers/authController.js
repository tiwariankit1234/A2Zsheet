import asyncHandler from '../utils/asyncHandler.js';
import * as v from '../utils/validators.js';
import * as authService from '../services/authService.js';
import { signToken } from '../middleware/auth.js';

const respond = (res, user, status = 200) =>
  res.status(status).json({ token: signToken(user), user: user.toPublic() });

export const guest = asyncHandler(async (req, res) => {
  respond(res, await authService.createGuest(), 201);
});

export const register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const input = { email: v.email(body.email), password: v.password(body.password), name: v.displayName(body.name) };
  respond(res, await authService.register(input, req.user), 201);
});

export const login = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const input = { email: v.email(body.email), password: String(body.password || '') };
  respond(res, await authService.login(input, req.user));
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublic() });
});
