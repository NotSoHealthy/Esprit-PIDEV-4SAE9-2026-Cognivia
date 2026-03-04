import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { finalize } from 'rxjs/operators';
import { PrescriptionService } from './services/prescription.service';
import { MedicationService } from '../pharmacy/services/medication.service';
import { PharmacyRecommendation, Prescription, PrescriptionItem, Medication } from './models/prescription.model';
import { Frequency, frequencyLabels } from './models/frequency.enum';
import { KeycloakService } from '../../core/auth/keycloak.service';

@Component({
  selector: 'app-prescription',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzEmptyModule,
    NzSpinModule,
    NzIconModule,
    NzCollapseModule,
    NzDividerModule,
    NzDatePickerModule,
    NzDropDownModule,
  ],
  templateUrl: './prescription.html',
  styleUrl: './prescription.css',
})
export class PrescriptionComponent implements OnInit {
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly medicationService = inject(MedicationService);
  private readonly keycloakService = inject(KeycloakService);
  private readonly modal = inject(NzModalService);
  private readonly msg = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  public readonly fb = inject(FormBuilder);

  prescriptions: Prescription[] = [];
  medications: Medication[] = [];
  loading = false;
  savingPrescription = false;
  activeTabIndex = 0;
  isAddModalOpen = false;
  isEditMode = false;
  editingPrescriptionId: number | null = null;
  expandedPrescriptionId: number | null = null;
  selectedPrescriptionCode: string | null = null;
  prescriptionCodeOptions: string[] = [];
  recommendationLoading = false;
  recommendedPharmacies: PharmacyRecommendation[] = [];
  recommendationIndex = 0;

  // Form for adding prescription
  addPrescriptionForm = this.fb.group({
    patientName: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    expiresAt: [null as Date | null, [Validators.required]],
    prescriptionItems: this.fb.array([
      this.createPrescriptionItemGroup()
    ]),
  });

  frequencyLabels = frequencyLabels;
  frequencyOptions = Object.entries(frequencyLabels).map(([key, label]) => ({
    value: key,
    label: label,
  }));

  readonly pieColors = ['#4D5CAB', '#7986cb', '#52c41a', '#faad14', '#ff7a45', '#ff4d4f', '#13c2c2'];

  ngOnInit(): void {
    this.loadPrescriptions();
    this.loadMedications();
    this.loadPrescriptionCodeOptions('');
  }

  // FormArray getter
  get prescriptionItems(): FormArray {
    return this.addPrescriptionForm.get('prescriptionItems') as FormArray;
  }

  // Create a single prescription item FormGroup
  private createPrescriptionItemGroup(): FormGroup {
    return this.fb.group({
      medication: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      frequency: [null, [Validators.required]],
    });
  }

