export const environment = {
  production: false,
  // Backend / API gateway base URL for local dev
  apiBaseUrl: 'http://localhost:8080',

  // imgbb API key for local dev (https://api.imgbb.com/)
  imgbbApiKey: '',
  // Gemini API key (Google AI Studio). Do not commit real secrets.
  geminiApiKey: '',
  // Default model used by GeminiService.
  geminiModel: 'gemini-2.5-flash',
};
