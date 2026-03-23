import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { AgentMessage } from '../models/agent-message.model';

export interface DeepSeekResponse {
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class DeepSeekService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  giveMedicationAiOverview(id: number): Observable<DeepSeekResponse> {
    return this.http.get<DeepSeekResponse>(`${this.apiBaseUrl}/pharmacy/ai/medications/${id}/overview`);
  }

  validateMedication(id: number): Observable<AgentMessage> {
    return this.http.post<AgentMessage>(`${this.apiBaseUrl}/pharmacy/ai/medications/${id}/validate`, {});
  }

  autoModifyMedication(id: number): Observable<DeepSeekResponse> {
    return this.http.post<DeepSeekResponse>(`${this.apiBaseUrl}/pharmacy/ai/medications/${id}/auto-modify`, {});
  }

  autoDeleteMedication(id: number): Observable<DeepSeekResponse> {
    return this.http.post<DeepSeekResponse>(`${this.apiBaseUrl}/pharmacy/ai/medications/${id}/auto-delete`, {});
  }

  autoSuggestAndAddMedication(context: string = ''): Observable<DeepSeekResponse> {
    return this.http.post<DeepSeekResponse>(`${this.apiBaseUrl}/pharmacy/ai/medications/auto-suggest-add`, null, {
      params: { context }
    });
  }
}
