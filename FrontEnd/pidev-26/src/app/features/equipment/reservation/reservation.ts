import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { ReservationService } from './services/reservation.service';
import { EquipmentService } from '../services/equipment-service';
import { MaintenanceService } from '../maintenance/services/maintenance.service';
import { ReservationModel } from './model/reservation.model';
import { EquipmentModel } from '../models/equipment.model';
import { ReservationStatus } from './model/reservation-status.enum';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { CurrentUserService } from '../../../core/user/current-user.service';
import { KeycloakService } from '../../../core/auth/keycloak.service';

@Component({
  selector: 'app-reservation',
  imports: [CommonModule, FormsModule, NzIconModule, NzDatePickerModule],
  templateUrl: './reservation.html',
  styleUrl: './reservation.css',
})
export class Reservation implements OnInit {
  private http = inject(HttpClient);
  private apiBaseUrl = inject(API_BASE_URL);
  private currentUser = inject(CurrentUserService);
  private keycloakService = inject(KeycloakService);
  private reservationService = inject(ReservationService);
  private equipmentService = inject(EquipmentService);
  private maintenanceService = inject(MaintenanceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  equipmentId: number | null = null;
  equipment: EquipmentModel | null = null;
  reservations: ReservationModel[] = [];
  loading = false;
  patientNameById: Record<number, string> = {};
  assignedByNameByKey: Record<string, string> = {};

  isAssignModalOpen = false;
  assignStep: 'patient' | 'dates' = 'patient';
  isLoadingPatients = false;
  patients: any[] = [];
  patientSearch = '';
  selectedPatient: any | null = null;
  reservationDate: any = null;
  returnDate: any = null;
  assignError: string | null = null;
  isAssigning = false;
  openDropdownId: number | null = null;

  // Edit reservation properties
  isEditModalOpen = false;
  isEditPatientSelectOpen = false;
  reservationToEdit: ReservationModel | null = null;
  editSelectedPatient: any | null = null;
  editPatientSearch = '';
  editReservationDate: any = null;
  editReturnDate: any = null;
  editError: string | null = null;
  isEditing = false;

  ReservationStatus = ReservationStatus;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.equipmentId = params['equipmentId'] ? +params['equipmentId'] : null;
      if (this.equipmentId) {
        this.loadEquipmentAndReservations();
      } else {
        this.router.navigate(['/equipment']);
      }
    });
  }

  loadEquipmentAndReservations(): void {
    if (!this.equipmentId) return;

    this.loading = true;
    this.equipmentService.getAll().subscribe({
      next: (equipments) => {
        this.equipment = equipments.find(eq => eq.id === this.equipmentId) || null;
        if (!this.equipment) {
          console.error('Equipment not found with ID:', this.equipmentId);
          this.loading = false;
          return;
        }
        this.loadReservations();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load equipment:', err);
      }
    });
  }

  loadReservations(): void {
    if (!this.equipmentId) return;

    this.reservationService.getReservationsByEquipmentId(this.equipmentId).subscribe({
      next: (data) => {
        this.reservations = data;
        this.ensurePatientNames();
        this.ensureAssignerNames();
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Loaded reservations:', data);
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load reservations:', err);
        console.error('Error details:', err.error);
      }
    });
  }

  private ensurePatientNames(): void {
    this.reservations.forEach((reservation) => {
      const patientId = reservation.patientId;
      if (!patientId || this.patientNameById[patientId]) return;

      this.http.get<any>(`${this.apiBaseUrl}/care/patient/${patientId}`).subscribe({
        next: (data) => {
          const firstName = String(data?.firstName ?? '').trim();
          const lastName = String(data?.lastName ?? '').trim();
          const name = [firstName, lastName].filter(Boolean).join(' ');
          this.patientNameById[patientId] = name || `Patient ${patientId}`;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load patient:', err);
          this.patientNameById[patientId] = `Patient ${patientId}`;
        }
      });
    });
  }

  getPatientName(patientId: number): string {
    return this.patientNameById[patientId] ?? `Patient ${patientId}`;
  }

  private ensureAssignerNames(): void {
    this.reservations.forEach((reservation) => {
      const role = reservation.userRoleAssignedBy;
      const id = reservation.userIdAssignedBy;
      if (!role || !id) return;

      const key = `${role}:${id}`;
      if (this.assignedByNameByKey[key]) return;

      const endpoint = this.getAssignerEndpoint(role, id);
      if (!endpoint) {
        this.assignedByNameByKey[key] = `User ${id}`;
        return;
      }

      this.http.get<any>(endpoint).subscribe({
        next: (data) => {
          const firstName = String(data?.firstName ?? '').trim();
          const lastName = String(data?.lastName ?? '').trim();
          const name = [firstName, lastName].filter(Boolean).join(' ');
          this.assignedByNameByKey[key] = name || `User ${id}`;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load assigned-by user:', err);
          this.assignedByNameByKey[key] = `User ${id}`;
        }
      });
    });
  }

  private getAssignerEndpoint(role: string, id: string | number): string | null {
    if (role === 'ROLE_DOCTOR') {
      return `${this.apiBaseUrl}/care/doctor/${id}`;
    }

    if (role === 'ROLE_CAREGIVER') {
      return `${this.apiBaseUrl}/care/caregiver/${id}`;
    }

    return null;
  }

  getAssignerName(reservation: ReservationModel): string {
    const role = reservation.userRoleAssignedBy;
    const id = reservation.userIdAssignedBy;
    if (!role || !id) return 'User';
    const key = `${role}:${id}`;
    return this.assignedByNameByKey[key] ?? `User ${id}`;
  }

  goBackToEquipment(): void {
    this.router.navigate(['/equipment']);
  }

  openAssignModal(): void {
    this.isAssignModalOpen = true;
    this.assignStep = 'patient';
    this.assignError = null;
    this.selectedPatient = null;
    this.patientSearch = '';
    this.reservationDate = null;
    this.returnDate = null;

    if (!this.patients.length) {
      this.fetchPatients();
    }
  }

  closeAssignModal(): void {
    this.isAssignModalOpen = false;
    this.assignError = null;
  }

  fetchPatients(): void {
    this.isLoadingPatients = true;
    this.http.get<any[]>(`${this.apiBaseUrl}/care/patient`).subscribe({
      next: (data) => {
        this.patients = Array.isArray(data) ? data : [];
        this.isLoadingPatients = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load patients:', err);
        this.isLoadingPatients = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredPatients(): any[] {
    const q = this.patientSearch.trim().toLowerCase();
    if (!q) return this.patients;

    return this.patients.filter((patient) => {
      const firstName = String(patient?.firstName ?? '').toLowerCase();
      const lastName = String(patient?.lastName ?? '').toLowerCase();
      const id = String(patient?.id ?? '').toLowerCase();
      return firstName.includes(q) || lastName.includes(q) || id.includes(q);
    });
  }

  selectPatient(patient: any): void {
    this.selectedPatient = patient;
    this.assignError = null;
  }

  goToDateStep(): void {
    if (!this.selectedPatient) return;
    this.assignStep = 'dates';
  }

  goToPatientStep(): void {
    this.assignStep = 'patient';
  }

  clearAssignError(): void {
    this.assignError = null;
  }

  getAssignValidationError(): string | null {
    if (!this.reservationDate || !this.returnDate) {
      return 'Reservation and return dates are required.';
    }

    const reservationDate = this.parseDateOnly(this.reservationDate);
    const returnDate = this.parseDateOnly(this.returnDate);
    if (!reservationDate || !returnDate) {
      return 'Invalid reservation dates.';
    }

    const now = new Date();
    if (reservationDate <= now) {
      return 'Reservation date must be in the future.';
    }

    if (reservationDate > returnDate) {
      return 'Return date must be after the reservation date.';
    }

    return null;
  }

  assignReservation(): void {
    if (this.isAssigning || !this.selectedPatient || !this.equipment) return;

    const validationError = this.getAssignValidationError();
    if (validationError) {
      this.assignError = validationError;
      return;
    }

    const userId = (this.currentUser.user()?.data as any)?.id;
    if (!userId) {
      this.assignError = 'Unable to determine the current user.';
      return;
    }

    const userRole = this.keycloakService.getUserRole();
    if (!userRole) {
      this.assignError = 'Unable to determine the current user role.';
      return;
    }

    const reservationDate = this.combineDateWithMidnight(this.reservationDate);
    const returnDate = this.combineDateWithMidnight(this.returnDate);

    this.isAssigning = true;
    this.assignError = null;

    // Check for overlapping maintenance before creating the reservation
    this.maintenanceService.checkAvailability(
      this.equipment.id!,
      reservationDate,
      returnDate
    ).subscribe({
      next: (maintenanceOverlap) => {
        if (maintenanceOverlap) {
          // There is an overlapping maintenance
          const overlapStartDate = new Date(maintenanceOverlap.maintenanceTime).toLocaleString();
          const overlapEndDate = maintenanceOverlap.maintenanceCompletionTime 
            ? new Date(maintenanceOverlap.maintenanceCompletionTime).toLocaleString()
            : 'Not specified';
          
          this.assignError = `There is scheduled maintenance for this equipment from ${overlapStartDate} to ${overlapEndDate}. Please choose different dates.`;
          this.isAssigning = false;
          this.cdr.detectChanges();
          return;
        }

        // No maintenance overlap, now check for overlapping reservations
        this.reservationService.checkAvailability(
          this.equipment!.id!,
          reservationDate,
          returnDate
        ).subscribe({
          next: (reservationOverlap) => {
            if (reservationOverlap) {
              // There is an overlapping reservation
              const overlapStartDate = new Date(reservationOverlap.reservationDate).toLocaleDateString();
              const overlapEndDate = new Date(reservationOverlap.returnDate).toLocaleDateString();
              
              this.assignError = `This equipment is already reserved from ${overlapStartDate} to ${overlapEndDate}. Please choose different dates.`;
              this.isAssigning = false;
              this.cdr.detectChanges();
              return;
            }

            // No overlaps, proceed with creating the reservation
            const payload: Omit<ReservationModel, 'id'> = {
              patientId: this.selectedPatient!.id,
              equipment: this.equipment!,
              reservationDate,
              returnDate,
              status: ReservationStatus.SCHEDULED,
              userIdAssignedBy: userId,
              userRoleAssignedBy: userRole,
            };

            this.reservationService.create(payload).subscribe({
              next: () => {
                this.isAssigning = false;
                this.closeAssignModal();
                this.loadReservations();
              },
              error: (err) => {
                console.error('Failed to assign reservation:', err);
                this.assignError = 'Failed to assign reservation. Please try again.';
                this.isAssigning = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: (err) => {
            console.error('Error checking reservation availability:', err);
            this.assignError = 'Error checking availability. Please try again.';
            this.isAssigning = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error checking maintenance availability:', err);
        this.assignError = 'Error checking availability. Please try again.';
        this.isAssigning = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleDropdown(reservationId: number | undefined): void {
    if (reservationId === undefined || reservationId === null) return;
    this.openDropdownId = this.openDropdownId === reservationId ? null : reservationId;
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }

  deleteReservation(reservation: ReservationModel): void {
    if (!reservation.id) return;

    this.reservationService.delete(reservation.id).subscribe({
      next: () => {
        this.closeDropdown();
        this.loadReservations();
      },
      error: (err) => {
        console.error('Failed to delete reservation:', err);
        this.assignError = 'Failed to delete reservation. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  private combineDateOnly(date: any): string {
    if (!date) return '';

    if (typeof date.format === 'function') {
      return date.format('YYYY-MM-DD');
    }

    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    if (typeof date === 'string') {
      return date;
    }

    return '';
  }

  private parseDateOnly(date: any): Date | null {
    const value = this.combineDateOnly(date);
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  private combineDateWithMidnight(date: any): string {
    const value = this.combineDateOnly(date);
    if (!value) return '';
    return `${value}T00:00:00`;
  }

  getStatusClass(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.ACTIVE:
        return 'status-active';
      case ReservationStatus.RETURNED:
        return 'status-returned';
      case ReservationStatus.SCHEDULED:
        return 'status-scheduled';
      default:
        return '';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getReservationDuration(reservation: ReservationModel): string {
    const start = new Date(reservation.reservationDate);
    const end = new Date(reservation.returnDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  }

  openEditModal(reservation: ReservationModel): void {
    this.reservationToEdit = reservation;
    this.isEditModalOpen = true;
    this.editError = null;
    this.editPatientSearch = '';

    // Parse and pre-populate with current dates
    const reservationDateStr = reservation.reservationDate.split('T')[0];
    const returnDateStr = reservation.returnDate.split('T')[0];
    
    const [resYear, resMonth, resDay] = reservationDateStr.split('-').map(Number);
    const [retYear, retMonth, retDay] = returnDateStr.split('-').map(Number);
    
    this.editReservationDate = new Date(resYear, resMonth - 1, resDay);
    this.editReturnDate = new Date(retYear, retMonth - 1, retDay);

    // Pre-populate with current patient
    if (this.patients.length > 0) {
      const currentPatient = this.patients.find(p => p.id === reservation.patientId);
      this.editSelectedPatient = currentPatient || null;
    } else {
      // If patients not loaded yet, fetch them first
      this.http.get<any[]>(`${this.apiBaseUrl}/care/patient`).subscribe({
        next: (data) => {
          this.patients = Array.isArray(data) ? data : [];
          const currentPatient = this.patients.find(p => p.id === reservation.patientId);
          this.editSelectedPatient = currentPatient || null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load patients:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editError = null;
    this.reservationToEdit = null;
  }

  get editFilteredPatients(): any[] {
    const q = this.editPatientSearch.trim().toLowerCase();
    if (!q) return this.patients;

    return this.patients.filter((patient) => {
      const firstName = String(patient?.firstName ?? '').toLowerCase();
      const lastName = String(patient?.lastName ?? '').toLowerCase();
      const id = String(patient?.id ?? '').toLowerCase();
      return firstName.includes(q) || lastName.includes(q) || id.includes(q);
    });
  }

  selectEditPatient(patient: any): void {
    this.editSelectedPatient = patient;
    this.isEditPatientSelectOpen = false;
    this.editError = null;
  }

  clearEditError(): void {
    this.editError = null;
  }

  getEditValidationError(): string | null {
    if (!this.editReservationDate || !this.editReturnDate) {
      return 'Reservation and return dates are required.';
    }

    const reservationDate = this.parseDateOnly(this.editReservationDate);
    const returnDate = this.parseDateOnly(this.editReturnDate);
    if (!reservationDate || !returnDate) {
      return 'Invalid reservation dates.';
    }

    const now = new Date();
    if (reservationDate <= now) {
      return 'Reservation date must be in the future.';
    }

    if (reservationDate > returnDate) {
      return 'Return date must be after the reservation date.';
    }

    return null;
  }

  updateReservation(): void {
    if (this.isEditing || !this.editSelectedPatient || !this.reservationToEdit || !this.equipment) return;

    const validationError = this.getEditValidationError();
    if (validationError) {
      this.editError = validationError;
      return;
    }

    const editReservationDate = this.combineDateWithMidnight(this.editReservationDate);
    const editReturnDate = this.combineDateWithMidnight(this.editReturnDate);

    this.isEditing = true;
    this.editError = null;

    // Check for overlapping maintenance
    this.maintenanceService.checkAvailability(
      this.equipment.id!,
      editReservationDate,
      editReturnDate
    ).subscribe({
      next: (maintenanceOverlap) => {
        if (maintenanceOverlap) {
          const overlapStartDate = new Date(maintenanceOverlap.maintenanceTime).toLocaleString();
          const overlapEndDate = maintenanceOverlap.maintenanceCompletionTime 
            ? new Date(maintenanceOverlap.maintenanceCompletionTime).toLocaleString()
            : 'Not specified';
          
          this.editError = `There is scheduled maintenance from ${overlapStartDate} to ${overlapEndDate}. Please choose different dates.`;
          this.isEditing = false;
          this.cdr.detectChanges();
          return;
        }

        // Check for overlapping reservations (excluding current reservation)
        this.reservationService.checkAvailability(
          this.equipment!.id!,
          editReservationDate,
          editReturnDate
        ).subscribe({
          next: (reservationOverlap) => {
            if (reservationOverlap && reservationOverlap.id !== this.reservationToEdit?.id) {
              const overlapStartDate = new Date(reservationOverlap.reservationDate).toLocaleDateString();
              const overlapEndDate = new Date(reservationOverlap.returnDate).toLocaleDateString();
              
              this.editError = `This equipment is already reserved from ${overlapStartDate} to ${overlapEndDate}. Please choose different dates.`;
              this.isEditing = false;
              this.cdr.detectChanges();
              return;
            }

            // No overlaps, proceed with updating
            const updatedReservation: ReservationModel = {
              ...this.reservationToEdit!,
              patientId: this.editSelectedPatient.id,
              reservationDate: editReservationDate,
              returnDate: editReturnDate,
            };

            this.reservationService.update(updatedReservation).subscribe({
              next: () => {
                this.isEditing = false;
                this.closeEditModal();
                this.loadReservations();
              },
              error: (err) => {
                console.error('Failed to update reservation:', err);
                this.editError = 'Failed to update reservation. Please try again.';
                this.isEditing = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: (err) => {
            console.error('Error checking reservation availability:', err);
            this.editError = 'Error checking availability. Please try again.';
            this.isEditing = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error checking maintenance availability:', err);
        this.editError = 'Error checking availability. Please try again.';
        this.isEditing = false;
        this.cdr.detectChanges();
      }
    });
  }
}

