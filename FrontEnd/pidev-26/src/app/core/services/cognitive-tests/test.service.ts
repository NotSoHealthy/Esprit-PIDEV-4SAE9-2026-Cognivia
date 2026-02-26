import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CognitiveTest } from '../../models/cognitive-tests/cognitive-test.model';
import { TestQuestion } from '../../models/cognitive-tests/test-question.model';
import { API_BASE_URL } from '../../constants/cognitive-tests/api.constants';

@Injectable({
    providedIn: 'root'
})
export class CognitiveTestService {
    private apiUrl = `${API_BASE_URL}/monitoring/tests`;

    constructor(private http: HttpClient) { }

    getAllTests(): Observable<CognitiveTest[]> {
        return this.http.get<CognitiveTest[]>(this.apiUrl);
    }

    getTestById(id: number): Observable<CognitiveTest> {
        return this.http.get<CognitiveTest>(`${this.apiUrl}/${id}`);
    }

    createTest(test: CognitiveTest): Observable<CognitiveTest> {
        return this.http.post<CognitiveTest>(this.apiUrl, test);
    }

    updateTest(id: number, test: CognitiveTest): Observable<CognitiveTest> {
        return this.http.put<CognitiveTest>(`${this.apiUrl}/${id}`, test);
    }

    addQuestionToTest(id: number, question: TestQuestion): Observable<CognitiveTest> {
        return this.http.post<CognitiveTest>(`${this.apiUrl}/${id}/questions`, question);
    }

    deleteTest(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    downloadMLData(): Observable<Blob> {
        return this.http.get(`${API_BASE_URL}/monitoring/export/ml-data`, {
            responseType: 'blob'
        });
    }
}
