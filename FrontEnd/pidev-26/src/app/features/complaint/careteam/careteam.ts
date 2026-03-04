import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';

import { CurrentUserService } from '../../../core/user/current-user.service';
import { CaregiverModel } from './model/caregiver.model';
import { DoctorModel } from './model/doctor.model';
import { CareteamService } from './service/careteam.service';
import {
  ComplaintCategory,
  ComplaintPriority,
  UserRole,
} from '../model/complaint.model';
import { ComplaintService } from '../service/complaint.service';

@Component({
  selector: 'app-careteam',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './careteam.html',
  styleUrl: './careteam.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Careteam implements OnInit {
  private readonly currentUser = inject(CurrentUserService);
  private readonly careteamService = inject(CareteamService);
  private readonly complaintService = inject(ComplaintService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly doctor = signal<DoctorModel | null>(null);
  readonly caregivers = signal<CaregiverModel[]>([]);

  // Complaint modal state
  readonly isReportModalOpen = signal(false);
  readonly reportTargetUserId = signal<number | null>(null);
  readonly reportTargetUserRole = signal<UserRole | null>(null);
  readonly reportTargetName = signal<string>('');
  readonly reportCategory = signal<ComplaintCategory | null>(null);
  readonly reportCustomCategory = signal<string>('');
  readonly reportPriority = signal<ComplaintPriority | null>(null);
  readonly reportDescription = signal<string>('');
  readonly reportEvidenceFile = signal<File | null>(null);
  readonly reportEvidencePreview = signal<string>('');
  readonly isSubmittingReport = signal(false);
  readonly reportError = signal<string | null>(null);

  readonly ComplaintCategory = ComplaintCategory;
  readonly ComplaintPriority = ComplaintPriority;
  readonly UserRole = UserRole;

  ngOnInit(): void {
    this.loadCareTeam();
  }

  private loadCareTeam(): void {
    const patientId = this.extractPatientIdFromCurrentUser();

    if (!patientId) {
      this.error.set('Unable to determine the logged in patient.');
      this.loading.set(false);
      return;
    }

    this.loadByPatientId(patientId);
  }

  private extractPatientIdFromCurrentUser(): number | null {
    const currentUserState = this.currentUser.user();
    const rawId = (currentUserState?.data as { id?: unknown } | undefined)?.id;
    const patientId = Number(rawId);
    return Number.isFinite(patientId) && patientId > 0 ? patientId : null;
  }

  private loadByPatientId(patientId: number): void {
    forkJoin({
      assignment: this.careteamService.getPatientDoctorAssignment(patientId),
      patient: this.careteamService.getPatientById(patientId),
    }).subscribe({
      next: ({ assignment, patient }) => {
        // Note: assignment.doctor is null because backend doesn't return it.
        // Doctor relationship needs to be fetched from backend endpoint.
        this.doctor.set(assignment?.doctor ?? null);
        this.caregivers.set(Array.isArray(patient?.caregiverList) ? patient.caregiverList : []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load your care team. Please try again.');
        this.loading.set(false);
      },
    });
  }

  getDoctorFullName(): string {
    const doctor = this.doctor();
    if (!doctor) return '';
    return [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
  }

  getCaregiverFullName(caregiver: CaregiverModel): string {
    return [caregiver.firstName, caregiver.lastName].filter(Boolean).join(' ').trim();
  }

  openReportModal(targetUserId: number, targetUserRole: UserRole, targetName: string): void {
    this.reportTargetUserId.set(targetUserId);
    this.reportTargetUserRole.set(targetUserRole);
    this.reportTargetName.set(targetName);
    this.reportCategory.set(null);
    this.reportCustomCategory.set('');
    this.reportPriority.set(null);
    this.reportDescription.set('');
    this.reportEvidenceFile.set(null);
    this.reportEvidencePreview.set('');
    this.reportError.set(null);
    this.isReportModalOpen.set(true);
  }

  closeReportModal(): void {
    this.isReportModalOpen.set(false);
  }

  onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.reportEvidenceFile.set(null);
      this.reportEvidencePreview.set('');
      return;
    }

    const file = input.files[0];
    this.reportEvidenceFile.set(file);
    this.reportEvidencePreview.set(URL.createObjectURL(file));
  }

  onDescriptionChange(value: string): void {
    this.reportDescription.set(value);
  }

  onCustomCategoryChange(value: string): void {
    this.reportCustomCategory.set(value);
  }

  submitReport(): void {
    if (this.isSubmittingReport()) return;

    this.reportError.set(null);

    const patientId = this.extractPatientIdFromCurrentUser();
    if (!patientId) {
      this.reportError.set('Unable to determine the logged in patient.');
      return;
    }

    if (!this.reportTargetUserId() || !this.reportTargetUserRole()) {
      this.reportError.set('Invalid report target.');
      return;
    }

    if (!this.reportCategory()) {
      this.reportError.set('Please select a category.');
      return;
    }

    if (this.reportCategory() === ComplaintCategory.OTHER && !this.reportCustomCategory().trim()) {
      this.reportError.set('Please describe what you mean by "Other".');
      return;
    }

    if (!this.reportPriority()) {
      this.reportError.set('Please select a priority level.');
      return;
    }

    if (!this.reportDescription() || this.reportDescription().trim() === '') {
      this.reportError.set('Please provide a description.');
      return;
    }

    this.isSubmittingReport.set(true);

    const evidenceFile = this.reportEvidenceFile();
    const categoryValue = this.reportCategory() === ComplaintCategory.OTHER 
      ? this.reportCustomCategory() 
      : this.reportCategory()!;

    const complaintData = {
      patientId,
      targetUserId: this.reportTargetUserId()!,
      targetUserRole: this.reportTargetUserRole()!,
      category: categoryValue as ComplaintCategory,
      description: this.reportDescription(),
      priority: this.reportPriority()!,
    };

    if (evidenceFile) {
      this.complaintService
        .uploadImage(evidenceFile)
        .pipe(
          switchMap((evidenceUrl) =>
            this.complaintService.submitComplaint({ ...complaintData, evidenceUrl }),
          ),
        )
        .subscribe({
          next: () => {
            this.isSubmittingReport.set(false);
            this.closeReportModal();
            this.router.navigate(['/complaint']);
          },
          error: () => {
            this.isSubmittingReport.set(false);
            this.reportError.set('Failed to submit report. Please try again.');
          },
        });
    } else {
      this.complaintService.submitComplaint(complaintData).subscribe({
        next: () => {
          this.isSubmittingReport.set(false);
          this.closeReportModal();
          this.router.navigate(['/complaint']);
        },
        error: () => {
          this.isSubmittingReport.set(false);
          this.reportError.set('Failed to submit report. Please try again.');
        },
      });
    }
  }
}
