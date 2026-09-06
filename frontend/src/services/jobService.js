import api from './api';

/**
 * Create a new job description entry
 * @param {Object} jobData - title, company, description, autoAnalyze
 */
export const createJob = async (jobData) => {
  const response = await api.post('/jobs', jobData);
  return response;
};

/**
 * Fetch all job descriptions for authenticated user
 */
export const fetchJobs = async () => {
  const response = await api.get('/jobs');
  return response.data || [];
};

/**
 * Fetch single job description by ID including full text & AI analysis
 * @param {string} id 
 */
export const fetchJobDetails = async (id) => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

/**
 * Trigger AI Job Description Analysis
 * @param {string} id 
 */
export const analyzeJob = async (id) => {
  const response = await api.post(`/jobs/${id}/analyze`);
  return response.data;
};

/**
 * Delete a job description by ID
 * @param {string} id 
 */
export const removeJob = async (id) => {
  const response = await api.delete(`/jobs/${id}`);
  return response;
};

/**
 * Perform hybrid semantic matching between a job and a resume
 * @param {string} jobId 
 * @param {string} resumeId 
 */
export const matchResumeToJob = async (jobId, resumeId) => {
  const response = await api.post(`/jobs/${jobId}/match-resume/${resumeId}`);
  return response.data;
};
