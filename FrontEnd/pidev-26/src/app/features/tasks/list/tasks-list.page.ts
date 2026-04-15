import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/api/task.service';
import { Task } from '../../../core/api/models/task.model';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks-list.page.html',
  styleUrls: ['./tasks-list.page.css'],
})
export class TasksListPage implements OnInit {
  private readonly taskService = inject(TaskService);
  tasks: Task[] = [];
  selectedPatientId: string | number | null = null;
  loading = false;
  message = '';
  searchQuery = '';

  ngOnInit(): void {
    this.loadAll();
  }

  get filteredTasks(): Task[] {
    let result = this.tasks;
    if (this.selectedPatientId !== null) {
      result = result.filter(t => String(t.patientId) === String(this.selectedPatientId));
    }

    if (this.searchQuery && this.searchQuery.trim().length > 0) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        (t.task && t.task.toLowerCase().includes(q)) || 
        (t.taskType && t.taskType.toLowerCase().includes(q))
      );
    }
    return result;
  }

  get totalTasks(): number { return this.filteredTasks.length; }
  get pendingTasks(): number { return this.filteredTasks.filter(t => !t.isDone).length; }
  get completedTasks(): number { return this.filteredTasks.filter(t => t.isDone).length; }

  get uniquePatients(): (string | number)[] {
    return [...new Set(this.tasks.map(t => t.patientId).filter(id => !!id))];
  }

  filterByPatient(id: string | number | null): void {
    this.selectedPatientId = id;
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
