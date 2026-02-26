import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { EquipmentService } from './services/equipment-service';
import { MaintenanceService } from './maintenance/services/maintenance.service';
import { EquipmentModel } from './models/equipment.model';
import { Maintenance } from './maintenance/models/maintenance.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap, forkJoin } from 'rxjs';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.html',
  imports: [CommonModule, FormsModule, NzIconModule],
  styleUrls: ['./equipment.css']
})
export class Equipment implements OnInit {
  equipments: EquipmentModel[] = [];
  closestMaintenanceMap: Map<number, Maintenance | null> = new Map();
  hoveredEquipmentId: number | null = null;
  hoveredDetailEquipmentId: number | null = null;
  isModalOpen = false;
  isDeleteModalOpen = false;
  isBulkDeleteModalOpen = false;
  isDetailModalOpen = false;
  isEditMode = false;
  editingEquipmentId: number | null = null;
  equipmentToDelete: EquipmentModel | null = null;
  equipmentToDetail: EquipmentModel | null = null;
  isSaving = false;
  formError = '';
  deleteError = '';
  bulkDeleteError = '';
  selectedIds = new Set<number>();
  selectedImage: File | null = null;
  imagePreview = '';
  openDropdownId: number | null = null;
  newEquipment: Omit<EquipmentModel, 'id'> = {
    name: '',
    description: '',
    status: 'AVAILABLE',
    conditionScore: 0,
    imageUrl: ''
  };

  constructor(
    private equipmentService: EquipmentService,
    private maintenanceService: MaintenanceService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEquipments();
    console.log('Equipments loaded:', this.equipments);
  }

  loadEquipments(): void {
    this.equipmentService.getAll().subscribe(data => {
      this.equipments = data;
      this.clearSelection();
      this.closestMaintenanceMap.clear();
      
      // Fetch closest maintenance for equipments with MAINTENANCE status
      const maintenanceRequests = data
        .filter(eq => eq.status === 'MAINTENANCE')
        .map(eq => 
          this.maintenanceService.getClosestMaintenance(eq.id).subscribe({
            next: (maintenance) => {
              this.closestMaintenanceMap.set(eq.id, maintenance);
              console.log(`Closest maintenance for ${eq.name}:`, maintenance);
            },
            error: (err) => {
              console.error(`Failed to fetch closest maintenance for equipment ${eq.id}:`, err);
              this.closestMaintenanceMap.set(eq.id, null);
            }
          })
        );
      
      this.cdr.detectChanges();
      for (let eq of this.equipments) {
        console.log(`Equipment: ${eq.name}, Condition Score: ${eq.conditionScore}`);
      }
    });
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  toggleSelection(equipment: EquipmentModel, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.selectedIds.add(equipment.id);
    } else {
      this.selectedIds.delete(equipment.id);
    }
  }

