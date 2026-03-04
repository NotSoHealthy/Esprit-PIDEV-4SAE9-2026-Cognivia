import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../../models/care/patient.model';
import { API_BASE_URL } from '../../constants/cognitive-tests/api.constants';

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    private apiUrl = `${API_BASE_URL}/care/patient`;

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
