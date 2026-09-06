/**
 * Intelligent Text Chunking Service for Semantic Indexing
 */

/**
 * Split text into semantic overlapping chunks
 * @param {string} text - Raw input text
 * @param {Object} [options]
 * @param {number} [options.chunkSize=500] - Approximate target character length per chunk
 * @param {number} [options.overlap=100] - Character overlap between consecutive chunks
 * @returns {Array<{ chunkIndex: number, chunkText: string }>}
 */
const chunkText = (text, options = {}) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const { chunkSize = 500, overlap = 100 } = options;
  const cleanText = text.trim();

  if (cleanText.length === 0) {
    return [];
  }

  // If text is smaller than chunk size, return as a single chunk
  if (cleanText.length <= chunkSize) {
    return [{ chunkIndex: 0, chunkText: cleanText }];
  }

  // Split into paragraphs or sections first
  const paragraphs = cleanText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();

    if (!currentChunk) {
      currentChunk = para;
    } else if (currentChunk.length + para.length + 2 <= chunkSize) {
      currentChunk += '\n\n' + para;
    } else {
      // Current chunk is full, push it
      chunks.push({
        chunkIndex: chunkIndex++,
        chunkText: currentChunk.trim(),
      });

      // Calculate overlap from previous chunk
      const overlapStart = Math.max(0, currentChunk.length - overlap);
      const overlapText = currentChunk.substring(overlapStart).trim();

      currentChunk = overlapText ? overlapText + '\n\n' + para : para;
    }
  }

  // Push remainder
  if (currentChunk.trim().length > 0) {
    chunks.push({
      chunkIndex: chunkIndex++,
      chunkText: currentChunk.trim(),
    });
  }

  // If paragraphs were too huge, apply secondary sliding-window pass on chunks that exceed max length
  const finalizedChunks = [];
  let finalIndex = 0;

  for (const chunk of chunks) {
    if (chunk.chunkText.length <= chunkSize * 1.5) {
      finalizedChunks.push({
        chunkIndex: finalIndex++,
        chunkText: chunk.chunkText,
      });
    } else {
      // Split large single paragraph by sentences
      const sentences = chunk.chunkText.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [chunk.chunkText];
      let subChunk = '';

      for (const sent of sentences) {
        if (!subChunk) {
          subChunk = sent.trim();
        } else if (subChunk.length + sent.length <= chunkSize) {
          subChunk += ' ' + sent.trim();
        } else {
          finalizedChunks.push({
            chunkIndex: finalIndex++,
            chunkText: subChunk.trim(),
          });
          const overlapSub = subChunk.substring(Math.max(0, subChunk.length - overlap)).trim();
          subChunk = overlapSub ? overlapSub + ' ' + sent.trim() : sent.trim();
        }
      }

      if (subChunk.trim().length > 0) {
        finalizedChunks.push({
          chunkIndex: finalIndex++,
          chunkText: subChunk.trim(),
        });
      }
    }
  }

  return finalizedChunks;
};

module.exports = {
  chunkText,
};
