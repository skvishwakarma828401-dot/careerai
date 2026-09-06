const { z } = require('zod');

const skillsSchema = z.object({
  programmingLanguages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  toolsAndCloud: z.array(z.string()).default([]),
  all: z.array(z.string()).default([]),
});

const experienceItemSchema = z.object({
  role: z.string().default(''),
  company: z.string().default(''),
  duration: z.string().default(''),
  highlights: z.array(z.string()).default([]),
});

const educationItemSchema = z.object({
  degree: z.string().default(''),
  institution: z.string().default(''),
  year: z.string().default(''),
  details: z.string().default(''),
});

const projectItemSchema = z.object({
  title: z.string().default(''),
  technologies: z.array(z.string()).default([]),
  description: z.string().default(''),
  highlights: z.array(z.string()).default([]),
});

const resumeAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
  skills: skillsSchema,
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  certifications: z.array(z.string()).default([]),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  atsImprovements: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).min(1),
});

module.exports = {
  resumeAnalysisSchema,
};
