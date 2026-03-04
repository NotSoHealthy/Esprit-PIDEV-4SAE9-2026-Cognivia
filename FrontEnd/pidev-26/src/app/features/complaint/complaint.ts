import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
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
  readonly showTimelineOverlay = signal(false);
  readonly timelineComplaint = signal<ComplaintModel | null>(null);
  readonly detailLoading = signal(false);
  readonly validatingComplaintId = signal<number | null>(null);
  readonly dismissingComplaintId = signal<number | null>(null);
  readonly investigatingComplaintId = signal<number | null>(null);
  readonly takingActionComplaintId = signal<number | null>(null);
  readonly showDismissDecisionModal = signal(false);
  readonly dismissDecision = signal('');
  readonly showTakeActionDecisionModal = signal(false);
  readonly takeActionDecision = signal('');
  readonly showAppealModal = signal(false);
  readonly appealMessage = signal('');
  readonly appealingComplaintId = signal<number | null>(null);
  readonly closingComplaintId = signal<number | null>(null);
  readonly detailSubmitterName = signal<string>('');
  readonly detailTargetName = signal<string>('');
  readonly sortBy = signal<'priority' | 'date'>('priority');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly selectedCategoryFilter = signal<ComplaintCategory | 'OTHER' | 'ALL'>('ALL');

  readonly ComplaintStatus = ComplaintStatus;
  readonly ComplaintPriority = ComplaintPriority;
  readonly ComplaintCategory = ComplaintCategory;
  readonly hasActionTakenReports = computed(() =>
    this.complaints().some((report) => report.status === ComplaintStatus.ACTION_TAKEN),
  );

  readonly availableCategories = computed(() => {
    const allCategories = Object.values(ComplaintCategory);
    const categoriesInUse = new Set(this.complaints().map((c) => c.category));
    const uniqueCategories: (ComplaintCategory | 'OTHER')[] = [];

    allCategories.forEach((cat) => {
      if (categoriesInUse.has(cat)) {
        uniqueCategories.push(cat);
      }
    });

    // Check if there are any "OTHER" categories (non-predefined)
    const hasOtherCategories = this.complaints().some(
      (c) => !allCategories.includes(c.category),
    );
    if (hasOtherCategories) {
      uniqueCategories.push('OTHER');
    }

    return uniqueCategories.sort((a, b) => {
      const labelA = a === 'OTHER' ? 'Other' : this.getCategoryLabel(a as ComplaintCategory);
      const labelB = b === 'OTHER' ? 'Other' : this.getCategoryLabel(b as ComplaintCategory);
      return labelA.localeCompare(labelB);
    });
  });

  readonly sortedComplaints = computed(() => {
    let complaints = [...this.complaints()];
    const categoryFilter = this.selectedCategoryFilter();

    // Apply category filter
    if (categoryFilter !== 'ALL') {
      if (categoryFilter === 'OTHER') {
        const predefinedCategories = Object.values(ComplaintCategory);
        complaints = complaints.filter((c) => !predefinedCategories.includes(c.category));
      } else {
        complaints = complaints.filter((c) => c.category === categoryFilter);
      }
    }

    // Apply sorting
    const sortBy = this.sortBy();
    const direction = this.sortDirection();

    complaints.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'priority') {
        compareValue = this.getPriorityIndex(a.priority) - this.getPriorityIndex(b.priority);
      } else if (sortBy === 'date') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        compareValue = dateA - dateB;
      }

      return direction === 'asc' ? compareValue : -compareValue;
    });

    return complaints;
  });

  readonly hasClosedReports = computed(() =>
    this.complaints().some((c) => c.status === ComplaintStatus.CLOSED),
  );

  readonly hasDismissedReports = computed(() =>
    this.complaints().some((c) => c.status === ComplaintStatus.DISMISSED),
  );

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
      case ComplaintStatus.APPEALED:
        return 'status-appealed';
      case ComplaintStatus.UNDER_INVESTIGATION:
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

  private getPriorityIndex(priority: ComplaintPriority): number {
    switch (priority) {
      case ComplaintPriority.URGENT:
        return 4;
      case ComplaintPriority.HIGH:
        return 3;
      case ComplaintPriority.MEDIUM:
        return 2;
      case ComplaintPriority.LOW:
        return 1;
      default:
        return 0;
    }
  }

  setSortBy(sortBy: 'priority' | 'date'): void {
    if (this.sortBy() === sortBy) {
      this.toggleSortDirection();
    } else {
      this.sortBy.set(sortBy);
      this.sortDirection.set('desc');
    }
  }

  toggleSortDirection(): void {
    this.sortDirection.update((current) => (current === 'asc' ? 'desc' : 'asc'));
  }

  setCategoryFilter(category: ComplaintCategory | 'OTHER' | 'ALL'): void {
    this.selectedCategoryFilter.set(category);
  }

  getRoleLabel(role: UserRole): string {
    return role.replace('ROLE_', '').charAt(0) + role.replace('ROLE_', '').slice(1).toLowerCase();
  }

  getPriorityClass(priority: ComplaintPriority): string {
    switch (priority) {
      case ComplaintPriority.URGENT:
        return 'priority-urgent';
      case ComplaintPriority.HIGH:
        return 'priority-high';
      case ComplaintPriority.MEDIUM:
        return 'priority-medium';
      case ComplaintPriority.LOW:
        return 'priority-low';
      default:
        return '';
    }
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
        this.closeDetailOverlay();
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

  openTimelineOverlay(complaint: ComplaintModel): void {
    this.timelineComplaint.set(complaint);
    this.showTimelineOverlay.set(true);
  }

  closeTimelineOverlay(): void {
    this.showTimelineOverlay.set(false);
    this.timelineComplaint.set(null);
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

  openTakeActionDecisionModal(): void {
    this.takeActionDecision.set('');
    this.error.set(null);
    this.showTakeActionDecisionModal.set(true);
  }

  closeTakeActionDecisionModal(): void {
    this.showTakeActionDecisionModal.set(false);
    this.takeActionDecision.set('');
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

  startInvestigation(): void {
    const complaint = this.selectedComplaint();
    if (!complaint) return;

    this.investigatingComplaintId.set(complaint.id!);
    this.error.set(null);

    this.complaintService.startInvestigation(complaint).subscribe({
      next: (updatedComplaint) => {
        this.complaints.update((complaints) =>
          complaints.map((c) => (c.id === complaint.id ? updatedComplaint : c)),
        );
        this.investigatingComplaintId.set(null);
        this.closeDetailOverlay();
      },
      error: () => {
        this.investigatingComplaintId.set(null);
        this.error.set('Failed to start investigation. Please try again.');
      },
    });
  }

  takeAction(): void {
    const complaint = this.selectedComplaint();
    const resolutionDecision = this.takeActionDecision().trim();
    if (!complaint) return;
    if (!resolutionDecision) {
      this.error.set('Resolution decision is required.');
      return;
    }

    this.takingActionComplaintId.set(complaint.id!);
    this.error.set(null);

    this.complaintService
      .takeAction({ ...complaint, resolutionDecision })
      .subscribe({
        next: (updatedComplaint) => {
          this.complaints.update((complaints) =>
            complaints.map((c) => (c.id === complaint.id ? updatedComplaint : c)),
          );
          this.takingActionComplaintId.set(null);
          this.closeTakeActionDecisionModal();
          this.closeDetailOverlay();
        },
        error: () => {
          this.takingActionComplaintId.set(null);
          this.error.set('Failed to take action on the report. Please try again.');
        },
      });
  }

  openAppealModal(): void {
    this.appealMessage.set('');
    this.error.set(null);
    this.showAppealModal.set(true);
  }

  closeAppealModal(): void {
    this.showAppealModal.set(false);
    this.appealMessage.set('');
  }

  appealComplaint(): void {
    const complaint = this.selectedComplaint();
    const message = this.appealMessage().trim();
    if (!complaint) return;
    if (!message) {
      this.error.set('Appeal message is required.');
      return;
    }

    this.appealingComplaintId.set(complaint.id!);
    this.error.set(null);

    this.complaintService
      .appealComplaint({ ...complaint, appealMessage: message })
      .subscribe({
        next: (updatedComplaint) => {
          this.complaints.update((complaints) =>
            complaints.map((c) => (c.id === complaint.id ? updatedComplaint : c)),
          );
          this.appealingComplaintId.set(null);
          this.closeAppealModal();
          this.closeDetailOverlay();
        },
        error: () => {
          this.appealingComplaintId.set(null);
          this.error.set('Failed to appeal the report. Please try again.');
        },
      });
  }

  closeReportComplaint(): void {
    const complaint = this.selectedComplaint();
    if (!complaint) return;

    this.closingComplaintId.set(complaint.id!);
    this.error.set(null);

    this.complaintService.closeComplaint(complaint).subscribe({
      next: (updatedComplaint) => {
        this.complaints.update((complaints) =>
          complaints.map((c) => (c.id === complaint.id ? updatedComplaint : c)),
        );
        this.closingComplaintId.set(null);
        this.closeDetailOverlay();
      },
      error: () => {
        this.closingComplaintId.set(null);
        this.error.set('Failed to close the report. Please try again.');
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
