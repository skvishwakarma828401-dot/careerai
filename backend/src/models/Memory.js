const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Memory must belong to an authenticated user'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Memory type is required'],
      enum: [
        'goal',
        'weakness',
        'strength',
        'target_role',
        'interview_pattern',
        'skill_improvement',
        'learning_progress',
      ],
      index: true,
    },
    key: {
      type: String,
      required: [true, 'Memory key identifier is required'],
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Memory value content is required'],
    },
    importance: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

memorySchema.index({ userId: 1, type: 1 });
memorySchema.index({ userId: 1, key: 1 });

module.exports = mongoose.model('Memory', memorySchema);
