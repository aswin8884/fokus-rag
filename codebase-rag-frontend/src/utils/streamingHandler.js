/**
 * Streaming Response Handler Utilities
 * Handles Server-Sent Events (SSE) and Newline-Delimited JSON streaming
 * from the Fokus RAG backend for real-time chat responses
 */

/**
 * Parse streaming response from backend
 * Backend sends newline-delimited JSON with types: "chunk", "complete", "error"
 *
 * @param {ReadableStreamDefaultReader} reader - Stream reader from fetch response
 * @param {Function} onChunk - Callback for each character chunk {type, content, timestamp}
 * @param {Function} onComplete - Callback when stream completes {sources, full_answer}
 * @param {Function} onError - Callback on error {content, error}
 */
export const handleStreamingResponse = async (
  reader,
  onChunk,
  onComplete,
  onError,
) => {
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer);
            processStreamEvent(json, onChunk, onComplete, onError);
          } catch (e) {
            console.warn("Final buffer parse error:", e);
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Process complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        try {
          if (lines[i].trim()) {
            const json = JSON.parse(lines[i]);
            processStreamEvent(json, onChunk, onComplete, onError);
          }
        } catch (e) {
          console.error("Parse error on line:", lines[i], e);
        }
      }

      // Keep incomplete line in buffer
      buffer = lines[lines.length - 1];
    }
  } catch (error) {
    console.error("Stream reading error:", error);
    onError({
      content: "Stream reading error",
      error: error.message,
    });
  }
};

/**
 * Process individual streaming event
 * @param {Object} json - Parsed JSON event
 * @param {Function} onChunk - Chunk callback
 * @param {Function} onComplete - Complete callback
 * @param {Function} onError - Error callback
 */
const processStreamEvent = (json, onChunk, onComplete, onError) => {
  if (json.type === "chunk") {
    onChunk(json);
  } else if (json.type === "complete") {
    onComplete(json);
  } else if (json.type === "error") {
    onError(json);
  }
};

/**
 * Format streamed content with markdown/syntax highlighting
 * This will be extended in future for markdown support
 *
 * @param {string} content - Raw content from stream
 * @returns {string} Formatted content
 */
export const formatStreamedContent = (content) => {
  // TODO: Add markdown parsing here in future
  // For now, return as-is
  return content;
};

/**
 * Create a stream abort controller for cancelling long-running streams
 *
 * @returns {Object} {controller, signal}
 */
export const createStreamController = () => {
  const controller = new AbortController();
  const signal = controller.signal;

  return {
    controller,
    signal,
    abort: () => controller.abort(),
  };
};

/**
 * Utility to track streaming progress
 *
 * @param {number} characterCount - Total characters received
 * @param {number} startTime - Stream start timestamp
 * @returns {Object} Progress metrics
 */
export const getStreamProgress = (characterCount, startTime) => {
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const charsPerSecond = characterCount / elapsed;

  return {
    characterCount,
    elapsed,
    charsPerSecond,
    estimatedWordsPerMinute: (charsPerSecond / 5) * 60, // avg 5 chars per word
  };
};

/**
 * Buffer streaming chunks for batch processing (optional optimization)
 * Useful to reduce re-renders
 *
 * @param {Function} onBatch - Callback with accumulated chunks
 * @param {number} bufferSize - Number of chunks to buffer before callback
 * @returns {Function} Chunk handler function
 */
export const createChunkBuffer = (onBatch, bufferSize = 5) => {
  let buffer = [];

  return (chunk) => {
    buffer.push(chunk);

    if (buffer.length >= bufferSize) {
      const accumulated = buffer.map((c) => c.content).join("");
      onBatch(accumulated);
      buffer = [];
    }
  };
};
