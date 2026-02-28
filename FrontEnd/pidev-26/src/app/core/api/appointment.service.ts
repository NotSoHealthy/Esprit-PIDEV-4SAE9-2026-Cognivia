import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, AppointmentStatus } from './models/appointment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
    private readonly http = inject(HttpClient);

    // Dev: /api (proxy -> 8085) | Prod: http://.../api
    private readonly baseUrl = `${environment.apiBaseUrl}/appointments/appointments`;

    getAll(filters?: {
        patientId?: number;
        doctorId?: number;
        caregiverId?: number;
        status?: AppointmentStatus;
    }): Observable<Appointment[]> {
        let params = new HttpParams();

        // IMPORTANT: HttpParams veut des strings
        if (filters?.patientId != null) params = params.set('patientId', String(filters.patientId));
        if (filters?.doctorId != null) params = params.set('doctorId', String(filters.doctorId));
        if (filters?.caregiverId != null) params = params.set('caregiverId', String(filters.caregiverId));
        if (filters?.status) params = params.set('status', String(filters.status));

        return this.http.get<Appointment[]>(this.baseUrl, { params });
    }

    getById(id: number): Observable<Appointment> {
        return this.http.get<Appointment>(`${this.baseUrl}/appointments/${id}`);
    }

    create(body: Appointment): Observable<Appointment> {
        return this.http.post<Appointment>(this.baseUrl, body);
    }

    update(id: number, body: Appointment): Observable<Appointment> {
        return this.http.put<Appointment>(`${this.baseUrl}/appointments/${id}`, body);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/appointments/${id}`);
    }
}