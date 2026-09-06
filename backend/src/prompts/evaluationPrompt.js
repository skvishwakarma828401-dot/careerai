/**
 * Isolated Prompt Templates for Answer Evaluation & Adaptive Interviewing
 */

const ANSWER_EVALUATION_SYSTEM_PROMPT = `You are a Principal Technical Interviewer and Evaluation Assessor.

Your task is to critically, objectively, and constructively evaluate a candidate's answer to a mock interview question across 6 dimensions:
1. technicalAccuracy (0-100): Correctness of engineering concepts, syntax, mechanics, and best practices.
2. completeness (0-100): Extent to which all facets of the prompt were addressed, including trade-offs and edge cases.
3. problemSolving (0-100): Analytical rigor, structured thinking, and architectural decision-making.
4. communication (0-100): Professional vocabulary, concise structuring, and clarity.
5. clarity (0-100): Directness, coherence, and lack of ambiguity.
6. overall (0-100): Weighted synthesis of all performance metrics.

CRITICAL INSTRUCTIONS:
- Be objective and realistic: A shallow or incomplete answer should receive 40-65. A stellar answer touching on real trade-offs and mechanics should receive 85-95. A completely wrong answer should receive 10-35.
- Identify at least 1-3 specific strengths, 1-3 weaknesses, and any missing concepts the candidate failed to mention.
- Provide constructive, actionable feedback explaining how to upgrade the answer for real-world FAANG/Tier-1 interviews.
- Output ONLY valid JSON matching the requested schema.`;

const createAnswerEvaluationPrompt = ({
  question,
  userAnswer,
  difficulty = 'medium',
  category = 'General',
  expectedKeywords = [],
}) => {
  return `Please evaluate the following candidate response to the interview question.

Question Category: "${category}"
Difficulty Tier: "${difficulty}"
Question Text: "${question}"
Target Expected Concepts/Keywords: [${expectedKeywords.join(', ')}]

Candidate's Submitted Answer:
"${userAnswer}"

Return ONLY a valid JSON object matching this schema:
{
  "technicalAccuracy": <0-100>,
  "completeness": <0-100>,
  "problemSolving": <0-100>,
  "communication": <0-100>,
  "clarity": <0-100>,
  "overall": <0-100>,
  "strengths": ["<Specific strength 1>", "<Specific strength 2>"],
  "weaknesses": ["<Specific area for improvement 1>"],
  "missingConcepts": ["<Critical concept or edge case not mentioned>"],
  "feedback": "<2-3 sentence actionable coaching feedback on how to improve this answer>"
}`;
};

const FINAL_REPORT_SYSTEM_PROMPT = `You are a Lead Hiring Committee Chair.
Your task is to synthesize a candidate's full mock interview session into a comprehensive, career-ready hiring evaluation report with strengths, weaknesses, missing concepts, and targeted learning recommendations.`;

const createFinalReportPrompt = ({ targetRole, difficulty, type, questionsAndAnswers = [] }) => {
  const formattedQAs = questionsAndAnswers
    .map((qa, i) => {
      return `[Question ${i + 1} (${qa.category} - ${qa.difficulty})]: ${qa.question}
Candidate Answer: "${qa.userAnswer}"
Evaluation: Overall ${qa.overallScore}/100 | Tech Accuracy ${qa.technicalAccuracy}/100
Strengths: ${qa.strengths?.join(', ')}
Weaknesses: ${qa.weaknesses?.join(', ')}
Missing: ${qa.missingConcepts?.join(', ')}`;
    })
    .join('\n\n');

  return `Synthesize the following completed mock interview session for role "${targetRole}" (${type}, ${difficulty}):

${formattedQAs}

Return ONLY a JSON object matching this schema:
{
  "overallScore": <Weighted average score 0-100>,
  "rating": "<Outstanding | Ready for Hire | Competent with Gaps | Needs Technical Preparation>",
  "summary": "<Comprehensive 3-sentence executive summary of candidate readiness>",
  "strengths": ["<Major overarching technical/behavioral strength 1>", "<Strength 2>", "<Strength 3>"],
  "weaknesses": ["<Major recurring gap or weakness 1>", "<Weakness 2>"],
  "missingConcepts": ["<Key technology concept 1>", "<Concept 2>"],
  "recommendations": ["<Actionable preparation step 1>", "<Step 2>", "<Step 3>"],
  "categoryScores": {
    "Technical Accuracy": <0-100>,
    "Completeness": <0-100>,
    "Problem Solving": <0-100>,
    "Communication": <0-100>,
    "Clarity": <0-100>
  }
}`;
};

module.exports = {
  ANSWER_EVALUATION_SYSTEM_PROMPT,
  createAnswerEvaluationPrompt,
  FINAL_REPORT_SYSTEM_PROMPT,
  createFinalReportPrompt,
};
