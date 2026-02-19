import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from '../models/task';

@Injectable({ providedIn: 'root' })
export class TaskService {

  private base = 'http://localhost:8082/api/tasks';

  constructor(private http: HttpClient) {}

  create(task: Task): Observable<Task> {
    return this.http.post<Task>(this.base, task);
  }

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.base);
  }

  markDone(id: number, isDone: boolean): Observable<Task> {
    return this.http.put<Task>(`${this.base}/${id}/done`, { isDone });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
