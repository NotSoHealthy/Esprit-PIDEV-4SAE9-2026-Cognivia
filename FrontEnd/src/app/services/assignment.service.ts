import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TestAssignment } from '../models/test-assignment.model';
import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class TestAssignmentService {
    private apiUrl = `${API_BASE_URL}/assignments`;

    constructor(private http: HttpClient) { }

    assignTest(testId: number, assignment: TestAssignment): Observable<TestAssignment> {
        return this.http.post<TestAssignment>(`${this.apiUrl}/test/${testId}`, assignment);
    }

    getAssignmentById(id: number): Observable<TestAssignment> {
        return this.http.get<TestAssignment>(`${this.apiUrl}/${id}`);
    }
}
