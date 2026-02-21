import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TaskService } from '../../../core/api/task.service';
import { Task } from '../../../core/api/models/task.model';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasks-list.page.html',
  styleUrls: ['./tasks-list.page.css'],
})
export class TasksListPage implements OnInit {
  private readonly taskService = inject(TaskService);
  tasks: Task[] = [];
  loading = false;
  message = '';

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.taskService.getAll().subscribe({ next: (t) => { this.tasks = t; this.loading = false }, error: (e) => { this.message = String(e); this.loading = false } });
  }

  remove(id?: number): void {
    if (!id) return;
    if (!confirm('Delete task?')) return;
    this.taskService.delete(id).subscribe({ next: () => this.loadAll(), error: (e) => (this.message = String(e)) });
  }
}
