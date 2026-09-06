import api from './api';

/**
 * Generate a new AI mock interview session
 */
export const generateInterview = async (interviewParams) => {
  const response = await api.post('/interviews', interviewParams);
  return response.data;
};

/**
 * Fetch all interview sessions for authenticated user
 */
export const fetchInterviews = async () => {
  const response = await api.get('/interviews');
  return response.data || [];
};

/**
 * Fetch single interview session by ID including questions
 */
export const fetchInterviewDetails = async (id) => {
  const response = await api.get(`/interviews/${id}`);
  return response.data;
};

/**
 * Start an interview session
 */
export const startInterview = async (id) => {
  const response = await api.post(`/interviews/${id}/start`);
  return response.data;
};

/**
 * Submit candidate answer and get real-time AI evaluation
 */
export const submitAnswer = async (id, { questionId, userAnswer }) => {
  const response = await api.post(`/interviews/${id}/answer`, {
    questionId,
    userAnswer,
  });
  return response.data;
};

/**
 * Get next question in session
 */
export const getNextQuestion = async (id) => {
  const response = await api.post(`/interviews/${id}/next-question`);
  return response.data;
};

/**
 * Complete interview session
 */
export const completeInterview = async (id) => {
  const response = await api.post(`/interviews/${id}/complete`);
  return response.data;
};

/**
 * Get comprehensive performance report
 */
export const fetchInterviewReport = async (id) => {
  const response = await api.get(`/interviews/${id}/report`);
  return response.data;
};
