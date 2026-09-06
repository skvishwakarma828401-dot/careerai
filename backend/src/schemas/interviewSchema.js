const { z } = require('zod');

const interviewCategoryEnum = z.enum([
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
]);

const interviewQuestionSchema = z.object({
  questionId: z.number(),
  question: z.string().min(10),
  category: interviewCategoryEnum.default('General Engineering'),
  context: z.string().default(''),
  expectedKeywords: z.array(z.string()).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  sampleAnswer: z.string().default(''),
});

const interviewGenerationOutputSchema = z.object({
  interviewTitle: z.string().default('Technical Mock Interview'),
  targetRole: z.string().default('Full Stack Engineer'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  overview: z.string().default(''),
  questions: z.array(interviewQuestionSchema).min(1),
});

module.exports = {
  interviewQuestionSchema,
  interviewGenerationOutputSchema,
  interviewCategoryEnum,
};
