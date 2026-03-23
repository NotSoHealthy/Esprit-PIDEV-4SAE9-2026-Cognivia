import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/api/task.service';
import { Task } from '../../../core/api/models/task.model';

@Component({
  selector: 'app-tasks-update',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks-update.page.html',
  styleUrls: ['./tasks-update.page.css'],
})
export class TasksUpdatePage {
  private readonly taskService = inject(TaskService);

  id?: number;
  model?: Task;
  message = '';

  load(): void {
    if (!this.id) return;
    this.taskService.getById(this.id).subscribe({ next: (t) => (this.model = t), error: (e) => (this.message = String(e)) });
  }

  update(): void {
    if (!this.id || !this.model) return;
    this.taskService.update(this.id, this.model).subscribe({ next: () => (this.message = 'Updated'), error: (e) => (this.message = String(e)) });
  }
}
