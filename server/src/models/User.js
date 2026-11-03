import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Guest users are created anonymously so progress can be saved before signing up.
    isGuest: { type: Boolean, default: true },
    name: { type: String, trim: true, maxlength: 60 },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String, select: false },
  },
  { timestamps: true, versionKey: false }
);

// Unique only for registered users: guests have no email field, and a sparse index skips them.
userSchema.index({ email: 1 }, { unique: true, sparse: true });

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};

userSchema.methods.checkPassword = function checkPassword(plain) {
  return this.passwordHash ? bcrypt.compare(plain, this.passwordHash) : Promise.resolve(false);
};

userSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    isGuest: this.isGuest,
    name: this.name || null,
    email: this.email || null,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
