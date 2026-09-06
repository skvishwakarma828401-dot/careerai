/**
 * Recursively sanitize objects to prevent NoSQL query operator injection
 * Removes keys starting with '$' or containing '.'
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const cleanObj = {};
  for (const key of Object.keys(data)) {
    // Block NoSQL injection keys like $gt, $where, $ne
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    const value = data[key];
    if (typeof value === 'object' && value !== null) {
      cleanObj[key] = sanitizeData(value);
    } else if (typeof value === 'string') {
      cleanObj[key] = value;
    } else {
      cleanObj[key] = value;
    }
  }

  return cleanObj;
};

/**
 * Express middleware to sanitize body and query against NoSQL injection
 */
const sanitizationMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeData(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeData(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeData(req.params);
  }
  next();
};

module.exports = {
  sanitizeData,
  sanitizationMiddleware,
};
