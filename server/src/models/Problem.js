import mongoose from 'mongoose';

const leetcodeSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    slug: { type: String, required: true },
    title: String,
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    premium: { type: Boolean, default: false },
    verification: String,
  },
  { _id: false }
);

const gfgSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    slug: { type: String, required: true },
    title: String,
    difficulty: String,
    verification: { type: String, enum: ['exact-title', 'manual-review'] },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "a2z-564" (stable, derived from the reference sheet id)
    sourceId: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    step: { type: Number, required: true, min: 1 },
    topic: { type: String, required: true },
    subtopic: { type: String, required: true },
    subtopicOrder: { type: Number, required: true },
    order: { type: Number, required: true }, // uniqueness is enforced by the data validator
    difficulty: { type: String, enum: ['Basic', 'Core', 'Pro', null], default: null },
    leetcode: { type: leetcodeSchema, default: null },
    gfg: { type: gfgSchema, default: null },
    platformAvailability: [{ type: String, enum: ['leetcode', 'gfg'] }],
    sourceUrl: String,
  },
  { timestamps: true, versionKey: false }
);

problemSchema.index({ step: 1, order: 1 });

problemSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  },
});

export default mongoose.model('Problem', problemSchema);
