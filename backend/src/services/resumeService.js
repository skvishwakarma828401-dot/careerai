const pdfParseModule = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

/**
 * Extract textual content from a PDF buffer
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const extractFromPDF = async (buffer) => {
  try {
    // Check if pdfParseModule is a function (v1.x)
    if (typeof pdfParseModule === 'function') {
      const data = await pdfParseModule(buffer);
      return data.text || '';
    }
    
    // Check if PDFParse class is available (v2.x)
    const PDFParseClass = pdfParseModule.PDFParse || (pdfParseModule.default && pdfParseModule.default.PDFParse);
    if (PDFParseClass) {
      const parser = new PDFParseClass({ data: buffer });
      await parser.load();
      const result = await parser.getText();
      let text = '';
      if (typeof result === 'string') {
        text = result;
      } else if (result && typeof result.text === 'string') {
        text = result.text;
      } else if (result && Array.isArray(result.pages)) {
        text = result.pages.map((p) => p.text || '').join('\n');
      }
      
      if (typeof parser.destroy === 'function') {
        try {
          await parser.destroy();
        } catch (e) {}
      }
      return text;
    }

    throw new Error('PDF extraction engine could not be initialized.');
  } catch (error) {
    logger.error(`PDF extraction error: ${error.message}`);
    throw new Error('Failed to parse PDF document. The file may be corrupt or encrypted.');
  }
};

/**
 * Extract raw text from a DOCX buffer
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const extractFromDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    logger.error(`DOCX extraction error: ${error.message}`);
    throw new Error('Failed to parse DOCX document. The file may be corrupt or improperly formatted.');
  }
};

/**
 * Main extractor routing based on file type
 * @param {Buffer} buffer 
 * @param {string} fileType - 'pdf' | 'docx'
 * @returns {Promise<string>}
 */
const extractResumeText = async (buffer, fileType) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is empty (0 bytes).');
  }

  let extractedText = '';

  if (fileType === 'pdf') {
    extractedText = await extractFromPDF(buffer);
  } else if (fileType === 'docx') {
    extractedText = await extractFromDOCX(buffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Clean and normalize text (remove page footer markers if any, normalize whitespace)
  const sanitized = extractedText
    .replace(/-- \d+ of \d+ --/g, '') // strip page numbers
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (!sanitized || sanitized.length === 0) {
    throw new Error(
      'No readable text could be extracted from this document. Please ensure it is not an image-only scan or password-protected.'
    );
  }

  return sanitized;
};

module.exports = {
  extractResumeText,
  extractFromPDF,
  extractFromDOCX,
};
