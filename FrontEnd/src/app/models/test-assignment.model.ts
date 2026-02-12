import { Frequency } from './frequency.enum';
import { TestResult } from './test-result.model';

export interface TestAssignment {
    id?: number;
    assignedAt?: string | Date;
    dueAt?: string | Date;
    frequency: Frequency;
    results: TestResult[];
}
