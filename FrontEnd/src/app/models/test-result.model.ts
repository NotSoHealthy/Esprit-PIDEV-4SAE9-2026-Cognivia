import { TestAnswer } from './test-answer.model';

export interface TestResult {
    id?: number;
    takenAt?: string | Date;
    responseTime?: number;
    score?: number;
    answers: TestAnswer[];
}
