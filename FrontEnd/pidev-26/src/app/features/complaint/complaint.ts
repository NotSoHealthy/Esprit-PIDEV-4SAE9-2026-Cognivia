import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';

import { KeycloakService } from '../../core/auth/keycloak.service';
import { CurrentUserService } from '../../core/user/current-user.service';
import {
  ComplaintCategory,
  ComplaintModel,
  ComplaintPriority,
  ComplaintStatus,
  UserRole,
} from './model/complaint.model';
import { ComplaintService } from './service/complaint.service';

@Component({
  selector: 'app-complaint',
  imports: [CommonModule],
  templateUrl: './complaint.html',
  styleUrl: './complaint.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Complaint implements OnInit {
  private readonly keycloakService = inject(KeycloakService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly complaintService = inject(ComplaintService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly complaints = signal<ComplaintModel[]>([]);
  readonly deleting = signal<number | null>(null);
  readonly showRetractConfirmation = signal(false);
  readonly complaintIdToDelete = signal<number | null>(null);
  readonly complaintNameToDelete = signal<string | null>(null);
  readonly isAdmin = signal(false);
  readonly selectedComplaint = signal<ComplaintModel | null>(null);
  readonly showDetailOverlay = signal(false);
  readonly detailLoading = signal(false);
  readonly validatingComplaintId = signal<number | null>(null);
  readonly dismissingComplaintId = signal<number | null>(null);
  readonly showDismissDecisionModal = signal(false);
  readonly dismissDecision = signal('');
  readonly detailSubmitterName = signal<string>('');
  readonly detailTargetName = signal<string>('');

  readonly ComplaintStatus = ComplaintStatus;

  ngOnInit(): void {
    const roles = this.keycloakService.getRealmRoles();
    this.isAdmin.set(roles.includes('ROLE_ADMIN'));
    this.loadComplaints();
  }

  private loadComplaints(): void {
    const userState = this.currentUser.user();
    if (this.isAdmin()) {
      this.loadAllComplaints();
    } else {
      this.loadPatientComplaints();
    }
  }

  private loadAllComplaints(): void {
    this.complaintService.getAllComplaints().subscribe({
      next: (complaints) => {
        this.complaints.set(Array.isArray(complaints) ? complaints : []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load complaints. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private loadPatientComplaints(): void {
    const patientId = this.extractPatientIdFromCurrentUser();

    if (!patientId) {
      this.error.set('Unable to determine the logged in patient.');
      this.loading.set(false);
      return;
    }

    this.complaintService.getComplaintsByPatientId(patientId).subscribe({
      next: (complaints) => {
        this.complaints.set(Array.isArray(complaints) ? complaints : []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load your complaints. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private extractPatientIdFromCurrentUser(): number | null {
    const currentUserState = this.currentUser.user();
    const rawId = (currentUserState?.data as { id?: unknown } | undefined)?.id;
    const patientId = Number(rawId);
    return Number.isFinite(patientId) && patientId > 0 ? patientId : null;
  }

  getStatusLabel(status: ComplaintStatus): string {
    return status.replace('_', ' ');
  }

  getStatusClass(status: ComplaintStatus): string {
    switch (status) {
      case ComplaintStatus.SUBMITTED:
        return 'status-submitted';
      case ComplaintStatus.VALIDATED:
        return 'status-validated';
      case ComplaintStatus.DISMISSED:
        return 'status-dismissed';
      case ComplaintStatus.INVESTIGATING:
        return 'status-investigating';
      case ComplaintStatus.ACTION_TAKEN:
        return 'status-action-taken';
      case ComplaintStatus.CLOSED:
        return 'status-closed';
      default:
        return '';
    }
  }

  getCategoryLabel(category: ComplaintCategory): string {
    switch (category) {
      case ComplaintCategory.PROFESSIONAL_MISCONDUCT:
        return 'Professional Misconduct';
      case ComplaintCategory.NEGLIGENCE:
        return 'Negligence';
      case ComplaintCategory.RUDE_BEHAVIOR:
        return 'Rude Behavior';
      case ComplaintCategory.DELAY_IN_SERVICE:
        return 'Delay in Service';
      case ComplaintCategory.MEDICATION_ERROR:
        return 'Medication Error';
      default:
        return category;
    }
  }

  getPriorityLabel(priority: ComplaintPriority): string {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
  }

  getRoleLabel(role: UserRole): string {
    return role.replace('ROLE_', '').charAt(0) + role.replace('ROLE_', '').slice(1).toLowerCase();
  }

  goBackToCareTeam(): void {
    this.router.navigate(['/careteam']);
  }

  retractComplaint(complaintId: number): void {
    if (!complaintId) return;

    const complaint = this.complaints().find((c) => c.id === complaintId);
    if (!complaint) return;

    this.complaintIdToDelete.set(complaintId);
    this.complaintNameToDelete.set(this.getCategoryLabel(complaint.category));
    this.showRetractConfirmation.set(true);
  }

  closeRetractConfirmation(): void {
    this.showRetractConfirmation.set(false);
    this.complaintIdToDelete.set(null);
    this.complaintNameToDelete.set(null);
  }

  confirmRetract(): void {
    const complaintId = this.complaintIdToDelete();
    if (!complaintId) return;

    this.deleting.set(complaintId);

    this.complaintService.deleteComplaint(complaintId).subscribe({
      next: () => {
        this.complaints.update((complaints) =>
          complaints.filter((c) => c.id !== complaintId),
        );
        this.deleting.set(null);
        this.closeRetractConfirmation();
      },
      error: () => {
        this.deleting.set(null);
        this.error.set('Failed to delete the report. Please try again.');
      },
    });
  }

  openDetailOverlay(complaint: ComplaintModel): void {
    this.selectedComplaint.set(complaint);
    this.showDetailOverlay.set(true);

    // Only load detail names for admin view
    if (this.isAdmin()) {
      this.detailLoading.set(true);
      this.detailSubmitterName.set('');
      this.detailTargetName.set('');
      this.loadDetailNames(complaint);
    }
  }

  private loadDetailNames(complaint: ComplaintModel): void {
    this.complaintService
      .getPatientDetails(complaint.patientId)
      .pipe(
        switchMap((patient: any) => {
          this.detailSubmitterName.set(`${patient.firstName} ${patient.lastName}`);
          return complaint.targetUserRole === UserRole.ROLE_DOCTOR
            ? this.complaintService.getDoctorDetails(complaint.targetUserId)
            : this.complaintService.getCaregiverDetails(complaint.targetUserId);
        }),
      )
      .subscribe({
        next: (target: any) => {
          this.detailTargetName.set(`${target.firstName} ${target.lastName}`);
          this.detailLoading.set(false);
        },
        error: () => {
          this.detailLoading.set(false);
          this.detailSubmitterName.set('Unknown');
          this.detailTargetName.set('Unknown');
        },
      });
  }

  retractComplaintFromDetail(): void {
    const complaint = this.selectedComplaint();
    if (complaint?.id) {
      this.complaintIdToDelete.set(complaint.id);
      this.complaintNameToDelete.set(this.getCategoryLabel(complaint.category));
      this.showRetractConfirmation.set(true);
    }
  }

  closeDetailOverlay(): void {
    this.showDetailOverlay.set(false);
    this.selectedComplaint.set(null);
  }

  validateComplaint(): void {
    const complaint = this.selectedComplaint();
    const adminId = this.resolveAdminIdentifier();
    if (!complaint || adminId === null) return;

    this.validatingComplaintId.set(complaint.id!);

    this.complaintService.validateComplaint(complaint, adminId).subscribe({
      next: (updatedComplaint) => {
        this.complaints.update((complaints) =>
          complaints.map((c) => (c.id === complaint.id ? updatedComplaint : c)),
        );
        this.validatingComplaintId.set(null);
        this.closeDetailOverlay();
      },
      error: () => {
        this.validatingComplaintId.set(null);
        this.error.set('Failed to validate the complaint. Please try again.');
      },
    });
  }

  openDismissDecisionModal(): void {
    this.dismissDecision.set('');
    this.error.set(null);
    this.showDismissDecisionModal.set(true);
  }

  closeDismissDecisionModal(): void {
    this.showDismissDecisionModal.set(false);
    this.dismissDecision.set('');
  }

  dismissComplaint(): void {
    const complaint = this.selectedComplaint();
    const adminId = this.resolveAdminIdentifier();
    const resolutionDecision = this.dismissDecision().trim();
    if (!complaint || adminId === null) return;
    if (!resolutionDecision) {
      this.error.set('Resolution decision is required.');
      return;
    }

    this.dismissingComplaintId.set(complaint.id!);
    this.error.set(null);

    this.complaintService.dismissComplaint(complaint, adminId, resolutionDecision).subscribe({
      next: (updatedComplaint) => {
        this.complaints.update((complaints) =>
          complaints.map((c) => (c.id === complaint.id ? updatedComplaint : c)),
        );
        this.dismissingComplaintId.set(null);
        this.closeDismissDecisionModal();
        this.closeDetailOverlay();
      },
      error: () => {
        this.dismissingComplaintId.set(null);
        this.error.set('Failed to dismiss the complaint. Please try again.');
      },
    });
  }

  private resolveAdminIdentifier(): number | string | null {
    const currentUserState = this.currentUser.user();
    const currentUserId = Number((currentUserState?.data as { id?: unknown } | undefined)?.id);
    if (Number.isFinite(currentUserId) && currentUserId > 0) {
      return currentUserId;
    }

    const keycloakNumericId = this.keycloakService.getNumericUserId();
    if (keycloakNumericId !== null) {
      return keycloakNumericId;
    }

    const keycloakUserId = this.keycloakService.getUserId();
    if (keycloakUserId && keycloakUserId.trim().length > 0) {
      return keycloakUserId;
    }

    this.error.set('Unable to determine admin id for this action.');
    return null;
  }
}
