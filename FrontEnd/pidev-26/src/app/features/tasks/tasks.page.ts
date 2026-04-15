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

  searchQuery = '';
  isSidebarVisible = true;

  isHandoverVisible = false;
  isGeneratingHandover = false;
  handoverSummary: any = null;

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
          },
          error: (err) => {
            console.error('Error fetching staff info:', err);
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

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.cdr.detectChanges();
  }

  getPatientAvatarUrl(patientId: number): string {
    // Using Gravatar anonymous silhouette for all patients (uniform, professional look)
    return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  }

  generateHandover(): void {
    if (this.selectedPatientId === null) return;

    this.isGeneratingHandover = true;
    this.isHandoverVisible = true;
    this.handoverSummary = null;

    const patientName = this.getPatientName(this.selectedPatientId);
    const patientTasks = this.tasks.filter(t => t.patientId === this.selectedPatientId);

    const doneTasks = patientTasks.filter(t => t.isDone).map(t => t.task);
    const todoTasks = patientTasks.filter(t => !t.isDone).map(t => t.task);

    // Simulate AI Call
    setTimeout(() => {
      this.handoverSummary = {
        patient: patientName,
        global: `Patient stable but requires close monitoring for ${doneTasks.length > 0 ? 'completed' : 'pending'} activities.`,
        done: doneTasks.length > 0 ? doneTasks : ['No tasks completed yet today.'],
        todo: todoTasks.length > 0 ? todoTasks : ['All scheduled tasks are completed.'],
        critical: [
          'Monitor blood pressure after next medication.',
          'Verify patient took evening dosage of prescribed meds.',
          'Assistance needed for tomorrow morning exercise session.'
        ]
      };
      this.isGeneratingHandover = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  closeHandover(): void {
    this.isHandoverVisible = false;
  }

  downloadPDF(): void {
    if (!this.handoverSummary) return;

    const patientName = this.handoverSummary.patient;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    // Escape HTML entities
    const escapeHtml = (text: string) => {
      const map: any = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    // Build list items HTML
    const buildListHtml = (items: string[]) => {
      return items.map(item => '<li>' + escapeHtml(item) + '</li>').join('');
    };

    const htmlContent =
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Medical Handover Report</title><style>' +
      '* { margin: 0; padding: 0; box-sizing: border-box; } ' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #2c3e50; line-height: 1.6; } ' +
      '.container { max-width: 850px; margin: 0 auto; padding: 40px; } ' +
      '.header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; } ' +
      '.report-title { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 10px; letter-spacing: 1px; } ' +
      '.report-meta { display: flex; gap: 30px; font-size: 13px; color: #6366f1; font-weight: 600; } ' +
      '.meta-item { display: flex; flex-direction: column; } ' +
      '.meta-label { color: #6b7280; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; } ' +
      '.section { margin-bottom: 30px; page-break-inside: avoid; } ' +
      '.section-title { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; } ' +
      '.section-subtitle { font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; } ' +
      '.condition-card { background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px; margin-bottom: 20px; } ' +
      '.condition-text { font-size: 14px; color: #374151; line-height: 1.7; } ' +
      '.task-list { list-style: none; margin-left: 0; } ' +
      '.task-list li { padding: 10px 0; padding-left: 24px; position: relative; font-size: 13px; color: #374151; } ' +
      '.task-list li:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: 700; } ' +
      '.critical-list li:before { content: "⚠"; color: #f59e0b; } ' +
      '.pending-list li:before { content: "○"; color: #6b7280; } ' +
      '.footer { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; } ' +
      '.footer-text { margin: 4px 0; } ' +
      '@media print { body { background: white; } .container { padding: 20mm; } } ' +
      '</style></head><body>' +
      '<div class="container">' +
      '<div class="header">' +
      '<h1 class="report-title">MEDICAL HANDOVER REPORT</h1>' +
      '<div class="report-meta">' +
      '<div class="meta-item"><span class="meta-label">Patient</span><span>' + escapeHtml(patientName) + '</span></div>' +
      '<div class="meta-item"><span class="meta-label">Generated</span><span>' + dateStr + ' ' + timeStr + '</span></div>' +
      '</div></div>' +
      '<div class="section"><h2 class="section-title">CONDITION</h2>' +
      '<div class="condition-card"><p class="condition-text">' + escapeHtml(this.handoverSummary.global) + '</p></div></div>' +
      '<div class="section"><h2 class="section-title">ACHIEVEMENTS</h2>' +
      '<p class="section-subtitle">Tasks completed today</p>' +
      '<ul class="task-list">' + buildListHtml(this.handoverSummary.done) + '</ul></div>' +
      '<div class="section"><h2 class="section-title">NEXT STEPS</h2>' +
      '<p class="section-subtitle">Critical actions required</p>' +
      '<ul class="task-list critical-list">' + buildListHtml(this.handoverSummary.critical) + '</ul></div>' +
      '<div class="section"><h2 class="section-title">PENDING TASKS</h2>' +
      '<p class="section-subtitle">To be completed</p>' +
      '<ul class="task-list pending-list">' + buildListHtml(this.handoverSummary.todo) + '</ul></div>' +
      '<div class="footer"><p class="footer-text">Generated by AI Handover Assistant</p>' +
      '<p class="footer-text">Medical Care Management System</p>' +
      '<p class="footer-text" style="margin-top: 12px; font-size: 11px; color: #9ca3af;">This document is confidential and for authorized medical staff only.</p>' +
      '</div></div></body></html>';

    // Create and trigger download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = 'handover_' + patientName.replace(/\s+/g, '_') + '_' + now.toISOString().split('T')[0] + '.html';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  copyHandoverToClipboard(): void {
    if (!this.handoverSummary) return;

    const text = `
HANDOVER SUMMARY - ${this.handoverSummary.patient}
--------------------------------------------------
GLOBAL STATE: ${this.handoverSummary.global}

COMPLETED TODAY:
${this.handoverSummary.done.map((t: string) => `- ${t}`).join('\n')}

HANDOVER POINTS (CRITICAL):
${this.handoverSummary.critical.map((t: string) => `- ${t}`).join('\n')}

TO BE DONE:
${this.handoverSummary.todo.map((t: string) => `- ${t}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      alert('Handover summary copied to clipboard!');
    });
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
    let result = this.tasks;
    if (this.selectedPatientId !== null) {
      result = result.filter(t => t.patientId === this.selectedPatientId);
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

  viewHistory(t: Task): void {
    if (!t.id) return;
    this.router.navigate(['/tasks', t.id, 'history'], {
      queryParams: { taskLabel: t.task }
    });
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
