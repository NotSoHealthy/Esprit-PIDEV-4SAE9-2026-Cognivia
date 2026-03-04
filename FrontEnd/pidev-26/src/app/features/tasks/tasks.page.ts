import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../core/api/task.service';
import { Task, TaskSubmission } from '../../core/api/models/task.model';
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
  patients: any[] = [];
  selectedPatientId: number | null = null;
  selectedTask: Task | null = null;

  // Submission state
  showSubmissionForm = false;
  submissionForm = {
    description: '',
    picturePreview: '',
  };
  currentSubmissions: TaskSubmission[] = [];
  submissionLoading = false;
  validationComments: { [key: number]: string } = {};

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

    if (this.isCaregiverOrDoctor) {
      this.taskService.getPatients().subscribe({
        next: (p) => {
          this.patients = p;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Failed to load patients', err)
      });
    }

    // Auto-refresh on page enter
    this.load();
  }

  load(): void {
    this.loading = true;
    const keycloakUserId = this.keycloak.getUserId();
    if (!keycloakUserId) {
      this.loading = false;
      return;
    }

    if (this.isPatient) {
      if (this.currentUserId) {
        this.fetchPatientTasks(this.currentUserId);
      } else {
        this.taskService.getPatientByUserId(keycloakUserId).subscribe({
          next: (patient) => {
            if (patient && patient.id) {
              this.currentUserId = patient.id;
              this.fetchPatientTasks(patient.id);
            } else {
              this.loading = false;
            }
          },
          error: () => (this.loading = false),
        });
      }
    } else if (this.isCaregiverOrDoctor) {
      // Staff (Caregiver/Doctor/Admin) sees ALL tasks by default, then filters by patient sidebar
      this.taskService.getAll().subscribe({
        next: (t) => {
          this.tasks = t;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching all tasks:', err);
          this.loading = false;
          this.cdr.detectChanges();
        },
      });

      // Also ensure we have the numeric ID for the staff member if needed for validation
      if (!this.currentUserId) {
        const obs = this.userRole === 'ROLE_DOCTOR' ? this.taskService.getDoctorByUserId(keycloakUserId) : this.taskService.getCaregiverByUserId(keycloakUserId);
        obs.subscribe({
          next: (staff) => {
            if (staff && staff.id) {
              this.currentUserId = staff.id;
            }
          }
        });
      }
    } else {
      this.taskService.getAll().subscribe({
        next: (t) => {
          this.tasks = t;
          this.loading = false;
        },
        error: () => (this.loading = false),
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
        // Defaults to "All Patients" (null) if list exists
        if (this.patients.length > 0 && this.selectedPatientId === null) {
          this.selectPatient(null);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectPatient(id: number | null): void {
    this.selectedPatientId = id;
    this.selectedTask = null; // Reset details on filter change
    this.cdr.detectChanges();
  }

  selectTask(t: Task | null): void {
    if (t) {
      this.selectTaskDetail(t);
    } else {
      this.selectedTask = null;
      this.resetSubmissionForm();
      this.cdr.detectChanges();
    }
  }

  get filteredTasks(): Task[] {
    if (this.selectedPatientId === null) return this.tasks;
    return this.tasks.filter(t => t.patientId === this.selectedPatientId);
  }

  getPatientName(id: number): string {
    const p = this.patients.find(x => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : `Patient #${id}`;
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

  // Navigate to dedicated create page with optional pre-selected patient
  goCreate(): void {
    const queryParams: any = {};
    if (this.selectedPatientId) {
      queryParams.patientId = this.selectedPatientId;
    }
    this.router.navigate(['/tasks/create'], { queryParams });
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

  // Task Submission Methods
  selectTaskDetail(task: Task): void {
    this.selectedTask = task;
    if (task.id && (this.isPatient || this.isCaregiverOrDoctor)) {
      this.loadSubmissions(task.id);
    }
    this.resetSubmissionForm();
    this.cdr.detectChanges();
  }

  loadSubmissions(taskId: number): void {
    this.submissionLoading = true;
    this.taskService.getSubmissions(taskId).subscribe({
      next: (submissions: TaskSubmission[]) => {
        this.currentSubmissions = submissions;
        this.submissionLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load submissions:', err);
        this.submissionLoading = false;
        this.currentSubmissions = [];
      }
    });
  }

  openSubmissionForm(): void {
    this.showSubmissionForm = true;
    this.cdr.detectChanges();
  }

  closeSubmissionForm(): void {
    this.showSubmissionForm = false;
    this.resetSubmissionForm();
    this.cdr.detectChanges();
  }

  resetSubmissionForm(): void {
    this.submissionForm = {
      description: '',
      picturePreview: '',
    };
  }

  onPictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.submissionForm.picturePreview = e.target?.result as string;
        console.log('Image preview loaded');
        this.cdr.detectChanges();
      };
      reader.onerror = () => {
        console.error('FileReader error');
        alert('Failed to read image');
      };
      reader.readAsDataURL(file);
    }
  }

  validateSubmission(): boolean {
    if (!this.submissionForm.picturePreview) {
      alert('Please select a photo');
      return false;
    }
    if (!this.submissionForm.description || this.submissionForm.description.trim().length === 0) {
      alert('Please enter a description');
      return false;
    }
    return true;
  }

  submitTaskWork(): void {
    if (!this.selectedTask?.id || !this.validateSubmission()) return;

    this.submissionLoading = true;
    const submission: Partial<TaskSubmission> = {
      taskId: this.selectedTask.id,
      patientId: this.currentUserId || 0,
      description: this.submissionForm.description,
      pictureData: this.submissionForm.picturePreview,
      validationStatus: 'pending'
    };

    this.taskService.submitTask(this.selectedTask.id, submission).subscribe({
      next: () => {
        alert('Task submitted successfully!');
        this.closeSubmissionForm();
        this.loadSubmissions(this.selectedTask!.id!);
        this.submissionLoading = false;
      },
      error: (err: any) => {
        console.error('Submission failed:', err);
        alert('Failed to submit task. Please try again.');
        this.submissionLoading = false;
      }
    });
  }

  deleteSubmission(submissionId?: number): void {
    if (!submissionId || !this.selectedTask?.id) return;
    if (!confirm('Delete this submission?')) return;

    this.taskService.deleteSubmission(this.selectedTask.id, submissionId).subscribe({
      next: () => {
        this.loadSubmissions(this.selectedTask!.id!);
      },
      error: () => {
        alert('Failed to delete submission');
      }
    });
  }

  approveSubmission(submissionId: number, comments?: string): void {
    if (!this.selectedTask?.id) return;

    const validation = {
      validationStatus: 'approved',
      validationComments: comments || ''
    };

    this.taskService.validateSubmission(this.selectedTask.id, submissionId, validation, this.currentUserId).subscribe({
      next: () => {
        // Automatically mark as done when approved
        if (this.selectedTask?.id) {
          this.taskService.markDone(this.selectedTask.id, true).subscribe({
            next: () => {
              alert('Submission approved and task marked as completed!');
              this.validationComments[submissionId] = '';
              // Refresh task state and submissions
              this.load();
              this.loadSubmissions(this.selectedTask!.id!);
            },
            error: (err) => {
              console.error('Failed to mark task as done:', err);
              alert('Submission approved, but failed to mark task as done.');
            }
          });
        }
      },
      error: (err: any) => {
        console.error('Approval failed:', err);
        alert('Failed to approve submission');
      }
    });
  }

  rejectSubmission(submissionId: number, comments?: string): void {
    if (!this.selectedTask?.id) return;

    const validation = {
      validationStatus: 'rejected',
      validationComments: comments || 'Submission rejected. Please resubmit.'
    };

    this.taskService.validateSubmission(this.selectedTask.id, submissionId, validation, this.currentUserId).subscribe({
      next: () => {
        alert('Submission rejected!');
        this.validationComments[submissionId] = '';
        this.loadSubmissions(this.selectedTask!.id!);
      },
      error: (err: any) => {
        console.error('Rejection failed:', err);
        alert('Failed to reject submission');
      }
    });
  }
}
