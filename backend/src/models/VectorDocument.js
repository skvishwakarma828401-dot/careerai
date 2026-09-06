const mongoose = require('mongoose');

const vectorDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vector must belong to an authenticated user'],
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Vector must be linked to a source document ID'],
      index: true,
    },
    sourceType: {
      type: String,
      required: [true, 'Source type is required'],
      enum: ['resume', 'job', 'project', 'interview'],
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    chunkText: {
      type: String,
      required: [true, 'Chunk text is required'],
    },
    embedding: {
      type: [Number],
      required: [true, 'Dense vector embedding array is required'],
      select: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed scoped vector lookups
vectorDocumentSchema.index({ userId: 1, sourceType: 1 });
vectorDocumentSchema.index({ userId: 1, sourceId: 1 });

module.exports = mongoose.model('VectorDocument', vectorDocumentSchema);
