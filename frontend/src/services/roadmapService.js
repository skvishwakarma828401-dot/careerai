import api from './api';

/**
 * Generate a personalized 4-Week learning roadmap
 * @param {Object} params
 * @param {string} [params.targetRole]
 * @param {string} [params.resumeId]
 * @param {string} [params.jobId]
 */
export const generateRoadmap = async ({ targetRole, resumeId, jobId } = {}) => {
  const response = await api.post('/roadmaps/generate', {
    targetRole,
    resumeId,
    jobId,
  });
  return response.data;
};

/**
 * Fetch all roadmaps for authenticated user
 */
export const fetchRoadmaps = async () => {
  const response = await api.get('/roadmaps');
  return response.data;
};

/**
 * Update completion progress for a specific topic
 * @param {string} roadmapId
 * @param {Object} params
 * @param {string} params.topicId
 * @param {boolean} [params.isCompleted=true]
 */
export const updateTopicProgress = async (roadmapId, { topicId, isCompleted = true }) => {
  const response = await api.patch(`/roadmaps/${roadmapId}/progress`, {
    topicId,
    isCompleted,
  });
  return response.data;
};
