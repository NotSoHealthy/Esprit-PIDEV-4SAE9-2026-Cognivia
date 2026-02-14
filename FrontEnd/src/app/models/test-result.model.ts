import { TestAnswer } from './test-answer.model';

export interface TestResult {
    id?: number;
    takenAt?: string | Date;
    responseTime?: number;
    score?: number;
    patientId?: number;
    answers: TestAnswer[] | any[];
}
