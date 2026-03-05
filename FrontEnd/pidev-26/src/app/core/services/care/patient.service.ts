import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../../models/care/patient.model';
import { API_BASE_URL } from '../../api/api.tokens';

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    private apiBaseUrl = inject(API_BASE_URL);
    private apiUrl = `${this.apiBaseUrl}/care/patient`;

    constructor(private http: HttpClient) { }

    getAllPatients(): Observable<Patient[]> {
        return this.http.get<Patient[]>(this.apiUrl);
    }

    getPatientById(id: number): Observable<Patient> {
        return this.http.get<Patient>(`${this.apiUrl}/${id}`);
    }

    getPatientByUserId(userId: string): Observable<Patient> {
        return this.http.get<Patient>(`${this.apiUrl}/user/${userId}`);
    }
}
