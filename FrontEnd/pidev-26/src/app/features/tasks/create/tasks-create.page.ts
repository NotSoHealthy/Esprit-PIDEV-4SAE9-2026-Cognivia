import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../../core/api/task.service';
import { Task } from '../../../core/api/models/task.model';
import { KeycloakService } from '../../../core/auth/keycloak.service';

@Component({
  selector: 'app-tasks-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks-create.page.html',
  styleUrls: ['./tasks-create.page.css'],
})
export class TasksCreatePage implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly keycloak = inject(KeycloakService);
  private readonly cdr = inject(ChangeDetectorRef);

  taskTypes = ['GENERAL', 'MEDICATION', 'EXERCISE', 'NUTRITION', 'HYGIENE', 'APPOINTMENT', 'MONITORING'];
  patients: any[] = [];

  model: Partial<Task> = {
    patientId: undefined,
    userId: 0,
    task: '',
    taskType: 'GENERAL',
    isDone: false,
    dueAt: new Date().toISOString().slice(0, 16),
  };

  saving = false;
  error = '';

  userRole?: string;
  isPatient = false;
  isStaff = false;

  ngOnInit(): void {
    this.userRole = this.keycloak.getUserRole();
    this.isPatient = this.userRole === 'ROLE_PATIENT';
    this.isStaff = ['ROLE_CAREGIVER', 'ROLE_DOCTOR', 'ROLE_ADMIN'].includes(this.userRole ?? '');

    if (this.isPatient) {
      // Redirect patients away from creation page
      this.router.navigate(['/tasks']);
      return;
    }

    if (this.isStaff) {
      this.taskService.getPatients().subscribe({
        next: (p) => {
          this.patients = p;
          // After loading patients, check if we have a pre-selected patient from query params
          this.route.queryParams.subscribe(params => {
            if (params['patientId']) {
              this.model.patientId = Number(params['patientId']);
              this.cdr.detectChanges();
            }
          });
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Failed to load patients', err)
      });
    }

    const keycloakUserId = this.keycloak.getUserId();

    if (this.isStaff && keycloakUserId) {
      const obs = this.userRole === 'ROLE_DOCTOR'
        ? this.taskService.getDoctorByUserId(keycloakUserId)
        : this.taskService.getCaregiverByUserId(keycloakUserId);

      console.log('TasksCreatePage: Fetching staff ID for UUID:', keycloakUserId);
      obs.subscribe({
        next: (staff) => {
          console.log('TasksCreatePage: Staff resolution result:', staff);
          if (staff && staff.id) {
            this.model.userId = staff.id;
          } else {
            console.warn('Caregiver/Doctor record not found for current user. Task creation might fail.');
          }
        },
        error: (err) => {
          console.error('Failed to resolve staff ID', err);
          this.error = 'Your caregiver/doctor account is not fully initialized. Please contact support.';
        }
      });
    }
  }

  submit(): void {
    if (this.isStaff && !this.model.userId) {
      this.error = 'Cannot create task: your staff ID could not be resolved. Please ensure your caregiver profile is created.';
      return;
    }
    this.saving = true;
    this.error = '';

    // Create a strict copy for the payload
    const payload: Partial<Task> = {
      ...this.model,
      patientId: Number(this.model.patientId),
      userId: Number(this.model.userId),
    };

    // Ensure dueAt matches strict Java yyyy-MM-ddTHH:mm:ss pattern
    if (payload.dueAt && payload.dueAt.length === 16) {
      payload.dueAt = payload.dueAt + ':00';
    } else if (!payload.dueAt || (payload.dueAt && payload.dueAt.includes('Z'))) {
      payload.dueAt = new Date().toISOString().slice(0, 19);
    }

    this.taskService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        // Go back to tasks list after successful creation
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        console.error('Failed to create task. Full error:', err);
        this.error = err?.error?.message || err?.message || 'Failed to create task.';
        this.saving = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/tasks']);
  }
}
