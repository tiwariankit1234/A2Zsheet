import User from '../models/User.js';
import UserProblem from '../models/UserProblem.js';
import ApiError from '../utils/ApiError.js';

export async function createGuest() {
  return User.create({ isGuest: true });
}

// Registers an account. If the caller is a guest, that guest is upgraded in place,
// so all progress saved so far is kept.
export async function register({ email, password, name }, currentUser) {
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');

  const user = currentUser?.isGuest ? await User.findById(currentUser._id) : new User();
  user.isGuest = false;
  user.email = email;
  user.name = name;
  await user.setPassword(password);
  await user.save();
  return user;
}

export async function login({ email, password }, currentUser) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.checkPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (currentUser?.isGuest && String(currentUser._id) !== String(user._id)) {
    await mergeGuestProgress(currentUser._id, user._id);
  }
  return user;
}

// Copies a guest's progress into an account (union of solved/bookmarks, account notes win),
// then deletes the guest.
export async function mergeGuestProgress(guestId, userId) {
  const [guestRows, userRows] = await Promise.all([
    UserProblem.find({ user: guestId }).lean(),
    UserProblem.find({ user: userId }).lean(),
  ]);
  const existing = new Map(userRows.map((r) => [r.problem, r]));

  const ops = guestRows.map((g) => {
    const u = existing.get(g.problem);
    const solved = Boolean(u?.solved || g.solved);
    const bookmarked = Boolean(u?.bookmarked || g.bookmarked);
    return {
      updateOne: {
        filter: { user: userId, problem: g.problem },
        update: {
          $set: {
            solved,
            solvedAt: u?.solvedAt || g.solvedAt || (solved ? new Date() : null),
            bookmarked,
            bookmarkedAt: u?.bookmarkedAt || g.bookmarkedAt || (bookmarked ? new Date() : null),
            notes: u?.notes || g.notes || '',
          },
        },
        upsert: true,
      },
    };
  });
  if (ops.length) await UserProblem.bulkWrite(ops);
  await UserProblem.deleteMany({ user: guestId });
  await User.deleteOne({ _id: guestId, isGuest: true });
}
