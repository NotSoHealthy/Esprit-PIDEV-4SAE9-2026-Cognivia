import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';

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

    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzRadioModule,
    NzUploadModule

  ],
  templateUrl: './medication.html',
  styleUrl: './medication.css'
})
export class Medication implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pharmacyService = inject(PharmacyService);
  private readonly medicationService = inject(MedicationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);

  pharmacyId: string | null = null;
  pharmacy: Pharmacy | null = null;
  medications: MedicationModel[] = [];
  loading = false;
  loadingMedications = false;
  errorMsg: string | null = null;

  // ---------------- Modal + Form ----------------
  isAddModalOpen = false;
  submitting = false;

  therapeuticOptions = [
    { label: 'Cholinesterase inhibitor', value: TherapeuticClass.CHOLINESTERASE_INHIBITOR },
    { label: 'NMDA receptor antagonist', value: TherapeuticClass.NMDA_RECEPTOR_ANTAGONIST },
    { label: 'Anti-amyloid monoclonal antibody', value: TherapeuticClass.ANTI_AMYLOID_MONOCLONAL_ANTIBODY },
    { label: 'Combination product', value: TherapeuticClass.COMBINATION_PRODUCT }
  ];

  // Upload state
  fileList: NzUploadFile[] = [];
  selectedImageFile: File | null = null;
  photoTouched = false;

  addForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    therapeuticClass: [TherapeuticClass.CHOLINESTERASE_INHIBITOR, [Validators.required]]
  });

  get photoMissing(): boolean {
    return this.photoTouched && !this.selectedImageFile;
  }

  ngOnInit(): void {
    this.pharmacyId = this.route.snapshot.paramMap.get('pharmacyId');
    if (this.pharmacyId) this.loadPharmacyAndMedications();
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
        this.medications = medications ?? [];
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
  addMedication(): void {
    this.isAddModalOpen = true;
    this.submitting = false;
    this.photoTouched = false;

    this.addForm.reset({
      name: '',
      therapeuticClass: TherapeuticClass.CHOLINESTERASE_INHIBITOR
    });

    this.fileList = [];
    this.selectedImageFile = null;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
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

    if (!this.selectedImageFile) {
      this.msg.error('Photo is required.');
      this.submitting = false;
      return;
    }

    const pharmacyIdNum = parseInt(this.pharmacyId, 10);

    const newMedication: NewMedication = {
      name: this.addForm.value.name!,
      therapeuticClass: this.addForm.value.therapeuticClass!,
      pharmacyId: pharmacyIdNum
    };

    const imageFile = this.selectedImageFile;

    this.medicationService
      .create(newMedication as any)
      .pipe(
        switchMap((created: any) => {
          const id = created?.id as number | undefined;
          if (!id) throw new Error('Created medication has no ID.');
          return this.medicationService.uploadImage(id, imageFile);
        }),
        finalize(() => (this.submitting = false))
      )
      .subscribe({
        next: (updated) => {
          this.msg.success('Medication created successfully!');
          this.isAddModalOpen = false;

          this.medications = [updated, ...this.medications];

          this.fileList = [];
          this.selectedImageFile = null;
          this.photoTouched = false;

          this.addForm.reset({
            name: '',
            therapeuticClass: TherapeuticClass.CHOLINESTERASE_INHIBITOR
          });
        },
        error: (err) => {
          console.error(err);
          this.msg.error('Failed to create medication or upload image.');
        }
      });
  }
}
