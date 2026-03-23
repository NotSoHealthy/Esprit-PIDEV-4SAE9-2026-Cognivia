import { InjectionToken } from '@angular/core';

export const GEMINI_API_KEY = new InjectionToken<string>('GEMINI_API_KEY');

// Keep the model configurable because the service will be reused for multiple features.
export const GEMINI_MODEL = new InjectionToken<string>('GEMINI_MODEL');
