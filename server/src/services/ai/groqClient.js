// Thin wrapper around Groq's OpenAI-compatible chat completions API. Uses the
// platform's built-in fetch (Node 18+) rather than pulling in an SDK — this is
// the only thing every AI feature in this app needs from Groq.
const { ApiError } = require('../../utils/errors');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-20b';

class AiUnavailableError extends ApiError {
  constructor(message = 'The AI assistant is not configured on this server.') {
    super(503, message);
  }
}

class AiRequestError extends ApiError {
  constructor(message) {
    super(502, message);
  }
}

// Returns the full assistant message (content + tool_calls, when the caller
// passes `tools`) — needed by the chatbot's function-calling loop.
async function chatMessage({ messages, jsonMode = false, temperature = 0.3, maxTokens = 1024, tools, toolChoice }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new AiUnavailableError();

  let res;
  try {
    res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        ...(tools ? { tools, tool_choice: toolChoice || 'auto' } : {}),
      }),
    });
  } catch (err) {
    throw new AiRequestError('Could not reach the AI provider. Please try again.');
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AiRequestError(`AI provider error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  if (!message) throw new AiRequestError('The AI provider returned an empty response.');
  return message;
}

// Convenience wrapper for callers that only care about the plain text reply.
async function chatCompletion(opts) {
  const message = await chatMessage(opts);
  if (!message.content) throw new AiRequestError('The AI provider returned an empty response.');
  return message.content;
}

module.exports = { chatCompletion, chatMessage, AiUnavailableError, AiRequestError };
