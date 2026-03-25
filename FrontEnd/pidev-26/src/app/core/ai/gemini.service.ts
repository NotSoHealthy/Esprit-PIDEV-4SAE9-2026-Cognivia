import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { GEMINI_API_KEY, GEMINI_MODEL } from './gemini.tokens';

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly http = inject(HttpClient);
  private readonly apiKey = inject(GEMINI_API_KEY);
  private readonly defaultModel = inject(GEMINI_MODEL);

  /**
   * Lightweight text generation wrapper.
   *
   * Note: keep this generic since it will be reused for multiple features.
   */
  async generateText(
    prompt: string,
    options?: {
      model?: string;
      systemInstruction?: string;
      temperature?: number;
      maxOutputTokens?: number;
    },
  ): Promise<string> {
    if (!this.apiKey || !String(this.apiKey).trim()) {
      throw new Error('Gemini API key is not configured. Set window.__env.geminiApiKey (env.js) or environment.geminiApiKey.');
    }

    const model = options?.model || this.defaultModel;

    // Gemini API (AI Studio) endpoint.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent`;

    const params = new HttpParams().set('key', this.apiKey);

    const body: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: String(prompt ?? '') }],
        },
      ],
    };

    if (options?.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: String(options.systemInstruction) }],
      };
    }

    if (options?.temperature !== undefined || options?.maxOutputTokens !== undefined) {
      body.generationConfig = {
        ...(options?.temperature !== undefined ? { temperature: options.temperature } : null),
        ...(options?.maxOutputTokens !== undefined
          ? { maxOutputTokens: options.maxOutputTokens }
          : null),
      };
    }

    const res = await firstValueFrom(
      this.http.post<GeminiGenerateContentResponse>(url, body, {
        params,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const text =
      res?.candidates?.[0]?.content?.parts
        ?.map((p) => p?.text)
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .join('') ?? '';

    return text.trim();
  }
}
