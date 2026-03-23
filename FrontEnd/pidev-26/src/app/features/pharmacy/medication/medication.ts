import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, of, switchMap } from 'rxjs';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule, NZ_ICONS } from 'ng-zorro-antd/icon';
import { PictureOutline, UploadOutline, PlusOutline } from '@ant-design/icons-angular/icons';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';

import { PharmacyService } from '../services/pharmacy.service';
import { MedicationService } from '../services/medication.service';
import { Pharmacy } from '../models/pharmacy.model';
import { MedicationModel } from '../models/medication.model';

// Front-end enum (mirror backend)
export enum TherapeuticClass {
  CHOLINESTERASE_INHIBITOR = 'CHOLINESTERASE_INHIBITOR',
  NMDA_RECEPTOR_ANTAGONIST = 'NMDA_RECEPTOR_ANTAGONIST',
  ANTI_AMYLOID_MONOCLONAL_ANTIBODY = 'ANTI_AMYLOID_MONOCLONAL_ANTIBODY',
  COMBINATION_PRODUCT = 'COMBINATION_PRODUCT'
}

// Adjust this to match your backend create DTO
export type NewMedication = {
  name: string;
  medicationStatus?: 'PENDING' | 'ACCEPTED' | string;
  description?: string;
  therapeuticClass: TherapeuticClass;
  pharmacyId: number;
};

