import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TestResult } from '../../models/cognitive-tests/test-result.model';
import { API_BASE_URL } from '../../constants/cognitive-tests/api.constants';

@Injectable({
    providedIn: 'root'
})
export class TestResultService {
    private apiUrl = `${API_BASE_URL}/monitoring/results`;

    constructor(private http: HttpClient) { }

    submitResult(assignmentId: number, result: TestResult): Observable<TestResult> {
        return this.http.post<TestResult>(`${this.apiUrl}/assignment/${assignmentId}`, result);
    }

    submitDirectResult(testId: number, result: TestResult): Observable<TestResult> {
        return this.http.post<TestResult>(`${this.apiUrl}/test/${testId}`, result);
    }

    getAllResults(): Observable<TestResult[]> {
        return this.http.get<TestResult[]>(this.apiUrl);
    }

    getResultById(id: number): Observable<TestResult> {
        return this.http.get<TestResult>(`${this.apiUrl}/${id}`);
    }

    downloadReport(patientId: number): Observable<Blob> {
        return this.http.get(`${API_BASE_URL}/monitoring/api/v1/reports/patient/${patientId}/generate`, {
            responseType: 'blob'
        });
    }
}
