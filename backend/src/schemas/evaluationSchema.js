const { z } = require('zod');

const answerEvaluationSchema = z.object({
  technicalAccuracy: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  problemSolving: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  missingConcepts: z.array(z.string()).default([]),
  feedback: z.string().min(10),
});

const finalReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  rating: z.string(),
  summary: z.string().min(20),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  missingConcepts: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  categoryScores: z.record(z.string(), z.number()).default({}),
});

module.exports = {
  answerEvaluationSchema,
  finalReportSchema,
};
