import { Component, inject, OnInit , ChangeDetectorRef} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { MaintenanceService } from './services/maintenance.service';
import { EquipmentService } from '../services/equipment-service';
import { ReservationService } from '../reservation/services/reservation.service';
import { Maintenance as MaintenanceModel } from './models/maintenance.model';
import { EquipmentModel } from '../models/equipment.model';
import { MaintenanceStatus } from './models/maintenance-status.enum';

@Component({
  selector: 'app-maintenance',
  imports: [CommonModule, FormsModule, NzIconModule, NzDatePickerModule, NzTimePickerModule],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.css',
})
export class Maintenance implements OnInit {
  private maintenanceService = inject(MaintenanceService);
  private equipmentService = inject(EquipmentService);
  private reservationService = inject(ReservationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  equipmentId: number | null = null;
  equipment: EquipmentModel | null = null;
  maintenances: MaintenanceModel[] = [];
  loading = false;
  overlapError: string | null = null;
  overlapErrorEdit: string | null = null;
  isScheduling = false;
  isUpdating = false;

  // Modal states
  isScheduleModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  maintenanceToEdit: MaintenanceModel | null = null;
  maintenanceToDelete: MaintenanceModel | null = null;

  // Form data
  newMaintenance = {
    maintenanceDate: null as any,
    maintenanceTime: null as any,
    completionDate: null as any,
    completionTime: null as any,
    description: '',
    status: MaintenanceStatus.SCHEDULED
  };

  editMaintenance = {
    maintenanceDate: null as any,
    maintenanceTime: null as any,
    completionDate: null as any,
    completionTime: null as any,
    description: '',
    status: MaintenanceStatus.SCHEDULED
  };

  MaintenanceStatus = MaintenanceStatus;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.equipmentId = params['equipmentId'] ? +params['equipmentId'] : null;
      if (this.equipmentId) {
        this.loadEquipmentAndMaintenances();
      } else {
        this.router.navigate(['/equipment']);
      }
    });
  }

  loadEquipmentAndMaintenances(): void {
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
        this.loadMaintenances();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load equipment:', err);
      }
    });
  }

  loadMaintenances(): void {
    if (!this.equipmentId) return;

    this.maintenanceService.getMaintenanceByEquipmentId(this.equipmentId).subscribe({
      next: (data) => {
        this.maintenances = data;
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Loaded maintenances:', data);
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load maintenance records:', err);
        console.error('Error details:', err.error);
      }
    });
  }

  openScheduleModal(): void {
    this.newMaintenance = {
      maintenanceDate: null,
      maintenanceTime: null,
      completionDate: null,
      completionTime: null,
      description: '',
      status: MaintenanceStatus.SCHEDULED
    };
    this.overlapError = null;
    this.isScheduleModalOpen = true;
  }

  closeScheduleModal(): void {
    this.isScheduleModalOpen = false;
    this.overlapError = null;
  }

  clearScheduleError(): void {
    this.overlapError = null;
  }

  clearEditError(): void {
    this.overlapErrorEdit = null;
  }

  getScheduleValidationError(): string | null {
    if (!this.newMaintenance.maintenanceDate || !this.newMaintenance.maintenanceTime) {
      return null;
    }

    const maintenanceDateTime = this.combineDateAndTime(this.newMaintenance.maintenanceDate, this.newMaintenance.maintenanceTime);
    const completionDateTime = this.newMaintenance.completionDate && this.newMaintenance.completionTime 
      ? this.combineDateAndTime(this.newMaintenance.completionDate, this.newMaintenance.completionTime)
      : null;

    const startDate = new Date(maintenanceDateTime);
    if (Number.isNaN(startDate.getTime())) {
      return null;
    }

    const now = new Date();
    if (startDate <= now) {
      return 'Scheduled maintenance must start in the future.';
    }

    if (completionDateTime) {
      const endDate = new Date(completionDateTime);
      if (!Number.isNaN(endDate.getTime()) && startDate > endDate) {
        return 'Completion time must be after the start time.';
      }
    }

    return null;
  }

  getEditValidationError(): string | null {
    if (!this.editMaintenance.maintenanceDate || !this.editMaintenance.maintenanceTime) {
      return null;
    }

    const maintenanceDateTime = this.combineDateAndTime(this.editMaintenance.maintenanceDate, this.editMaintenance.maintenanceTime);
    const completionDateTime = this.editMaintenance.completionDate && this.editMaintenance.completionTime 
      ? this.combineDateAndTime(this.editMaintenance.completionDate, this.editMaintenance.completionTime)
      : null;

    const startDate = new Date(maintenanceDateTime);
    if (Number.isNaN(startDate.getTime())) {
      return null;
    }

    const now = new Date();
    if (startDate <= now) {
      return 'Scheduled maintenance must start in the future.';
    }

    if (completionDateTime) {
      const endDate = new Date(completionDateTime);
      if (!Number.isNaN(endDate.getTime()) && startDate > endDate) {
        return 'Completion time must be after the start time.';
      }
    }

    return null;
  }

  scheduleMaintenance(): void {
    if (this.isScheduling) return; // Prevent multiple clicks
    
    if (!this.equipment || !this.newMaintenance.maintenanceDate || !this.newMaintenance.maintenanceTime || !this.newMaintenance.description) {
      console.warn('Validation failed:', {
        hasEquipment: !!this.equipment,
        hasMaintenanceDate: !!this.newMaintenance.maintenanceDate,
        hasMaintenanceTime: !!this.newMaintenance.maintenanceTime,
        hasDescription: !!this.newMaintenance.description
      });
      this.overlapError = null;
      return;
    }

    this.isScheduling = true;

    // Combine date and time
    const maintenanceDateTime = this.combineDateAndTime(this.newMaintenance.maintenanceDate, this.newMaintenance.maintenanceTime);
    const completionDateTime = this.newMaintenance.completionDate && this.newMaintenance.completionTime 
      ? this.combineDateAndTime(this.newMaintenance.completionDate, this.newMaintenance.completionTime)
      : undefined;

    const startDate = new Date(maintenanceDateTime);
    const endDate = completionDateTime ? new Date(completionDateTime) : null;
    const now = new Date();
    if (startDate <= now) {
      this.overlapError = 'Scheduled maintenance must start in the future.';
      this.isScheduling = false;
      this.cdr.detectChanges();
      return;
    }

    if (endDate && startDate > endDate) {
      this.overlapError = 'Completion time must be after the start time.';
      this.isScheduling = false;
      this.cdr.detectChanges();
      return;
    }

    console.log('Schedule - Combined dates:', {
      maintenanceDateTime,
      completionDateTime,
      equipmentId: this.equipment!.id
    });

    // Check for overlapping maintenance before creating
    this.maintenanceService.checkAvailability(
      this.equipment.id!,
      maintenanceDateTime,
      completionDateTime || maintenanceDateTime
    ).subscribe({
      next: (overlap) => {
        if (overlap) {
          // There is an overlapping maintenance
          const overlapStartDate = new Date(overlap.maintenanceTime).toLocaleString();
          const overlapEndDate = overlap.maintenanceCompletionTime 
            ? new Date(overlap.maintenanceCompletionTime).toLocaleString()
            : 'Not specified';
          
          this.overlapError = `There is already a scheduled maintenance for this equipment from ${overlapStartDate} to ${overlapEndDate}. Please choose different dates.`;
          this.isScheduling = false;
          this.cdr.detectChanges();
          return;
        }

        // No maintenance overlap, now check for overlapping reservations
        this.reservationService.checkAvailability(
          this.equipment!.id!,
          maintenanceDateTime,
          completionDateTime || maintenanceDateTime
        ).subscribe({
          next: (reservationOverlap) => {
            if (reservationOverlap) {
              // There is an overlapping reservation
              const overlapStartDate = new Date(reservationOverlap.reservationDate).toLocaleDateString();
              const overlapEndDate = new Date(reservationOverlap.returnDate).toLocaleDateString();
              
              this.overlapError = `This equipment is already reserved from ${overlapStartDate} to ${overlapEndDate}. Please choose different dates.`;
              this.isScheduling = false;
              this.cdr.detectChanges();
              return;
            }

            // No overlaps, proceed with creating the maintenance
            this.overlapError = null;
            const maintenance: Omit<MaintenanceModel, 'id'> = {
              equipment: this.equipment!,
              maintenanceTime: maintenanceDateTime,
              maintenanceCompletionTime: completionDateTime,
              description: this.newMaintenance.description,
              status: this.newMaintenance.status
            };

            console.log('Sending maintenance:', maintenance);

            this.maintenanceService.create(maintenance).subscribe({
              next: (response) => {
                console.log('Maintenance created:', response);
                this.loadMaintenances();
                this.closeScheduleModal();
                this.isScheduling = false;
              },
              error: (err) => {
                console.error('Failed to schedule maintenance:', err);
                console.error('Error details:', err.error);
                this.isScheduling = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: (err) => {
            console.error('Error checking reservation availability:', err);
            this.overlapError = 'Error checking availability. Please try again.';
            this.isScheduling = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error checking maintenance availability:', err);
        this.overlapError = 'Error checking availability. Please try again.';
        this.isScheduling = false;
        this.cdr.detectChanges();
      }
    });
  }

  private combineDateAndTime(date: any, time: any): string {
    if (!date || !time) return '';
    
    let dateStr = '';
    
    // Handle date - extract as YYYY-MM-DD
    if (typeof date.format === 'function') {
      // It's a Day.js object from ng-zorro date picker
      dateStr = date.format('YYYY-MM-DD');
    } else if (date instanceof Date) {
      // It's a Date object - use local values to avoid timezone shift
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else if (typeof date === 'string') {
      // It's already a string
      dateStr = date;
    }
    
    let timeStr = '';
    if (typeof time.format === 'function') {
      // It's a Day.js object from ng-zorro time picker
      timeStr = time.format('HH:mm');
    } else if (time instanceof Date) {
      // It's a Date object
      const hours = String(time.getHours()).padStart(2, '0');
      const minutes = String(time.getMinutes()).padStart(2, '0');
      timeStr = `${hours}:${minutes}`;
    } else if (typeof time === 'string') {
      // It's already a string
      timeStr = time;
    }
    
    return `${dateStr}T${timeStr}`;
  }

  private splitDateAndTime(dateTimeString: string): { date: any; time: any } {
    if (!dateTimeString) return { date: null, time: null };
    
    const [datePart, timePart] = dateTimeString.split('T');
    
    // Parse date string (YYYY-MM-DD format) using local timezone
    const [year, month, day] = datePart.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Parse time string (HH:mm format)
    const [hours, minutes] = timePart.split(':').map(Number);
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    
    return { date, time };
  }

  openEditModal(maintenance: MaintenanceModel): void {
    this.maintenanceToEdit = { ...maintenance };
    this.overlapErrorEdit = null;
    
    // Split the datetime for editing
    const maintenanceSplit = this.splitDateAndTime(maintenance.maintenanceTime);
    let completionSplit = { date: null, time: null };
    
    if (maintenance.maintenanceCompletionTime) {
      completionSplit = this.splitDateAndTime(maintenance.maintenanceCompletionTime);
    }
    
    this.editMaintenance = {
      maintenanceDate: maintenanceSplit.date,
      maintenanceTime: maintenanceSplit.time,
      completionDate: completionSplit.date,
      completionTime: completionSplit.time,
      description: maintenance.description,
      status: maintenance.status
    };
    
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.maintenanceToEdit = null;
    this.overlapErrorEdit = null;
    this.editMaintenance = {
      maintenanceDate: null,
      maintenanceTime: null,
      completionDate: null,
      completionTime: null,
      description: '',
      status: MaintenanceStatus.SCHEDULED
    };
  }

  updateMaintenance(): void {
    if (this.isUpdating) return; // Prevent multiple clicks
    
    if (!this.maintenanceToEdit || !this.equipment) return;

    this.isUpdating = true;

    // Combine date and time
    const maintenanceDateTime = this.combineDateAndTime(this.editMaintenance.maintenanceDate, this.editMaintenance.maintenanceTime);
    const completionDateTime = this.editMaintenance.completionDate && this.editMaintenance.completionTime 
      ? this.combineDateAndTime(this.editMaintenance.completionDate, this.editMaintenance.completionTime)
      : maintenanceDateTime;

    const startDate = new Date(maintenanceDateTime);
    const endDate = completionDateTime ? new Date(completionDateTime) : null;
    const now = new Date();
    if (startDate <= now) {
      this.overlapErrorEdit = 'Scheduled maintenance must start in the future.';
      this.isUpdating = false;
      this.cdr.detectChanges();
      return;
    }

    if (endDate && startDate > endDate) {
      this.overlapErrorEdit = 'Completion time must be after the start time.';
      this.isUpdating = false;
      this.cdr.detectChanges();
      return;
    }

    console.log('Update - Combined dates:', {
      maintenanceDateTime,
      completionDateTime,
      equipmentId: this.equipment.id,
      currentMaintenanceId: this.maintenanceToEdit?.id
    });

    // Check for overlapping maintenance (excluding current maintenance)
    this.maintenanceService.checkAvailability(
      this.equipment.id!,
      maintenanceDateTime,
      completionDateTime
    ).subscribe({
      next: (overlap) => {
        console.log('Overlap check response:', overlap);
        
        if (overlap && overlap.id !== this.maintenanceToEdit?.id) {
          // There is an overlapping maintenance that's not the current one
          const overlapStartDate = new Date(overlap.maintenanceTime).toLocaleString();
          const overlapEndDate = overlap.maintenanceCompletionTime 
            ? new Date(overlap.maintenanceCompletionTime).toLocaleString()
            : 'Not specified';
          
          this.overlapErrorEdit = `There is already a scheduled maintenance for this equipment from ${overlapStartDate} to ${overlapEndDate}. Please choose different dates.`;
          this.isUpdating = false;
          this.cdr.detectChanges();
          return;
        }

        // No maintenance overlap, now check for overlapping reservations
        this.reservationService.checkAvailability(
          this.equipment!.id!,
          maintenanceDateTime,
          completionDateTime
        ).subscribe({
          next: (reservationOverlap) => {
            if (reservationOverlap) {
              // There is an overlapping reservation
              const overlapStartDate = new Date(reservationOverlap.reservationDate).toLocaleDateString();
              const overlapEndDate = new Date(reservationOverlap.returnDate).toLocaleDateString();
              
              this.overlapErrorEdit = `This equipment is already reserved from ${overlapStartDate} to ${overlapEndDate}. Please choose different dates.`;
              this.isUpdating = false;
              this.cdr.detectChanges();
              return;
            }

            // No overlaps, proceed with updating
            this.overlapErrorEdit = null;
            const updatedMaintenance: MaintenanceModel = {
              ...this.maintenanceToEdit!,
              maintenanceTime: maintenanceDateTime,
              maintenanceCompletionTime: completionDateTime,
              description: this.editMaintenance.description,
              status: this.editMaintenance.status
            };

            console.log('Updating maintenance:', updatedMaintenance);

            this.maintenanceService.update(updatedMaintenance).subscribe({
              next: (response) => {
                console.log('Maintenance updated:', response);
                this.loadMaintenances();
                this.closeEditModal();
                this.isUpdating = false;
              },
              error: (err) => {
                console.error('Failed to update maintenance:', err);
                console.error('Error details:', err.error);
                this.isUpdating = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: (err) => {
            console.error('Error checking reservation availability:', err);
            this.overlapErrorEdit = 'Error checking availability. Please try again.';
            this.isUpdating = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error checking maintenance availability:', err);
        this.overlapErrorEdit = 'Error checking availability. Please try again.';
        this.isUpdating = false;
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteModal(maintenance: MaintenanceModel): void {
    this.maintenanceToDelete = maintenance;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.maintenanceToDelete = null;
  }

  deleteMaintenance(): void {
    if (!this.maintenanceToDelete?.id) return;

    console.log('Deleting maintenance ID:', this.maintenanceToDelete.id);

    this.maintenanceService.delete(this.maintenanceToDelete.id).subscribe({
      next: () => {
        console.log('Maintenance deleted successfully');
        this.loadMaintenances();
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Failed to delete maintenance:', err);
        console.error('Error details:', err.error);
      }
    });
  }

  goBackToEquipment(): void {
    this.router.navigate(['/equipment']);
  }

  getStatusClass(status: MaintenanceStatus): string {
    switch (status) {
      case MaintenanceStatus.SCHEDULED:
        return 'status-scheduled';
      case MaintenanceStatus.IN_PROGRESS:
        return 'status-in-progress';
      case MaintenanceStatus.COMPLETED:
        return 'status-completed';
      case MaintenanceStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }
}
