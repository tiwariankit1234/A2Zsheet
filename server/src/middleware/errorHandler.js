import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralised error handler: every error leaves the API as { error: { message, details? } }.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err?.code === 11000) {
    status = 409;
    message = 'Duplicate value';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err?.name === 'MongoServerSelectionError' || err?.name === 'MongoNetworkError') {
    status = 503;
    message = 'Database unavailable';
  }

  if (!(err instanceof ApiError) && status >= 500 && !env.isTest) {
    console.error('[error]', err);
  }
  if (status >= 500 && env.isProd) message = 'Internal server error';

  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}
