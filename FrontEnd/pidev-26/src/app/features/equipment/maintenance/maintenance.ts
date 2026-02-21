import { Component, inject, OnInit , ChangeDetectorRef} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { MaintenanceService } from './services/maintenance.service';
import { EquipmentService } from '../services/equipment-service';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  equipmentId: number | null = null;
  equipment: EquipmentModel | null = null;
  maintenances: MaintenanceModel[] = [];
  loading = false;

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
    this.isScheduleModalOpen = true;
  }

  closeScheduleModal(): void {
    this.isScheduleModalOpen = false;
  }

  scheduleMaintenance(): void {
    if (!this.equipment || !this.newMaintenance.maintenanceDate || !this.newMaintenance.maintenanceTime || !this.newMaintenance.description) {
      console.warn('Validation failed:', {
        hasEquipment: !!this.equipment,
        hasMaintenanceDate: !!this.newMaintenance.maintenanceDate,
        hasMaintenanceTime: !!this.newMaintenance.maintenanceTime,
        hasDescription: !!this.newMaintenance.description
      });
      return;
    }

    // Combine date and time
    const maintenanceDateTime = this.combineDateAndTime(this.newMaintenance.maintenanceDate, this.newMaintenance.maintenanceTime);
    const completionDateTime = this.newMaintenance.completionDate && this.newMaintenance.completionTime 
      ? this.combineDateAndTime(this.newMaintenance.completionDate, this.newMaintenance.completionTime)
      : undefined;

    const maintenance: Omit<MaintenanceModel, 'id'> = {
      equipment: this.equipment,
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
      },
      error: (err) => {
        console.error('Failed to schedule maintenance:', err);
        console.error('Error details:', err.error);
      }
    });
  }

  private combineDateAndTime(date: any, time: any): string {
    if (!date || !time) return '';
    
    const datePart = new Date(date).toISOString().split('T')[0];
    
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
    
    return `${datePart}T${timeStr}`;
  }

  openEditModal(maintenance: MaintenanceModel): void {
    this.maintenanceToEdit = { ...maintenance };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.maintenanceToEdit = null;
  }

  updateMaintenance(): void {
    if (!this.maintenanceToEdit) return;

    console.log('Updating maintenance:', this.maintenanceToEdit);

    this.maintenanceService.update(this.maintenanceToEdit).subscribe({
      next: (response) => {
        console.log('Maintenance updated:', response);
        this.loadMaintenances();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Failed to update maintenance:', err);
        console.error('Error details:', err.error);
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
