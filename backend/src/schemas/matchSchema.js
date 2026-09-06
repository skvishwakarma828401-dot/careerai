const { z } = require('zod');

const priorityGapItemSchema = z.object({
  skill: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  reason: z.string().default(''),
});

const matchSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string().default(''),
  matchingSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  strongMatches: z.array(z.string()).default([]),
  weakMatches: z.array(z.string()).default([]),
  priorityGaps: z.array(priorityGapItemSchema).default([]),
  semanticSimilarityScore: z.number().min(0).max(100).default(0),
  skillsMatchPercentage: z.number().min(0).max(100).default(0),
  recommendations: z.array(z.string()).default([]),
});

module.exports = {
  matchSchema,
};
