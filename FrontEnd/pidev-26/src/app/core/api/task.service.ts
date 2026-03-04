import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from './api.tokens';
import { Task, TaskSubmission } from './models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private apiBase = inject(API_BASE_URL);

  private url(path = ''): string {
    // Gateway routes care service under /care/** so call via gateway: /care/api/tasks
    return `${this.apiBase}/care/tasks${path}`;
  }

  getPatients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/care/patient`).pipe(catchError((err) => throwError(() => err)));
  }

  getPatientByUserId(keycloakUserId: string): Observable<{ id: number }> {
    return this.http.get<{ id: number }>(`${this.apiBase}/care/patient/user/${keycloakUserId}`).pipe(catchError((err) => throwError(() => err)));
  }

  getCaregiverByUserId(keycloakUserId: string): Observable<{ id: number }> {
    return this.http.get<{ id: number }>(`${this.apiBase}/care/caregiver/user/${keycloakUserId}`).pipe(catchError((err) => throwError(() => err)));
  }

  getDoctorByUserId(keycloakUserId: string): Observable<{ id: number }> {
    return this.http.get<{ id: number }>(`${this.apiBase}/care/doctor/user/${keycloakUserId}`).pipe(catchError((err) => throwError(() => err)));
  }

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.url()).pipe(catchError((err) => throwError(() => err)));
  }

  getById(id: number): Observable<Task> {
    return this.http.get<Task>(this.url(`/${id}`)).pipe(catchError((err) => throwError(() => err)));
  }

  getByPatient(patientId: number): Observable<Task[]> {
    return this.http.get<Task[]>(this.url(`/patient/${patientId}`)).pipe(catchError((err) => throwError(() => err)));
  }

  getByUser(userId: number): Observable<Task[]> {
    return this.http.get<Task[]>(this.url(`/user/${userId}`)).pipe(catchError((err) => throwError(() => err)));
  }

  create(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.url(), task).pipe(catchError((err) => throwError(() => err)));
  }

  update(id: number, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(this.url(`/${id}`), task).pipe(catchError((err) => throwError(() => err)));
  }

  markDone(id: number, isDone: boolean) {
    return this.http.put<Task>(this.url(`/${id}/done`), { isDone }).pipe(catchError((err) => throwError(() => err)));
  }

  delete(id: number) {
    return this.http.delete<void>(this.url(`/${id}`)).pipe(catchError((err) => throwError(() => err)));
  }

  // Task Submission Methods
  submitTask(taskId: number, submission: Partial<TaskSubmission>): Observable<TaskSubmission> {
    return this.http.post<TaskSubmission>(this.url(`/${taskId}/submissions`), submission).pipe(catchError((err) => throwError(() => err)));
  }

  getSubmissions(taskId: number): Observable<TaskSubmission[]> {
    return this.http.get<TaskSubmission[]>(this.url(`/${taskId}/submissions`)).pipe(catchError((err) => throwError(() => err)));
  }

  validateSubmission(taskId: number, submissionId: number, validation: any, caregiverId?: number): Observable<TaskSubmission> {
    let url = this.url(`/${taskId}/submissions/${submissionId}/validate`);
    if (caregiverId) {
      url += `?caregiverId=${caregiverId}`;
    }
    return this.http.put<TaskSubmission>(url, validation).pipe(catchError((err) => throwError(() => err)));
  }

  deleteSubmission(taskId: number, submissionId: number): Observable<void> {
    return this.http.delete<void>(this.url(`/${taskId}/submissions/${submissionId}`)).pipe(catchError((err) => throwError(() => err)));
  }
}
