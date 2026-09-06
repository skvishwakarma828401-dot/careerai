import api from './api';

/**
 * Fetch background job status
 * @param {string} jobId
 * @returns {Promise<Object>}
 */
export const fetchJobStatus = async (jobId) => {
  const res = await api.get(`/jobs/status/${jobId}`);
  return res.data;
};

/**
 * Poll background job status until completed or failed
 * @param {string} jobId
 * @param {Function} [onProgress] - Callback with job status object
 * @param {number} [intervalMs=1000]
 * @param {number} [maxAttempts=60]
 * @returns {Promise<Object>} Final completed job result
 */
export const pollJobUntilComplete = (jobId, onProgress, intervalMs = 1000, maxAttempts = 60) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetchJobStatus(jobId);
        const job = response.data;

        if (onProgress) {
          onProgress(job);
        }

        if (job.status === 'completed') {
          clearInterval(interval);
          resolve(job);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          reject(new Error(job.error || 'Background processing failed.'));
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Background job timed out. Please try again.'));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, intervalMs);
  });
};
