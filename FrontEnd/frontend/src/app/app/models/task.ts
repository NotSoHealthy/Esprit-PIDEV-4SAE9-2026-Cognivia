export type TaskType = 'MEDICATION' | 'EXERCISE' | 'HYGIENE' | 'MEAL';

export interface Task {
  id?: number;
  patientId: number;
  userId: number;
  task: string;
  taskType: TaskType;
  isDone?: boolean;
  createdAt?: string;
  dueAt: string;
}
