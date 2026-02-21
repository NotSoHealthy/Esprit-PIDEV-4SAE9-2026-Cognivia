import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../core/api/task.service';
import { Task } from '../../core/api/models/task.model';
import { KeycloakService } from '../../core/auth/keycloak.service';

export type TaskStatus = 'IN_PROGRESS' | 'COMPLETED';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.css'],
})
export class TasksPage implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly keycloak = inject(KeycloakService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  tasks: Task[] = [];
  loading = false;

  // Edit modal state
  editing: Task | null = null;
  showEditModal = false;
  editForm: Partial<Task> = {};

  userRole?: string;
  isPatient = false;
  isCaregiverOrDoctor = false;
  currentUserId?: number;

  taskTypes = ['GENERAL', 'MEDICATION', 'EXERCISE', 'NUTRITION', 'HYGIENE', 'APPOINTMENT', 'MONITORING'];

  ngOnInit(): void {
    this.userRole = this.keycloak.getUserRole();
    this.isPatient = this.userRole === 'ROLE_PATIENT';
    this.isCaregiverOrDoctor =
      !!this.userRole &&
      ['ROLE_CAREGIVER', 'ROLE_DOCTOR', 'ROLE_ADMIN'].includes(this.userRole);

    // Auto-refresh on page enter
    this.load();
  }

  load(): void {
    this.loading = true;
    const keycloakUserId = this.keycloak.getUserId();
    if (!keycloakUserId) { this.loading = false; return; }

    if (this.isPatient) {
      if (this.currentUserId) {
        this.fetchPatientTasks(this.currentUserId);
      } else {
        this.taskService.getPatientByUserId(keycloakUserId).subscribe({
          next: (patient) => {
            if (patient && patient.id) {
              this.currentUserId = patient.id;
              this.fetchPatientTasks(patient.id);
            } else { this.loading = false; }
          },
          error: () => this.loading = false
        });
      }
    } else if (this.isCaregiverOrDoctor) {
      if (this.currentUserId) {
        this.fetchStaffTasks(this.currentUserId);
      } else {
        console.log('Fetching staff ID for role:', this.userRole, 'with Keycloak UUID:', keycloakUserId);
        const obs = this.userRole === 'ROLE_DOCTOR'
          ? this.taskService.getDoctorByUserId(keycloakUserId)
          : this.taskService.getCaregiverByUserId(keycloakUserId);

        console.log('TasksCreatePage: Fetching staff ID for UUID:', keycloakUserId);
        obs.subscribe({
          next: (staff) => {
            console.log('TasksCreatePage: Staff resolution result:', staff);
            if (staff && staff.id) {
              console.log('Staff ID resolution result:', staff);
              if (staff && staff.id) {
                this.currentUserId = staff.id;
                this.fetchStaffTasks(staff.id);
              } else {
                console.warn('No numeric staff ID found, stopping loading.');
                this.loading = false;
                this.cdr.detectChanges();
              }
            } else {
              console.warn('No numeric staff ID found, stopping loading.');
              this.loading = false;
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            console.error('Error resolving staff ID:', err);
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    } else { // This 'else' block is for when neither isPatient nor isCaregiverOrDoctor is true, or as a general fallback
      this.taskService.getAll().subscribe({
        next: (t) => { this.tasks = t; this.loading = false; },
        error: () => this.loading = false
      });
    }
  }

  private fetchPatientTasks(patientId: number): void {
    this.taskService.getByPatient(patientId).subscribe({
      next: (t) => { this.tasks = t; this.loading = false; },
      error: () => this.loading = false
    });
  }

  private fetchStaffTasks(staffId: number): void {
    this.taskService.getByUser(staffId).subscribe({
      next: (t) => {
        this.tasks = t;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get canCreate(): boolean {
    return this.isCaregiverOrDoctor;
  }

  canMarkDone(t: Task): boolean {
    return this.isCaregiverOrDoctor;
  }

  // Status derivation: isDone=true → COMPLETED, else IN_PROGRESS
  getStatus(t: Task): TaskStatus {
    return t.isDone ? 'COMPLETED' : 'IN_PROGRESS';
  }

  statusLabel(t: Task): string {
    return t.isDone ? 'Completed' : 'In Progress';
  }

  statusClass(t: Task): string {
    return t.isDone ? 'status-completed' : 'status-in-progress';
  }

  // Stat helpers
  get totalTasks(): number { return this.tasks.length; }
  get inProgressTasks(): number { return this.tasks.filter(t => !t.isDone).length; }
  get completedTasks(): number { return this.tasks.filter(t => t.isDone).length; }

  // Navigate to dedicated create page
  goCreate(): void {
    this.router.navigate(['/tasks/create']);
  }

  // Edit modal
  openEdit(t: Task): void {
    if (!this.canCreate) return;
    this.editing = t;
    this.editForm = { ...t, dueAt: t.dueAt ? t.dueAt.slice(0, 16) : '' };
    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.editing = null;
    this.editForm = {};
  }

  submitEdit(): void {
    if (!this.editing?.id || !this.canCreate) return;

    const payload: Partial<Task> = {
      ...this.editForm,
      patientId: Number(this.editForm.patientId ?? 0),
      userId: Number(this.editForm.userId ?? 0),
    };

    if (payload.dueAt && payload.dueAt.length === 16) {
      payload.dueAt = payload.dueAt + ':00';
    }

    this.taskService.update(this.editing.id, payload).subscribe({
      next: () => { this.closeEdit(); this.load(); },
      error: () => { }
    });
  }

  remove(id?: number): void {
    if (!id) return;
    if (!confirm('Delete this task?')) return;
    this.taskService.delete(id).subscribe({ next: () => this.load() });
  }

  toggleDone(t: Task): void {
    if (!this.canMarkDone(t)) return;
    this.taskService.markDone(t.id!, !t.isDone).subscribe({ next: () => this.load() });
  }

  badgeClass(type: string): string {
    const map: Record<string, string> = {
      MEDICATION: 'badge-medication',
      EXERCISE: 'badge-exercise',
      NUTRITION: 'badge-nutrition',
      HYGIENE: 'badge-hygiene',
      APPOINTMENT: 'badge-appointment',
      MONITORING: 'badge-monitoring',
    };
    return map[type] ?? 'badge-general';
  }
}
