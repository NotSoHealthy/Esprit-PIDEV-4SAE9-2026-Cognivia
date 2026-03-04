import { TestQuestion } from './test-question.model';

export interface CognitiveTest {
    id?: number;
    title: string;
    description: string;
    createdAt?: string | Date;
    questions: TestQuestion[];
}
