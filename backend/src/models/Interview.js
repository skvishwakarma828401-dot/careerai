const mongoose = require('mongoose');

const questionItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: [true, 'Question text is required'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'JavaScript',
        'React',
        'Node.js',
        'Express',
        'MongoDB',
        'REST APIs',
        'Authentication',
        'System Design',
        'DSA',
        'Behavioral',
        'Project-specific',
        'General Engineering',
      ],
      default: 'General Engineering',
    },
    context: {
      type: String,
      default: '',
    },
    expectedKeywords: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    sampleAnswer: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const answerItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      required: true,
    },
    userAnswer: {
      type: String,
      required: [true, 'User answer text is required'],
    },
    technicalAccuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completeness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    problemSolving: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    communication: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    clarity: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    missingConcepts: {
      type: [String],
      default: [],
    },
    feedback: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Interview must belong to an authenticated user'],
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    type: {
      type: String,
      required: [true, 'Interview type is required'],
      enum: ['technical', 'behavioral', 'project-based', 'mern', 'fullstack', 'custom-job'],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    targetRole: {
      type: String,
      trim: true,
      default: 'Full Stack Engineer',
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    questions: {
      type: [questionItemSchema],
      default: [],
    },
    answers: {
      type: [answerItemSchema],
      default: [],
    },
    scores: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        technicalAccuracy: 0,
        completeness: 0,
        problemSolving: 0,
        communication: 0,
        clarity: 0,
        overall: 0,
        byCategory: {},
      },
    },
    adaptiveLog: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
      index: true,
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    feedback: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

interviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Interview', interviewSchema);
