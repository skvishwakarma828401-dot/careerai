import api from './api';

/**
 * Query the AI Career Assistant using grounded RAG
 * @param {Object} params
 * @param {string} params.question
 * @param {string} [params.sourceType='all']
 */
export const queryRAG = async ({ question, sourceType = 'all' }) => {
  const response = await api.post('/ai/rag/query', {
    question,
    sourceType,
  });
  return response.data;
};
