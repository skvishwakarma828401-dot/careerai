const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resume must belong to a user'],
      index: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      enum: ['pdf', 'docx'],
      lowercase: true,
    },
    extractedText: {
      type: String,
      required: [true, 'Extracted text content is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'extracted', 'analyzed', 'failed'],
      default: 'extracted',
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate word and character count before saving
resumeSchema.pre('save', function (next) {
  if (this.extractedText) {
    this.characterCount = this.extractedText.length;
    const words = this.extractedText.trim().split(/\s+/).filter(Boolean);
    this.wordCount = words.length;
  }
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);
