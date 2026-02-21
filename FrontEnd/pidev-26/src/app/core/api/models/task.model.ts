export interface Task {
  id?: number;
  patientId: number;
  userId: number;
  task: string;
  taskType: string;
  isDone: boolean;
  createdAt?: string;
  dueAt?: string;
}
