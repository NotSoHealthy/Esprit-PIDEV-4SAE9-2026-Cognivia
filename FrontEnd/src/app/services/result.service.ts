import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TestResult } from '../models/test-result.model';
import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class TestResultService {
    private apiUrl = `${API_BASE_URL}/results`;

    constructor(private http: HttpClient) { }

    submitResult(assignmentId: number, result: TestResult): Observable<TestResult> {
        return this.http.post<TestResult>(`${this.apiUrl}/assignment/${assignmentId}`, result);
    }

    submitDirectResult(testId: number, result: TestResult): Observable<TestResult> {
        return this.http.post<TestResult>(`${this.apiUrl}/test/${testId}`, result);
    }
}