@Component({
  selector: 'app-medication',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    NzFloatButtonModule,
    NzCardModule,
    NzPaginationModule,

    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzRadioModule,
    NzUploadModule

  ],
  providers: [
    {
      provide: NZ_ICONS,
      useValue: [
        PictureOutline,
        UploadOutline,
        PlusOutline
      ]
    }
  ],
  templateUrl: './medication.html',
  styleUrl: './medication.css'
})
export class Medication implements OnInit, OnChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pharmacyService = inject(PharmacyService);
  private readonly medicationService = inject(MedicationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);

  @Input() embedded = false;
  @Input() pharmacyIdInput: number | null = null;
  @Input() searchText = '';
  @Input() therapeuticClassFilter = '';
  @Input() selectedMedicationName = '';
  @Input() outOfStockOnly = false;
  @Input() showFloatingAddButton = true;
  @Input() showAIButton = false; // New: show AI button in medication cards
  @Output() medicationsChange = new EventEmitter<MedicationModel[]>();
  @Output() aiButtonClicked = new EventEmitter<MedicationModel>(); // New: emit when AI button is clicked

  pharmacyId: string | null = null;
  pharmacy: Pharmacy | null = null;
  medications: MedicationModel[] = [];
  loading = false;
  loadingMedications = false;
  errorMsg: string | null = null;

  // ---------------- Modal + Form ----------------
  isAddModalOpen = false;
  isDetailsModalOpen = false;
  submitting = false;
  isEditMode = false;
  createStatus: 'PENDING' | 'ACCEPTED' = 'ACCEPTED';
  editingMedicationId: number | null = null;
  selectedMedication: MedicationModel | null = null;
  pageIndex = 1;
  pageSize = 8;

  therapeuticOptions = [
    { label: 'Cholinesterase Inhib.', value: TherapeuticClass.CHOLINESTERASE_INHIBITOR },
    { label: 'NMDA Antagonist', value: TherapeuticClass.NMDA_RECEPTOR_ANTAGONIST },
    { label: 'Anti-Amyloid mAb', value: TherapeuticClass.ANTI_AMYLOID_MONOCLONAL_ANTIBODY },
    { label: 'Combination', value: TherapeuticClass.COMBINATION_PRODUCT }
  ];

  // Upload state
  fileList: NzUploadFile[] = [];
  selectedImageFile: File | null = null;
  photoTouched = false;

  addForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    therapeuticClass: [TherapeuticClass.CHOLINESTERASE_INHIBITOR, [Validators.required]]
  });

  get photoMissing(): boolean {
    return this.photoTouched && !this.selectedImageFile;
  }

  get filteredMedications(): MedicationModel[] {
    let filtered = [...this.medications];

    if (this.searchText.trim()) {
      const query = this.searchText.toLowerCase();
      filtered = filtered.filter((medication) =>
        medication.name?.toLowerCase().includes(query)
      );
    }

    if (this.therapeuticClassFilter) {
      filtered = filtered.filter(
        (medication) => medication.therapeuticClass === this.therapeuticClassFilter
      );
    }

    if (this.selectedMedicationName) {
      filtered = filtered.filter((medication) => medication.name === this.selectedMedicationName);
    }

    if (this.outOfStockOnly) {
      filtered = filtered.filter((medication) => {
        const item = medication as any;
        const hasOutOfStockFlag = typeof item.outOfStock === 'boolean';
        if (hasOutOfStockFlag) {
          return item.outOfStock;
        }

        const stockQuantity = item.stockQuantity;
        if (typeof stockQuantity === 'number') {
          return stockQuantity <= 0;
        }

        return false;
      });
    }

    return filtered;
  }

  get paginatedMedications(): MedicationModel[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredMedications.slice(start, end);
  }

  get totalFilteredMedications(): number {
    return this.filteredMedications.length;
  }

  formatTherapeuticClass(value?: string | null): string {
    if (!value) return '—';
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
  }

  ngOnInit(): void {
    this.pageSize = this.embedded ? 12 : 8;
    this.resolveAndLoad();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['embedded']) {
      this.pageSize = this.embedded ? 12 : 8;
      this.pageIndex = 1;
    }

    if (this.embedded && changes['pharmacyIdInput']) {
      this.resolveAndLoad();
    }

    if (
      changes['searchText'] ||
      changes['therapeuticClassFilter'] ||
      changes['selectedMedicationName'] ||
      changes['outOfStockOnly']
    ) {
      this.pageIndex = 1;
    }
  }

  private resolveAndLoad(): void {
    const routePharmacyId = this.route.snapshot.paramMap.get('pharmacyId');
    const effectivePharmacyId = this.embedded
      ? (this.pharmacyIdInput !== null ? String(this.pharmacyIdInput) : null)
      : routePharmacyId;

    this.pharmacyId = effectivePharmacyId;
    if (this.pharmacyId) {
      this.loadPharmacyAndMedications();
    }
  }

  loadPharmacyAndMedications(): void {
    if (!this.pharmacyId) return;
    const pharmacyIdNum = parseInt(this.pharmacyId, 10);

    this.loading = true;
    this.errorMsg = null;

    this.pharmacyService.getById(pharmacyIdNum).subscribe({
      next: (pharmacy) => {
        this.pharmacy = pharmacy;
        this.cdr.detectChanges();
        this.loadMedications(pharmacyIdNum);
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Failed to load pharmacy details';
        this.loading = false;
      }
    });
  }

  loadMedications(pharmacyId: number): void {
    this.loadingMedications = true;
    this.medicationService.getByPharmacy(pharmacyId).subscribe({
      next: (medications) => {
        this.medications = (medications ?? []).filter(m => {
          const status = m.medicationStatus || m.status;
          return !status || status === 'ACCEPTED';
        });
        this.medicationsChange.emit(this.medications);
        this.pageIndex = 1;
        this.loading = false;
        this.loadingMedications = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Failed to load medications';
        this.loading = false;
        this.loadingMedications = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/pharmacy']);
  }

  // ---------------- Open / Close Modal ----------------
  addMedication(status: 'PENDING' | 'ACCEPTED' = 'ACCEPTED'): void {
    this.isAddModalOpen = true;
    this.isEditMode = false;
    this.createStatus = status;
    this.editingMedicationId = null;
    this.submitting = false;
    this.photoTouched = false;

    this.addForm.reset({
      name: '',
      description: '',
      therapeuticClass: TherapeuticClass.CHOLINESTERASE_INHIBITOR
    });

    this.fileList = [];
    this.selectedImageFile = null;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.isEditMode = false;
    this.createStatus = 'ACCEPTED';
    this.editingMedicationId = null;
  }

  openRequestMedicationModal(): void {
    this.addMedication('PENDING');
  }

  openDetails(medication: MedicationModel): void {
    this.selectedMedication = medication;
    this.isDetailsModalOpen = true;
  }

  onAIButtonClick(medication: MedicationModel, event: MouseEvent): void {
    event.stopPropagation();
    this.aiButtonClicked.emit(medication);
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.selectedMedication = null;
  }

  editMedication(medication: MedicationModel, event?: MouseEvent): void {
    event?.stopPropagation();
    this.isEditMode = true;
    this.editingMedicationId = medication.id ?? null;
    this.isAddModalOpen = true;
    this.photoTouched = false;
    this.selectedImageFile = null;
    this.fileList = medication.imageUrl
      ? [
          {
            uid: `med-${medication.id ?? 'preview'}`,
            name: medication.name,
            status: 'done',
            url: medication.imageUrl,
          } as NzUploadFile,
        ]
      : [];

    this.addForm.reset({
      name: medication.name ?? '',
      description: medication.description ?? '',
      therapeuticClass:
        (medication.therapeuticClass as TherapeuticClass) ?? TherapeuticClass.CHOLINESTERASE_INHIBITOR,
    });
  }

  deleteMedication(medication: MedicationModel, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!medication.id) return;

    const confirmed = window.confirm(`Delete medication "${medication.name}"?`);
    if (!confirmed) return;

    this.medicationService.delete(medication.id).subscribe({
      next: () => {
        this.msg.success('Medication deleted successfully.');
        this.medications = this.medications.filter((item) => item.id !== medication.id);
        this.medicationsChange.emit(this.medications);
        if (this.pageIndex > 1 && this.paginatedMedications.length === 0) {
          this.pageIndex = this.pageIndex - 1;
        }
      },
      error: (err) => {
        console.error(err);
        this.msg.error('Failed to delete medication.');
      },
    });
  }

  // ---------------- Upload Rules ----------------
  beforeUpload = (file: NzUploadFile): boolean => {
    const raw = ((file as any).originFileObj ?? file) as any;

    const realFile = raw instanceof File ? raw : null;
    if (!realFile) {
      this.msg.error('Could not read the selected file.');
      return false;
    }

    if (!realFile.type.startsWith('image/')) {
      this.msg.error('Only image files are allowed.');
      return false;
    }

    this.fileList = [file];
    this.selectedImageFile = realFile;
    this.photoTouched = true;

    return false;
  };

  onRemove = (): boolean => {
    this.fileList = [];
    this.selectedImageFile = null;
    this.photoTouched = true;
    return true;
  };

  // ---------------- Submit: Create then Upload Image ----------------
  submitAddMedication(): void {
    this.submitting = true;
    this.photoTouched = true;

    if (!this.pharmacyId) {
      this.msg.error('Missing pharmacy id.');
      this.submitting = false;
      return;
    }

    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      this.msg.error('Please fix the form errors.');
      this.submitting = false;
      return;
    }

    if (!this.isEditMode && !this.selectedImageFile) {
      this.msg.error('Photo is required.');
      this.submitting = false;
      return;
    }

    const pharmacyIdNum = parseInt(this.pharmacyId, 10);

    const newMedication: NewMedication = {
      name: this.addForm.value.name!,
      medicationStatus: this.createStatus,
      description: this.addForm.value.description || undefined,
      therapeuticClass: this.addForm.value.therapeuticClass!,
      pharmacyId: pharmacyIdNum
    };

    const imageFile = this.selectedImageFile;

    if (this.isEditMode && this.editingMedicationId) {
      const updatePayload: Partial<MedicationModel> = {
        name: newMedication.name,
        description: newMedication.description,
        therapeuticClass: newMedication.therapeuticClass,
      };

      this.medicationService
        .update(this.editingMedicationId, updatePayload)
        .pipe(
          switchMap((updated) => {
            if (imageFile) {
              return this.medicationService.uploadImage(this.editingMedicationId!, imageFile);
            }
            return of(updated);
          }),
          finalize(() => (this.submitting = false))
        )
        .subscribe({
          next: (updated: MedicationModel) => {
            this.msg.success('Medication updated successfully!');
            this.isAddModalOpen = false;
            this.isEditMode = false;
            this.editingMedicationId = null;

            this.medications = this.medications.map((item) =>
              item.id === updated.id ? updated : item
            );
            this.medicationsChange.emit(this.medications);
            this.fileList = [];
            this.selectedImageFile = null;
            this.photoTouched = false;
          },
          error: (err) => {
            console.error(err);
            this.msg.error('Failed to update medication.');
          },
        });
      return;
    }

    this.medicationService
      .create(newMedication as any)
      .pipe(
        switchMap((created: any) => {
          const id = created?.id as number | undefined;
          if (!id) throw new Error('Created medication has no ID.');
          return this.medicationService.uploadImage(id, imageFile!);
        }),
        finalize(() => (this.submitting = false))
      )
      .subscribe({
        next: (updated) => {
          this.msg.success('Medication created successfully!');
          this.isAddModalOpen = false;

          this.medications = [updated, ...this.medications];
          this.medicationsChange.emit(this.medications);

          this.fileList = [];
          this.selectedImageFile = null;
          this.photoTouched = false;

          this.addForm.reset({
            name: '',
            description: '',
            therapeuticClass: TherapeuticClass.CHOLINESTERASE_INHIBITOR
          });
          this.pageIndex = 1;
        },
        error: (err) => {
          console.error(err);
          this.msg.error('Failed to create medication or upload image.');
        }
      });
  }

  // Validation error display helpers
  getFieldError(fieldName: string): string | null {
    const control = this.addForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.addForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
