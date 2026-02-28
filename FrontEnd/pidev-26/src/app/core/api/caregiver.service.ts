import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PersonLite } from './models/person-lite.model';
import { API_BASE_URL } from './api.tokens';

@Injectable({ providedIn: 'root' })
export class CaregiverApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    getAll(): Observable<PersonLite[]> {
        return this.http.get<PersonLite[]>(`${this.baseUrl}/care/caregiver`);
    }
}
