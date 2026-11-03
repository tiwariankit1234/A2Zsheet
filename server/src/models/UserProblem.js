import mongoose from 'mongoose';

// One document per (user, problem) holding everything personal about that problem:
// solved state, bookmark and notes. Missing document == untouched problem.
const userProblemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problem: { type: String, ref: 'Problem', required: true },
    solved: { type: Boolean, default: false },
    solvedAt: { type: Date, default: null },
    bookmarked: { type: Boolean, default: false },
    bookmarkedAt: { type: Date, default: null },
    notes: { type: String, default: '', maxlength: 2000 },
  },
  { timestamps: true, versionKey: false }
);

userProblemSchema.index({ user: 1, problem: 1 }, { unique: true });
userProblemSchema.index({ user: 1, bookmarked: 1 });

userProblemSchema.methods.toPublic = function toPublic() {
  return {
    problemId: this.problem,
    solved: this.solved,
    solvedAt: this.solvedAt,
    bookmarked: this.bookmarked,
    bookmarkedAt: this.bookmarkedAt,
    notes: this.notes,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('UserProblem', userProblemSchema);
