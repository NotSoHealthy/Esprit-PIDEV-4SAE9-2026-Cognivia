import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CognitiveTest } from '../models/cognitive-test.model';
import { TestQuestion } from '../models/test-question.model';
import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class CognitiveTestService {
    private apiUrl = `${API_BASE_URL}/tests`;

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
}