  loadPrescriptions(): void {
    this.loading = true;
    this.prescriptionService.getAll()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
      next: (data) => {
        this.prescriptions = data ?? [];
        const codesFromList = this.prescriptions
          .map((prescription) => prescription.code)
          .filter((code): code is string => !!code && code.trim().length > 0);
        this.prescriptionCodeOptions = Array.from(new Set(codesFromList)).slice(0, 10);
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
        if (err?.status === 200) {
          console.error('Likely JSON parse/serialization issue from backend response body:', err?.error);
        }
        this.msg.error('Failed to load prescriptions');
      },
    });
  }

  loadPrescriptionCodeOptions(query: string): void {
    this.prescriptionService.searchCodes(query).subscribe({
      next: (codes) => {
        this.prescriptionCodeOptions = (codes ?? []).slice(0, 10);
      },
      error: (err) => {
        console.error('Error loading prescription code suggestions:', err);
      },
    });
  }

  onPrescriptionCodeSearch(query: string): void {
    this.loadPrescriptionCodeOptions(query ?? '');
  }

  onRecommendationCodeChange(code: string | null): void {
    this.selectedPrescriptionCode = code;
    this.recommendationIndex = 0;

    if (!code) {
      this.recommendedPharmacies = [];
      return;
    }

    this.recommendationLoading = true;
    this.prescriptionService.getRecommendationsByCode(code)
      .pipe(finalize(() => { this.recommendationLoading = false; }))
      .subscribe({
        next: (recommendations) => {
          this.recommendedPharmacies = (recommendations ?? []).slice(0, 5);
        },
        error: (err) => {
          console.error('Error loading pharmacy recommendations:', err);
          this.recommendedPharmacies = [];
          this.msg.error('Failed to load pharmacy recommendations');
        },
      });
  }

  previousRecommendation(): void {
    const total = this.recommendedPharmacies.length;
    if (total <= 1) return;
    this.recommendationIndex = (this.recommendationIndex - 1 + total) % total;
  }

  nextRecommendation(): void {
    const total = this.recommendedPharmacies.length;
    if (total <= 1) return;
    this.recommendationIndex = (this.recommendationIndex + 1) % total;
  }

  get currentRecommendation(): PharmacyRecommendation | null {
    if (this.recommendedPharmacies.length === 0) {
      return null;
    }
    const safeIndex = Math.min(this.recommendationIndex, this.recommendedPharmacies.length - 1);
    return this.recommendedPharmacies[safeIndex] ?? null;
  }

  loadMedications(): void {
    this.medicationService.getAll().subscribe({
      next: (medications: any[]) => {
        this.medications = medications.map((med: any) => ({
          id: med.id,
          name: med.name,
          imageUrl: med.imageUrl ?? med.picture,
        })).filter((m: Medication, index: number, self: Medication[]) => self.findIndex(x => x.id === m.id) === index);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading medications:', err);
      },
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingPrescriptionId = null;
    this.isAddModalOpen = true;
    this.addPrescriptionForm.reset({
      patientName: '',
      description: '',
      expiresAt: null,
      prescriptionItems: [this.createPrescriptionItemGroup()],
    });
    // Reset the form array
    const itemsArray = this.addPrescriptionForm.get('prescriptionItems') as FormArray;
    itemsArray.clear();
    itemsArray.push(this.createPrescriptionItemGroup());
  }

  openEditModal(prescription: Prescription, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!prescription.id) return;

    this.isEditMode = true;
    this.editingPrescriptionId = prescription.id;
    this.isAddModalOpen = true;

    this.addPrescriptionForm.patchValue({
      patientName: prescription.patientName ?? '',
      description: prescription.description ?? '',
      expiresAt: prescription.expiresAt ? new Date(prescription.expiresAt) : null,
    });

    const itemsArray = this.addPrescriptionForm.get('prescriptionItems') as FormArray;
    itemsArray.clear();

    const sourceItems = prescription.items ?? [];
    if (sourceItems.length === 0) {
      itemsArray.push(this.createPrescriptionItemGroup());
      return;
    }

    sourceItems.forEach((item) => {
      const medicationId = item.medication?.id;
      const medicationFromOptions = this.medications.find((med) => med.id === medicationId);
      const medicationValue = medicationFromOptions ?? item.medication ?? null;

      itemsArray.push(
        this.fb.group({
          medication: [medicationValue, [Validators.required]],
          quantity: [item.quantity ?? 1, [Validators.required, Validators.min(1)]],
          frequency: [item.frequency ?? null, [Validators.required]],
        })
      );
    });
  }

  deletePrescription(prescription: Prescription, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!prescription.id) return;

    this.modal.confirm({
      nzTitle: 'Delete prescription?',
      nzContent: `This will permanently delete prescription #${prescription.id}.`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.prescriptionService.delete(prescription.id!).subscribe({
          next: () => {
            this.msg.success('Prescription deleted');
            this.loadPrescriptions();
          },
          error: (err) => {
            console.error('Error deleting prescription:', err);
            this.msg.error('Failed to delete prescription');
          },
        });
      },
    });
  }

  addPrescriptionItem(): void {
    this.prescriptionItems.push(this.createPrescriptionItemGroup());
  }

  removePrescriptionItem(index: number): void {
    if (this.prescriptionItems.length > 1) {
      this.prescriptionItems.removeAt(index);
    }
  }

  savePrescription(): void {
    // Mark all fields as touched to show validation errors
    Object.keys(this.addPrescriptionForm.controls).forEach(key => {
      this.addPrescriptionForm.get(key)?.markAsTouched();
    });

    this.prescriptionItems.controls.forEach(control => {
      const itemControl = control as FormGroup;
      Object.keys(itemControl.controls).forEach(key => {
        itemControl.get(key)?.markAsTouched();
      });
    });

    // Validate main form
    if (!this.addPrescriptionForm.get('patientName')?.valid) {
      this.msg.error('Please enter a valid patient name (minimum 3 characters)');
      return;
    }

    if (!this.addPrescriptionForm.get('description')?.valid) {
      this.msg.error('Please enter a valid description (minimum 5 characters)');
      return;
    }

    if (!this.addPrescriptionForm.get('expiresAt')?.valid) {
      this.msg.error('Please select an expiration date');
      return;
    }

    // Validate items array
    if (this.prescriptionItems.length === 0) {
      this.msg.error('Please add at least one medication');
      return;
    }

    if (!this.prescriptionItems.valid) {
      this.msg.error('Please fill in all medication fields correctly');
      return;
    }

    this.savingPrescription = true;

    const formValue = this.addPrescriptionForm.value;
    const items = (formValue.prescriptionItems ?? []) as Array<{
      medication: Medication;
      quantity: number;
      frequency: Frequency;
    }>;

    const prescription: Prescription = {
      patientName: formValue.patientName ?? '',
      doctorName: this.keycloakService.getUsername() ?? null,
      description: formValue.description ?? '',
      expiresAt: formValue.expiresAt ? new Date(formValue.expiresAt).toISOString() : undefined,
      items: items.map((item) => ({
        medication: item.medication,
        quantity: item.quantity,
        frequency: item.frequency,
      } as PrescriptionItem)),
    };

    const request$ = this.isEditMode && this.editingPrescriptionId
      ? this.prescriptionService.update(this.editingPrescriptionId, prescription)
      : this.prescriptionService.create(prescription);

    request$.subscribe({
      next: () => {
        this.msg.success(this.isEditMode ? 'Prescription updated successfully' : 'Prescription created successfully');
        this.isAddModalOpen = false;
        this.isEditMode = false;
        this.editingPrescriptionId = null;
        this.savingPrescription = false;
        this.loadPrescriptions();
      },
      error: (err) => {
        console.error(this.isEditMode ? 'Error updating prescription:' : 'Error creating prescription:', err);
        this.msg.error(this.isEditMode ? 'Failed to update prescription' : 'Failed to create prescription');
        this.savingPrescription = false;
      },
    });
  }

  get medicineRequestStats(): Array<{ name: string; count: number; percentage: number; color: string }> {
    const counter = new Map<string, number>();

    this.prescriptions.forEach((prescription) => {
      (prescription.items ?? []).forEach((item) => {
        const name = item.medication?.name?.trim() || 'Unknown';
        counter.set(name, (counter.get(name) ?? 0) + (item.quantity ?? 0));
      });
    });

    const raw = Array.from(counter.entries())
      .map(([name, count]) => ({ name, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    const total = raw.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return [];

    return raw.map((item, index) => ({
      name: item.name,
      count: item.count,
      percentage: (item.count / total) * 100,
      color: this.pieColors[index % this.pieColors.length],
    }));
  }

  get medicinePieGradient(): string {
    const stats = this.medicineRequestStats;
    if (stats.length === 0) {
      return 'conic-gradient(#f0f0f0 0deg 360deg)';
    }

    let current = 0;
    const segments = stats.map((item) => {
      const start = current;
      const sweep = (item.percentage / 100) * 360;
      current += sweep;
      return `${item.color} ${start}deg ${current}deg`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  // Helper methods for validation error display
  getFieldError(fieldName: string): string | null {
    const control = this.addPrescriptionForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
    return null;
  }

  getItemError(index: number, fieldName: string): string | null {
    const control = this.prescriptionItems.at(index)?.get(fieldName);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['required']) return 'This field is required';
    if (control.errors['min']) return 'Quantity must be at least 1';
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.addPrescriptionForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isItemFieldInvalid(index: number, fieldName: string): boolean {
    const control = this.prescriptionItems.at(index)?.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  togglePrescriptionExpand(prescriptionId: number | undefined): void {
    if (!prescriptionId) return;
    this.expandedPrescriptionId = this.expandedPrescriptionId === prescriptionId ? null : prescriptionId;
  }

  isPrescriptionExpanded(prescriptionId: number | undefined): boolean {
    return this.expandedPrescriptionId === prescriptionId;
  }

  formatDate(date: string | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString();
  }

  getMedicationLabel(medication: Medication | undefined): string {
    if (!medication) return '—';
    return medication.name || '—';
  }

  getRecommendationImage(rec: PharmacyRecommendation): string | null {
    return rec.bannerUrl || rec.logoUrl || null;
  }

  compareMedications(a: any, b: any): boolean {
    return a?.id === b?.id;
  }
}
