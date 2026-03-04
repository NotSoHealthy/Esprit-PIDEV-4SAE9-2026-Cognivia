import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../../models/care/patient.model';
import { API_BASE_URL } from '../../api/api.tokens';

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = inject(API_BASE_URL);
    private readonly apiUrl = `${this.apiBaseUrl}/care/patient`;

    getAllPatients(): Observable<Patient[]> {
        return this.http.get<Patient[]>(this.apiUrl);
    }

    getPatientById(id: number): Observable<Patient> {
        return this.http.get<Patient>(`${this.apiUrl}/${id}`);
    }

    getPatientByUserId(userId: string): Observable<Patient> {
        return this.http.get<Patient>(`${this.apiUrl}/user/${userId}`);
    }

    getPatientsByCaregiverUserId(userId: string): Observable<Patient[]> {
        return this.http.get<Patient[]>(`${this.apiUrl}/caregiver/user/${userId}`);
    }
}
