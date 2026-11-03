import User from '../models/User.js';
import UserProblem from '../models/UserProblem.js';

const DAY = 24 * 60 * 60 * 1000;

// Deletes guest users (and their progress) that have not been seen for `days` days.
// Guest tokens expire after JWT_EXPIRES_IN (30 days by default), so by then a stale guest
// can never sign back in and its data is unreachable anyway.
export async function deleteStaleGuests({ days = 30, batchSize = 500 } = {}) {
  const cutoff = new Date(Date.now() - days * DAY);
  const filter = {
    isGuest: true,
    $or: [{ lastSeenAt: { $lt: cutoff } }, { lastSeenAt: { $exists: false }, updatedAt: { $lt: cutoff } }],
  };

  let deleted = 0;
  for (;;) {
    const ids = (await User.find(filter).select('_id').limit(batchSize).lean()).map((u) => u._id);
    if (!ids.length) break;
    await UserProblem.deleteMany({ user: { $in: ids } });
    const res = await User.deleteMany({ _id: { $in: ids }, isGuest: true });
    deleted += res.deletedCount || 0;
    if (ids.length < batchSize) break;
  }
  return deleted;
}

// Runs the cleanup once now and then once a day. Errors are logged, never thrown.
export function scheduleGuestCleanup({ days = 30, log = console.info } = {}) {
  const run = async () => {
    try {
      const n = await deleteStaleGuests({ days });
      if (n) log(`[cleanup] Removed ${n} inactive guest account(s) older than ${days} days`);
    } catch (err) {
      console.warn('[cleanup] Guest cleanup failed:', err.message);
    }
  };
  run();
  return setInterval(run, DAY).unref();
}
