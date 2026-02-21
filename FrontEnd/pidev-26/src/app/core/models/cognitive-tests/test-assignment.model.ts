import { Frequency } from './frequency.enum';
import { TestResult } from './test-result.model';
import { CognitiveTest } from './cognitive-test.model';

export type AssignmentType = 'TARGETED' | 'GENERAL';
export type SeverityTarget = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export interface TestAssignment {
    id?: number;
    assignedAt?: string | Date;
    dueAt?: string | Date;
    frequency: Frequency;
    results?: TestResult[];
    test?: CognitiveTest;
    /** TARGETED = specific patient, GENERAL = all patients of a severity group */
    assignmentType: AssignmentType;
    /** Only set when assignmentType = TARGETED */
    patientId?: number;
    /** Only set when assignmentType = GENERAL */
    targetSeverity?: SeverityTarget;
}

