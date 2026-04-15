import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appointment, AppointmentStatus } from './models/appointment.model';
import { environment } from '../../../environments/environment';
import { Doctor, Patient } from './models/doctor.model';

@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
    private readonly http = inject(HttpClient);

    // Use API Gateway base URL from environment so all calls go through gateway (port 8080).
    // The controller is mapped at '/appointments' so the service base is '/appointments'.
    private readonly baseUrl = `${environment.apiBaseUrl}/appointments/appointments`;
    private readonly careBaseUrl = `${environment.apiBaseUrl}/care`;

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
        return this.http.get<Appointment>(`${this.baseUrl}/${id}`);
    }

    create(body: Appointment): Observable<Appointment> {
        return this.http.post<Appointment>(this.baseUrl, body);
    }

    update(id: number, body: Appointment): Observable<Appointment> {
        return this.http.put<Appointment>(`${this.baseUrl}/${id}`, body);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    getAppointmentsByDoctor(doctorId: number): Observable<Appointment[]> {
        const params = new HttpParams().set('doctorId', String(doctorId));
        return this.http.get<Appointment[]>(this.baseUrl, { params });
    }

    updateStatus(id: number, status: string): Observable<Appointment> {
        return this.http.patch<Appointment>(`${this.baseUrl}/${id}/status`, { status });
    }

    deleteAppointment(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    createAppointment(data: Partial<Appointment>): Observable<Appointment> {
        return this.http.post<Appointment>(this.baseUrl, data);
    }

    updateAppointment(id: number, data: Partial<Appointment>): Observable<Appointment> {
        return this.http.put<Appointment>(`${this.baseUrl}/${id}`, data);
    }

    getDoctors(): Observable<Doctor[]> {
        return this.http.get<Doctor[]>(`${this.careBaseUrl}/doctor`).pipe(
            map((rows) =>
                (rows ?? []).map((d: any) => ({
                    id: d.id,
                    firstName: String(d.firstName ?? ''),
                    lastName: String(d.lastName ?? ''),
                    speciality: String(d.speciality ?? d.specialty ?? ''),
                })),
            ),
        );
    }

    getPatients(): Observable<Patient[]> {
        return this.http.get<Patient[]>(`${this.careBaseUrl}/patient`).pipe(
            map((rows) =>
                (rows ?? []).map((p: any) => ({
                    id: p.id,
                    firstName: p.firstName,
                    lastName: p.lastName,
                })),
            ),
        );
    }
}
