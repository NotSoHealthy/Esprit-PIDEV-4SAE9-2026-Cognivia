export interface Task {
  id?: number;
  patientId: number;
  userId: number;
  task: string;
  taskType: string;
  isDone: boolean;
  createdAt?: string;
  dueAt?: string;
  steps?: TaskStep[];
  submissions?: TaskSubmission[];
  submissionStatus?: string;
}

export interface TaskStep {
  stepNumber: number;
  description: string;
  instructions?: string;
}

export interface TaskSubmission {
  id?: number;
  taskId: number;
  patientId: number;
  pictureData?: string;
  description: string;
  validationStatus?: string;
  submittedAt?: string;
  validatedAt?: string;
  validatedBy?: string;
  validationComments?: string;
}
