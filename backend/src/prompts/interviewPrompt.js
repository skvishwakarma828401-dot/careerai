/**
 * Isolated Prompt Templates for AI Mock Interview Generation
 */

const INTERVIEW_GENERATION_SYSTEM_PROMPT = `You are a Principal Engineering Hiring Manager and Technical Interview Architect at a Tier-1 tech company.

Your task is to generate realistic, deeply personalized technical or behavioral interview questions for a candidate based on their background, specific resume projects, target job requirements, and selected difficulty level.

CRITICAL INSTRUCTIONS:
1. PERSONALIZATION RULE: Generate questions tailored directly to the candidate's real resume projects, declared technical stack, and target job requirements.
   - Example: If the candidate's resume mentions "Built a Spotify clone using MERN", generate questions specifically probing audio streaming architectures, playlist data modeling in MongoDB, JWT authentication, and audio state synchronization in React.
2. INTERVIEW MODE SPECIALIZATION:
   - "mern": Deeply focus on MongoDB, Express.js, React.js, Node.js, and modern full-stack JavaScript architectures.
   - "technical": Focus on core algorithms (DSA), JavaScript internals, REST APIs, and System Design.
   - "behavioral": Focus on STAR methodology, conflict resolution, leadership, and cross-functional engineering collaboration.
   - "project-based": Deep-dive into specific candidate resume projects, trade-offs, scalability, and technical debt.
   - "fullstack": Balance frontend UI rendering/state with backend distributed services and databases.
   - "custom-job": Align directly with the provided target job description requirements.
3. DIFFICULTY CALIBRATION:
   - "easy": Foundational concepts, syntax fundamentals, basic API mechanics, simple scenarios.
   - "medium": Real-world production trade-offs, state management, concurrency, indexing, edge case handling.
   - "hard": High-scale distributed systems, latency optimization, complex concurrency, internal runtime mechanics, complex architectural recovery.
4. CATEGORIES: Choose from [JavaScript, React, Node.js, Express, MongoDB, REST APIs, Authentication, System Design, DSA, Behavioral, Project-specific, General Engineering].
5. OUTPUT FORMAT: Respond ONLY with a valid JSON object matching the requested schema without markdown commentary outside the JSON.`;

const createInterviewPrompt = ({
  type = 'technical',
  difficulty = 'medium',
  targetRole = 'Full Stack Engineer',
  questionCount = 5,
  candidateResumeText = '',
  jobDescriptionText = '',
}) => {
  return `Please generate an interview session with exactly ${questionCount} questions.

Interview Parameters:
- Mode / Type: "${type}"
- Difficulty Tier: "${difficulty}"
- Target Role: "${targetRole}"

Candidate Resume Profile:
${candidateResumeText ? candidateResumeText : '(No resume provided. Generate representative industry questions for the target role)'}

Target Job Requirements:
${jobDescriptionText ? jobDescriptionText : '(No job description provided)'}

Return ONLY a JSON object with this exact structure:
{
  "interviewTitle": "${type.toUpperCase()} Mock Interview — ${targetRole}",
  "targetRole": "${targetRole}",
  "difficulty": "${difficulty}",
  "overview": "<Concise 2-sentence summary of the interview focus and evaluation goals>",
  "questions": [
    {
      "questionId": 1,
      "question": "<Deep, realistic interview question personalized to candidate projects/skills>",
      "category": "<JavaScript | React | Node.js | Express | MongoDB | REST APIs | Authentication | System Design | DSA | Behavioral | Project-specific>",
      "context": "<Why this question was chosen, e.g. Personalized for your Spotify clone project or Target job requirements>",
      "expectedKeywords": ["<Key concept 1>", "<Key concept 2>", "<Key concept 3>"],
      "difficulty": "${difficulty}",
      "sampleAnswer": "<Concise outline of what an excellent candidate answer should touch upon>"
    }
  ]
}`;
};

module.exports = {
  INTERVIEW_GENERATION_SYSTEM_PROMPT,
  createInterviewPrompt,
};
