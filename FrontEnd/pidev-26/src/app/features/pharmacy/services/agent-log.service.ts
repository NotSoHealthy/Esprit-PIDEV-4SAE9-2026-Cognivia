import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { AgentLog } from '../models/agent-log.model';
import { MedicationModel } from '../models/medication.model';

@Injectable({ providedIn: 'root' })
export class AgentLogService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getAllLogs(): Observable<AgentLog[]> {
    return this.http.get<AgentLog[]>(`${this.apiBaseUrl}/pharmacy/agent-logs`);
  }

  undoAction(logId: number): Observable<MedicationModel> {
    return this.http.post<MedicationModel>(
      `${this.apiBaseUrl}/pharmacy/agent-logs/${logId}/undo`,
      {}
    );
  }

  deleteLog(logId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/pharmacy/agent-logs/${logId}`
    );
  }
}
