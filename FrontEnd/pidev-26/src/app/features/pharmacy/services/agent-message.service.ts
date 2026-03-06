import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { AgentMessage } from '../models/agent-message.model';

@Injectable({ providedIn: 'root' })
export class AgentMessageService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getMessageForMedication(medicationId: number): Observable<AgentMessage> {
    return this.http.get<AgentMessage>(`${this.apiBaseUrl}/pharmacy/agent-messages/medication/${medicationId}`);
  }

  getAllPendingMessages(): Observable<AgentMessage[]> {
    return this.http.get<AgentMessage[]>(`${this.apiBaseUrl}/pharmacy/agent-messages/pending`);
  }
}
