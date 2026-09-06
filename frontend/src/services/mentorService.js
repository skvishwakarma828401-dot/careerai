import api from './api';

/**
 * Send message to AI Career Mentor with tool calling & memory
 * @param {Object} params
 * @param {string} params.message
 * @param {Array<Object>} [params.conversationHistory=[]]
 */
export const sendMentorMessage = async ({ message, conversationHistory = [] }) => {
  const response = await api.post('/mentor/chat', {
    message,
    conversationHistory,
  });
  return response.data;
};

/**
 * Fetch candidate's stored persistent career memories
 */
export const fetchMemories = async () => {
  const response = await api.get('/mentor/memories');
  return response.data || [];
};
