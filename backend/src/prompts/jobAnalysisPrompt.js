/**
 * Isolated Prompt Templates for Job Description Intelligence & Skill Extraction
 */

const JOB_ANALYSIS_SYSTEM_PROMPT = `You are a Principal Talent Acquisition Lead and Staff Engineering Interview Architect.

Your role is to deeply analyze raw technical job descriptions and decompose them into precise, structured hiring criteria.

CRITICAL INSTRUCTIONS:
1. Distinguish strictly between:
   - REQUIRED SKILLS: Non-negotiable must-haves explicitly requested.
   - PREFERRED SKILLS: "Nice to have", "plus", or preferred qualifications.
2. Group extracted technologies cleanly into:
   - languages
   - frameworks
   - databases
   - cloudAndTools
3. Extract exact experience thresholds (e.g. "3+ years of Node.js and distributed systems", "5+ years backend").
4. Extract minimum education credentials (e.g. "Bachelor's degree in CS, Software Engineering or equivalent experience").
5. Summarize key daily engineering responsibilities into concise bullet points.
6. Extract key soft/collaborative skills (e.g. "Cross-functional communication", "Agile sprint leadership").
7. OUTPUT FORMAT: Respond ONLY with a valid, raw JSON object matching the requested schema without markdown or commentary.`;

const createJobAnalysisPrompt = ({ jobTitle = '', company = '', descriptionText = '' }) => {
  return `Please analyze the following technical job posting:

Provided Title: ${jobTitle || 'Not specified'}
Provided Company: ${company || 'Not specified'}

--- BEGIN JOB DESCRIPTION ---
${descriptionText}
--- END JOB DESCRIPTION ---

Return ONLY a JSON object with this exact schema:
{
  "jobTitle": "<Normalized official job title, e.g. Senior Full Stack Engineer>",
  "company": "<Extracted company name, or provided name>",
  "seniorityLevel": "<Entry-Level | Junior | Mid-Level | Senior | Staff/Lead>",
  "summary": "<Concise 2-sentence overview of the role and technical mission>",
  "requiredSkills": [
    "<Essential skill 1>",
    "<Essential skill 2>"
  ],
  "preferredSkills": [
    "<Preferred/bonus skill 1>",
    "<Preferred/bonus skill 2>"
  ],
  "technologies": {
    "languages": ["<Language 1>", "<Language 2>"],
    "frameworks": ["<Framework 1>", "<Framework 2>"],
    "databases": ["<Database 1>", "<Database 2>"],
    "cloudAndTools": ["<Tool/Cloud 1>", "<Tool/Cloud 2>"]
  },
  "responsibilities": [
    "<Key engineering responsibility 1>",
    "<Key engineering responsibility 2>"
  ],
  "experienceRequirements": "<Detailed experience requirements, e.g. 3+ years full-stack web development with React & Node.js>",
  "educationRequirements": "<Education requirements, e.g. BS in Computer Science or equivalent practical experience>",
  "softSkills": [
    "<Soft skill 1>",
    "<Soft skill 2>"
  ]
}`;
};

module.exports = {
  JOB_ANALYSIS_SYSTEM_PROMPT,
  createJobAnalysisPrompt,
};
