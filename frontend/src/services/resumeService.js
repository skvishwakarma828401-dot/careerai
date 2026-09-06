import api from './api';

/**
 * Upload a PDF or DOCX resume file synchronously
 * @param {File} file 
 * @param {Function} onUploadProgress 
 */
export const uploadResumeFile = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await api.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
  });

  return response;
};

/**
 * Upload a resume file for asynchronous background job processing (non-blocking)
 * @param {File} file
 * @param {Function} onUploadProgress
 */
export const uploadResumeFileAsync = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await api.post('/resumes/upload?async=true', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

/**
 * Fetch all resumes for the authenticated user
 */
export const fetchResumes = async () => {
  const response = await api.get('/resumes');
  return response.data || [];
};

/**
 * Fetch single resume by ID including full extracted text & analysis
 * @param {string} id 
 */
export const fetchResumeDetails = async (id) => {
  const response = await api.get(`/resumes/${id}`);
  return response.data;
};

/**
 * Trigger AI Resume Analysis for a resume by ID
 * @param {string} id 
 */
export const analyzeResume = async (id) => {
  const response = await api.post(`/resumes/${id}/analyze`);
  return response.data;
};

/**
 * Trigger background AI Resume Analysis (async non-blocking job)
 * @param {string} id
 */
export const analyzeResumeAsync = async (id) => {
  const response = await api.post(`/resumes/${id}/analyze?async=true`);
  return response.data;
};

/**
 * Delete a resume by ID
 * @param {string} id 
 */
export const removeResume = async (id) => {
  const response = await api.delete(`/resumes/${id}`);
  return response.data;
};
