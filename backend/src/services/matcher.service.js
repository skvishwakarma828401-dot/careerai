const { generateEmbedding, cosineSimilarity } = require('./embedding.service');
const { matchSchema } = require('../schemas/matchSchema');
const logger = require('../utils/logger');

// Common technical skill synonyms and normalization dictionary
const SYNONYMS = {
  'react.js': 'react',
  'reactjs': 'react',
  'node.js': 'node',
  'nodejs': 'node',
  'express.js': 'express',
  'expressjs': 'express',
  'next.js': 'nextjs',
  'vue.js': 'vue',
  'typescript': 'ts',
  'javascript': 'js',
  'postgresql': 'postgres',
  'mongodb': 'mongo',
  'kubernetes': 'k8s',
  'amazon web services': 'aws',
  'docker containers': 'docker',
  'google cloud': 'gcp',
  'golang': 'go',
};

const normalizeSkill = (skill) => {
  if (!skill) return '';
  const cleaned = skill.trim().toLowerCase();
  return SYNONYMS[cleaned] || cleaned;
};

/**
 * Match a Candidate Resume against a Target Job Description using hybrid semantic & deterministic scoring
 * @param {Object} params
 * @param {Object} params.resume - Resume Mongoose document
 * @param {Object} params.job - Job Mongoose document
 * @returns {Promise<Object>} Validated match analysis
 */
