import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    step: { type: Number, required: true, unique: true, min: 1 },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    problemCount: { type: Number, required: true, min: 0 },
    subtopics: [
      new mongoose.Schema({ name: { type: String, required: true }, order: Number }, { _id: false }),
    ],
  },
  { versionKey: false }
);

topicSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Topic', topicSchema);
