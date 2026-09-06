const mongoose = require('mongoose');

const topicItemSchema = new mongoose.Schema(
  {
    topicId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ['Project', 'Architecture', 'Exercise', 'Reading', 'Mock Interview', 'Optimization'],
      default: 'Exercise',
    },
    estimatedHours: {
      type: Number,
      default: 3,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const weekItemSchema = new mongoose.Schema(
  {
    weekNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    topics: [topicItemSchema],
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Roadmap must belong to an authenticated user'],
      index: true,
    },
    targetRole: {
      type: String,
      required: true,
      default: 'Senior Full Stack Engineer',
      trim: true,
    },
    goals: {
      type: [String],
      default: [],
    },
    weeks: {
      type: [weekItemSchema],
      default: [],
    },
    topics: {
      type: [String],
      default: [],
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedTopics: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    sourceData: {
      resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      skillGapsCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

roadmapSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);