  toggleSelectAll(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.equipments.forEach((equipment) => this.selectedIds.add(equipment.id));
    } else {
      this.clearSelection();
    }
  }

  openModal(): void {
    this.isEditMode = false;
    this.editingEquipmentId = null;
    this.formError = '';
    this.selectedImage = null;
    this.imagePreview = '';
    this.isModalOpen = true;
  }

  openEditModal(equipment: EquipmentModel): void {
    this.isEditMode = true;
    this.editingEquipmentId = equipment.id;
    this.newEquipment = {
      name: equipment.name,
      description: equipment.description,
      status: equipment.status,
      conditionScore: equipment.conditionScore,
      imageUrl: equipment.imageUrl
    };
    this.imagePreview = equipment.imageUrl;
    this.selectedImage = null;
    this.formError = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSaving = false;
    this.isEditMode = false;
    this.editingEquipmentId = null;
    this.resetForm();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedImage = null;
      this.imagePreview = '';
      return;
    }

    this.selectedImage = input.files[0];
    this.imagePreview = URL.createObjectURL(this.selectedImage);
  }

  submitEquipment(): void {
    if (this.isSaving) {
      return;
    }

    this.formError = '';

    if (!this.isEditMode && !this.selectedImage) {
      this.formError = 'Please select an image for the equipment.';
      return;
    }

    if (this.newEquipment.conditionScore > 100) {
      this.formError = 'Condition score cannot exceed 100.';
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.editingEquipmentId !== null) {
      // Edit mode: only upload new image if one was selected
      if (this.selectedImage) {
        this.equipmentService
          .uploadImage(this.selectedImage)
          .pipe(
            switchMap((imageUrl) =>
              this.equipmentService.update({
                id: this.editingEquipmentId!,
                ...this.newEquipment,
                imageUrl
              })
            )
          )
          .subscribe({
            next: () => {
              this.isSaving = false;
              this.closeModal();
              this.loadEquipments();
            },
            error: () => {
              this.isSaving = false;
              this.formError = 'Unable to update equipment right now. Please try again.';
            }
          });
      } else {
        // No new image selected, update without changing image
        this.equipmentService.update({
          id: this.editingEquipmentId,
          ...this.newEquipment
        }).subscribe({
          next: () => {
            this.isSaving = false;
            this.closeModal();
            this.loadEquipments();
          },
          error: () => {
            this.isSaving = false;
            this.formError = 'Unable to update equipment right now. Please try again.';
          }
        });
      }
    } else {
      // Add mode
      this.equipmentService
        .uploadImage(this.selectedImage!)
        .pipe(
          switchMap((imageUrl) =>
            this.equipmentService.create({
              ...this.newEquipment,
              imageUrl
            })
          )
        )
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.closeModal();
            this.loadEquipments();
          },
          error: () => {
            this.isSaving = false;
            this.formError = 'Unable to add equipment right now. Please try again.';
          }
        });
    }
  }

  openDeleteModal(equipment: EquipmentModel): void {
    this.deleteError = '';
    this.equipmentToDelete = equipment;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.equipmentToDelete = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.equipmentToDelete) {
      return;
    }

    this.equipmentService.delete(this.equipmentToDelete.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadEquipments();
      },
      error: () => {
        this.deleteError = 'Unable to delete equipment right now. Please try again.';
      }
    });
  }

  openBulkDeleteModal(): void {
    this.bulkDeleteError = '';
    this.isBulkDeleteModalOpen = true;
  }

  closeBulkDeleteModal(): void {
    this.isBulkDeleteModalOpen = false;
    this.bulkDeleteError = '';
  }

  confirmBulkDelete(): void {
    if (this.selectedIds.size === 0) {
      return;
    }

    const deleteRequests = Array.from(this.selectedIds).map((id) => this.equipmentService.delete(id));
    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.closeBulkDeleteModal();
        this.loadEquipments();
      },
      error: () => {
        this.bulkDeleteError = 'Unable to delete selected equipment right now. Please try again.';
      }
    });
  }

  private resetForm(): void {
    this.newEquipment = {
      name: '',
      description: '',
      status: 'AVAILABLE',
      conditionScore: 0,
      imageUrl: ''
    };
    this.selectedImage = null;
    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
    }
    this.imagePreview = '';
  }

  private clearSelection(): void {
    this.selectedIds.clear();
  }

  toggleDropdown(equipmentId: number): void {
    if (this.openDropdownId === equipmentId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = equipmentId;
    }
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Close dropdown if click is outside of dropdown container
    if (!target.closest('.dropdown-container')) {
      this.closeDropdown();
    }
  }

  openDetailModal(equipment: EquipmentModel): void {
    this.equipmentToDetail = equipment;
    this.hoveredDetailEquipmentId = null;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.equipmentToDetail = null;
    this.hoveredDetailEquipmentId = null;
  }

  viewMaintenance(equipment: EquipmentModel): void {
    this.closeDetailModal();
    this.router.navigate(['/equipment/maintenance'], {
      queryParams: { equipmentId: equipment.id }
    });
  }

  viewReservations(equipment: EquipmentModel): void {
    this.closeDetailModal();
    this.router.navigate(['/equipment/reservation'], {
      queryParams: { equipmentId: equipment.id }
    });
  }

  onStatusHover(equipmentId: number): void {
    this.hoveredEquipmentId = equipmentId;
  }

  onStatusLeave(): void {
    this.hoveredEquipmentId = null;
  }

  onDetailStatusHover(equipmentId: number): void {
    this.hoveredDetailEquipmentId = equipmentId;
  }

  onDetailStatusLeave(): void {
    this.hoveredDetailEquipmentId = null;
  }

  getClosestMaintenanceForEquipment(equipmentId: number): Maintenance | null {
    return this.closestMaintenanceMap.get(equipmentId) || null;
  }

  shouldShowMaintenanceTooltip(equipmentId: number): boolean {
    return this.hoveredEquipmentId === equipmentId && !!this.getClosestMaintenanceForEquipment(equipmentId);
  }

  shouldShowMaintenanceTooltipDetail(equipmentId: number): boolean {
    return this.hoveredDetailEquipmentId === equipmentId && !!this.getClosestMaintenanceForEquipment(equipmentId);
  }
}