const matchResumeToJob = async ({ resume, job }) => {
  if (!resume || !resume.extractedText) {
    throw new Error('Resume is missing readable extracted text.');
  }

  if (!job || !job.description) {
    throw new Error('Job description content is missing.');
  }

  logger.info(`Starting hybrid semantic match: Resume "${resume.originalFileName}" vs Job "${job.title}"`);

  // 1. Extract Candidate Skills
  const candidateSkillsRaw = resume.analysis?.skills?.all || extractSkillsFromRawText(resume.extractedText);
  const candidateSkillsSet = new Set(candidateSkillsRaw.map(normalizeSkill));

  // 2. Extract Job Skills
  const jobRequiredRaw = job.requiredSkills?.length ? job.requiredSkills : extractSkillsFromRawText(job.description).slice(0, 5);
  const jobPreferredRaw = job.preferredSkills?.length ? job.preferredSkills : extractSkillsFromRawText(job.description).slice(5, 8);

  const jobAllSkillsRaw = Array.from(new Set([...jobRequiredRaw, ...jobPreferredRaw]));

  // 3. Compute Matching and Missing Skills
  const matchingSkills = [];
  const missingRequired = [];
  const missingPreferred = [];

  jobRequiredRaw.forEach((skill) => {
    const norm = normalizeSkill(skill);
    if (candidateSkillsSet.has(norm) || isFuzzySkillPresent(norm, resume.extractedText)) {
      matchingSkills.push(skill);
    } else {
      missingRequired.push(skill);
    }
  });

  jobPreferredRaw.forEach((skill) => {
    const norm = normalizeSkill(skill);
    if (candidateSkillsSet.has(norm) || isFuzzySkillPresent(norm, resume.extractedText)) {
      if (!matchingSkills.includes(skill)) {
        matchingSkills.push(skill);
      }
    } else {
      missingPreferred.push(skill);
    }
  });

  const missingSkills = Array.from(new Set([...missingRequired, ...missingPreferred]));

  // 4. Calculate Skills Match Percentage (Deterministic)
  const totalJobSkillsCount = Math.max(1, jobAllSkillsRaw.length);
  const skillsMatchPercentage = parseFloat(
    Math.min(100, Math.max(0, (matchingSkills.length / totalJobSkillsCount) * 100)).toFixed(1)
  );

  // 5. Calculate Semantic Vector Similarity Score
  const [resumeVec, jobVec] = await Promise.all([
    generateEmbedding(resume.extractedText.substring(0, 1500)),
    generateEmbedding(job.description.substring(0, 1500)),
  ]);

  const rawCosineSim = cosineSimilarity(resumeVec, jobVec);
  const semanticSimilarityScore = parseFloat((rawCosineSim * 100).toFixed(1));

  // 6. Experience & Domain Relevance Alignment
  let experienceScore = 70;
  const lowerResume = resume.extractedText.toLowerCase();
  const lowerJob = job.description.toLowerCase();

  if (lowerJob.includes('senior') && (lowerResume.includes('senior') || lowerResume.includes('lead') || lowerResume.includes('architect'))) {
    experienceScore += 15;
  } else if (lowerJob.includes('junior') || lowerJob.includes('entry') || lowerJob.includes('fresher')) {
    experienceScore += 20;
  }
  if (lowerResume.length > 800) experienceScore += 10;
  experienceScore = Math.min(100, experienceScore);

  // 7. Deterministic Hybrid Match Score Calculation
  // 45% Skills Coverage + 40% Semantic Vector Similarity + 15% Experience Alignment
  let hybridScore = Math.round(
    0.45 * skillsMatchPercentage + 0.40 * semanticSimilarityScore + 0.15 * experienceScore
  );

  // If there are 0 matching skills, ensure score reflects a low match
  if (matchingSkills.length === 0 && skillsMatchPercentage === 0) {
    hybridScore = Math.min(hybridScore, 35);
  }

  hybridScore = Math.max(0, Math.min(100, hybridScore));

  // 8. Construct Strong & Weak Matches
  const strongMatches = [];
  const weakMatches = [];

  if (matchingSkills.length > 0) {
    strongMatches.push(
      `Core skill alignment in: ${matchingSkills.slice(0, 4).join(', ')}.`
    );
  }
  if (semanticSimilarityScore >= 75) {
    strongMatches.push('High contextual and architectural alignment with the role description.');
  }

  if (missingRequired.length > 0) {
    weakMatches.push(
      `Missing must-have technical requirements: ${missingRequired.slice(0, 3).join(', ')}.`
    );
  }
  if (missingPreferred.length > 0) {
    weakMatches.push(
      `Secondary / preferred stack gaps: ${missingPreferred.slice(0, 3).join(', ')}.`
    );
  }

  // 9. Construct Prioritized Skill Gaps
  const priorityGaps = [];

  missingRequired.forEach((skill) => {
    priorityGaps.push({
      skill,
      priority: 'High',
      reason: `Mandatory core requirement explicitly requested in ${job.title} job criteria.`,
    });
  });

  missingPreferred.forEach((skill) => {
    priorityGaps.push({
      skill,
      priority: 'Medium',
      reason: `Preferred bonus skill that enhances candidate competitiveness for this role.`,
    });
  });

  // 10. Generate Tailored Resume Optimization Recommendations
  const recommendations = [];

  if (missingRequired.length > 0) {
    recommendations.push(
      `Incorporate projects or practical coursework demonstrating proficiency in ${missingRequired.slice(0, 2).join(' and ')}.`
    );
  }

  recommendations.push(
    `Align your resume summary specifically with the title "${job.title}" at ${job.company || 'the target company'}.`
  );

  if (matchingSkills.length > 0) {
    recommendations.push(
      `Emphasize quantifiable achievements with ${matchingSkills.slice(0, 3).join(', ')} (e.g. latency reductions, feature delivery scale).`
    );
  }

  // 11. Summary
  let ratingLabel = 'Strong Fit';
  if (hybridScore < 60) ratingLabel = 'Significant Skill Gap';
  else if (hybridScore < 80) ratingLabel = 'Moderate Fit';

  const summary = `Candidate achieves a ${hybridScore}% match score (${ratingLabel}) for ${job.title}. Candidate matches ${matchingSkills.length} required/preferred technologies with ${missingSkills.length} identified skill gaps.`;

  const matchOutput = {
    matchScore: hybridScore,
    summary,
    matchingSkills,
    missingSkills,
    strongMatches,
    weakMatches,
    priorityGaps,
    semanticSimilarityScore,
    skillsMatchPercentage,
    recommendations,
  };

  // Validate output with Zod schema
  return matchSchema.parse(matchOutput);
};

/**
 * Fallback heuristic skill extractor
 */
const extractSkillsFromRawText = (text) => {
  const lower = text.toLowerCase();
  const skillDict = [
    'React', 'Node.js', 'Express', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'C++', 'SQL',
    'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'CI/CD',
    'GraphQL', 'REST APIs', 'HTML5', 'CSS3', 'Tailwind', 'Microservices', 'System Design'
  ];

  return skillDict.filter((s) => lower.includes(s.toLowerCase()));
};

const isFuzzySkillPresent = (normalizedSkill, fullText) => {
  const lower = fullText.toLowerCase();
  return lower.includes(normalizedSkill);
};

module.exports = {
  matchResumeToJob,
};
