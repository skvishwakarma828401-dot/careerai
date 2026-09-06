const { z } = require('zod');

const technologiesSchema = z.object({
  languages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  cloudAndTools: z.array(z.string()).default([]),
});

const jobAnalysisSchema = z.object({
  jobTitle: z.string().default(''),
  company: z.string().default(''),
  seniorityLevel: z.string().default('Mid-Level'),
  summary: z.string().default(''),
  requiredSkills: z.array(z.string()).min(1),
  preferredSkills: z.array(z.string()).default([]),
  technologies: technologiesSchema,
  responsibilities: z.array(z.string()).default([]),
  experienceRequirements: z.string().default(''),
  educationRequirements: z.string().default(''),
  softSkills: z.array(z.string()).default([]),
});

module.exports = {
  jobAnalysisSchema,
};
