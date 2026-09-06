const { z } = require('zod');

const topicItemZodSchema = z.object({
  topicId: z.string().default(() => `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
  title: z.string().min(2, 'Topic title must be at least 2 characters'),
  description: z.string().optional().default(''),
  resourceType: z.enum(['Project', 'Architecture', 'Exercise', 'Reading', 'Mock Interview', 'Optimization']).default('Exercise'),
  estimatedHours: z.number().min(1).max(40).default(4),
});

const weekItemZodSchema = z.object({
  weekNumber: z.number().int().min(1).max(52),
  title: z.string().min(3, 'Week title must be at least 3 characters'),
  description: z.string().optional().default(''),
  topics: z.array(topicItemZodSchema).min(1, 'Each week must have at least 1 learning topic'),
});

const roadmapOutputSchema = z.object({
  targetRole: z.string().min(2).default('Senior Full Stack Software Engineer'),
  overview: z.string().optional().default('Structured personalized preparation plan designed to bridge high-priority skill gaps and achieve production engineering readiness.'),
  goals: z.array(z.string()).min(1).default(['Master core containerization and caching patterns', 'Elevate distributed system design proficiency']),
  weeks: z.array(weekItemZodSchema).min(2).max(12),
});

module.exports = {
  topicItemZodSchema,
  weekItemZodSchema,
  roadmapOutputSchema,
};
