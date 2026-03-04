// Copy this file to `env.js` and fill in values.
// This file is safe to commit; `env.js` should be gitignored.

// Note: Anything in the frontend is visible to users.
// Do NOT put real secrets here for production. Prefer a backend proxy.

window.__env = {
  // Backend API base URL
  apiBaseUrl: 'http://localhost:8080',

  // imgbb API key (used by the frontend uploader)
  imgbbApiKey: '',

  // Gemini API key (Google AI Studio)
  geminiApiKey: '',

  // Default Gemini model used by GeminiService
  geminiModel: 'gemini-2.5-flash',
};
