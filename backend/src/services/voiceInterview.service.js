const { evaluateAnswer } = require('./interviewEvaluator.service');
const logger = require('../utils/logger');

const FILLER_WORDS_LIST = [
  'um',
  'uh',
  'like',
  'you know',
  'basically',
  'actually',
  'sort of',
  'kind of',
  'i mean',
  'so yeah',
  'right',
];

/**
 * Analyze communication delivery signals from candidate's spoken transcript
 * @param {string} transcript
 * @param {number} [durationSeconds]
 * @returns {Object} Communication delivery metrics
 */
const analyzeCommunicationSignals = (transcript = '', durationSeconds = 0) => {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Calculate Pacing (Words Per Minute)
  const effectiveSeconds = durationSeconds > 0 ? durationSeconds : Math.max(10, Math.round(wordCount / 2.3));
  const wordsPerMinute = Math.round((wordCount / (effectiveSeconds / 60))) || 130;

  let pacingAssessment = 'Optimal';
  if (wordsPerMinute > 165) pacingAssessment = 'Fast Paced';
  else if (wordsPerMinute < 105) pacingAssessment = 'Deliberate / Slow Paced';

  // 2. Identify Filler Word Signals
  const lowerTranscript = transcript.toLowerCase();
  let fillerCount = 0;
  const detectedFillers = [];

  FILLER_WORDS_LIST.forEach((filler) => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerTranscript.match(regex);
    if (matches) {
      fillerCount += matches.length;
      detectedFillers.push({ word: filler, count: matches.length });
    }
  });

  const fillerPercentage = wordCount > 0 ? Math.round((fillerCount / wordCount) * 100) : 0;

  // 3. Communication Delivery Score (0-100)
  let communicationScore = 80;
  if (pacingAssessment === 'Optimal') communicationScore += 8;
  if (fillerPercentage <= 3) communicationScore += 8;
  else if (fillerPercentage > 8) communicationScore -= 12;

  communicationScore = Math.min(98, Math.max(45, communicationScore));

  return {
    wordCount,
    durationSeconds: effectiveSeconds,
    wordsPerMinute,
    pacingAssessment,
    fillerCount,
    fillerPercentage,
    detectedFillers,
    communicationScore,
    notice: 'Voice analysis focuses exclusively on communication delivery (pacing, clarity, filler frequency) to assist in professional interview practice.',
  };
};

/**
 * Process a voice-submitted answer
 * @param {Object} params
 * @param {string} params.question
 * @param {string} params.category
 * @param {string} params.difficulty
 * @param {string} params.transcript
 * @param {number} [params.durationSeconds]
 * @param {Array<string>} [params.expectedKeywords]
 */
const processVoiceAnswer = async ({
  question,
  category,
  difficulty,
  transcript,
  durationSeconds = 0,
  expectedKeywords = [],
}) => {
  logger.info(`Processing voice answer (${transcript.length} chars) for category "${category}"`);

  // 1. Analyze communication delivery signals
  const communicationSignals = analyzeCommunicationSignals(transcript, durationSeconds);

  // 2. Evaluate technical content with LLM/Zod engine
  const technicalEval = await evaluateAnswer({
    question,
    category,
    difficulty,
    userAnswer: transcript,
    expectedKeywords,
  });

  // 3. Synthesize blended evaluation including communication delivery notes
  let voiceCoachingNote = '';
  if (communicationSignals.fillerCount > 3) {
    voiceCoachingNote += `Noticeable use of filler words (${communicationSignals.fillerCount} detected). Practice replacing fillers with brief silent pauses to project executive authority. `;
  }
  if (communicationSignals.pacingAssessment === 'Fast Paced') {
    voiceCoachingNote += `Speaking pace was ${communicationSignals.wordsPerMinute} WPM. Moderating your speed will allow interviewers to absorb complex architecture details. `;
  } else if (communicationSignals.pacingAssessment === 'Optimal') {
    voiceCoachingNote += `Excellent conversational pacing at ${communicationSignals.wordsPerMinute} WPM. `;
  }

  const enhancedFeedback = `${technicalEval.feedback} ${voiceCoachingNote}`.trim();

  return {
    ...technicalEval,
    communication: Math.round((technicalEval.communication + communicationSignals.communicationScore) / 2),
    feedback: enhancedFeedback,
    voiceSignals: communicationSignals,
  };
};

module.exports = {
  analyzeCommunicationSignals,
  processVoiceAnswer,
};
