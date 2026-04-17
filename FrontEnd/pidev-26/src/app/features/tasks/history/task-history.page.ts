import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../../core/api/task.service';
import { TaskHistoryEvent } from '../../../core/api/models/task-history.model';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './task-history.page.html',
  styleUrls: ['./task-history.page.css'],
})
export class TaskHistoryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly cdr = inject(ChangeDetectorRef);

  taskId!: number;
  taskLabel = '';
  events: TaskHistoryEvent[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.taskId = Number(this.route.snapshot.paramMap.get('taskId'));
    this.taskLabel = this.route.snapshot.queryParamMap.get('taskLabel') || '';

    console.log('[TaskHistory] Initializing for ID:', this.taskId);

    if (!this.taskId) {
      this.error = 'Invalid task ID.';
      this.loading = false;
      return;
    }

    // Load history with robust error handling
    this.taskService.getTaskHistory(this.taskId).pipe(
      timeout(8000),
      catchError((err) => {
        console.error('[TaskHistory] Error or Timeout:', err);
        this.error = 'Failed to load enriched history. Displaying basic data.';
        this.loading = false; // Ensure loading is stopped on error
        return of([] as TaskHistoryEvent[]); 
      })
    ).subscribe({
      next: (events) => {
        console.log('[TaskHistory] Received events:', events?.length);
        this.events = events || [];
        this.loading = false; // Ensure loading is stopped on success
        console.log('[TaskHistory] Final state -> loading:', this.loading, 'events:', this.events.length);
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }

  /** Maps status string to a CSS class for coloring */
  statusClass(status: string): string {
    const map: Record<string, string> = {
      INFO: 'event-info',
      SUCCESS: 'event-success',
      WARNING: 'event-warning',
      DANGER: 'event-danger',
    };
    return map[status] ?? 'event-info';
  }

  /** Maps event type to a professional icon (Font Awesome or Unicode) */
  eventIcon(type: string): string {
    const map: Record<string, string> = {
      TASK_CREATED: '✨',
      TASK_SCHEDULED: '📅',
      TASK_COMPLETED: '🏁',
      TASK_OVERDUE: '🚨',
      SUBMISSION_ADDED: '📝',
      SUBMISSION_APPROVED: '✅',
      SUBMISSION_REJECTED: '❌',
      SUBMISSION_PENDING: '⏳',
    };
    return map[type] ?? '•';
  }

  /** Translates technical status to readable English label */
  formatStatus(status?: string): string {
    if (!status) return '';
    const map: Record<string, string> = {
      'PENDING': 'Pending',
      'SCHEDULED': 'Scheduled',
      'PENDING_VALIDATION': 'Pending Validation',
      'COMPLETED': 'Completed',
      'REJECTED': 'Rejected',
      'OVERDUE': 'Overdue'
    };
    return map[status] ?? status;
  }

  /** Gets actor badge color based on type */
  actorTypeClass(type?: string): string {
    if (!type) return 'actor-system';
    return `actor-${type.toLowerCase()}`;
  }
}
