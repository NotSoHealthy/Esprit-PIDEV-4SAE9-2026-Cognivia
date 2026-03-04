export const environment = {
  production: true,
  // TODO: replace with your production API gateway base URL
  apiBaseUrl: 'http://localhost:8080',
  // TODO: set your imgbb API key (https://api.imgbb.com/)
  imgbbApiKey: '48b3c0f581ef211437b70e58b1df3e97',
  // Gemini API key (Google AI Studio). Do not commit real secrets.
  geminiApiKey: 'AIzaSyBvTB9sY_nX6kBEelm06NqIEaKGksLwlBs',
  // Default model used by GeminiService.
  geminiModel: 'gemini-2.5-flash',
};
