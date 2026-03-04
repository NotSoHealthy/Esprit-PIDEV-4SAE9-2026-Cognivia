import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TestAssignment } from '../../models/cognitive-tests/test-assignment.model';
import { API_BASE_URL } from '../../constants/cognitive-tests/api.constants';

@Injectable({
    providedIn: 'root'
})
export class TestAssignmentService {
    private apiUrl = `${API_BASE_URL}/monitoring/assignments`;

    constructor(private http: HttpClient) { }

    /** Doctor: assign a test (TARGETED to a patient, or GENERAL by severity) */
    assignTest(testId: number, assignment: TestAssignment): Observable<TestAssignment> {
        return this.http.post<TestAssignment>(`${this.apiUrl}/test/${testId}`, assignment);
    }

    getAssignmentById(id: number): Observable<TestAssignment> {
        return this.http.get<TestAssignment>(`${this.apiUrl}/${id}`);
    }

    /** Doctor: get all assignments */
    getAllAssignments(): Observable<TestAssignment[]> {
        return this.http.get<TestAssignment[]>(this.apiUrl);
    }

    /**
     * Patient: fetch all assignments visible to them.
     * The backend resolves severity from the care service internally.
     */
    getAssignmentsForPatient(patientId: number): Observable<TestAssignment[]> {
        return this.http.get<TestAssignment[]>(`${this.apiUrl}/for-patient/${patientId}`);
    }
}
