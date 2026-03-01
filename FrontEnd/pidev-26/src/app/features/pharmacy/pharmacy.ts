import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';

import { PharmacyService } from './services/pharmacy.service';
import { Pharmacy as PharmacyModel } from './models/pharmacy.model';

@Component({
  selector: 'app-pharmacy',
  standalone: true,
  imports: [
    CommonModule,
    NzDropDownModule,
    NzIconModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './pharmacy.html',
  styleUrl: './pharmacy.css',
})
export class Pharmacy implements OnInit {
  private readonly service = inject(PharmacyService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  pharmacies: PharmacyModel[] = [];
  loading = false;
  errorMsg: string | null = null;

  liked = new Set<number>();

  // modal state
  isAddModalOpen = false;
  saving = false;

  addForm = this.fb.group({
    name: ['', [Validators.required]],
    address: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
  });

  ngOnInit(): void {
    this.loadPharmacies();
  }

  loadPharmacies(): void {
    this.loading = true;
    this.errorMsg = null;

    this.service.getAll().subscribe({
      next: (list) => {
        this.pharmacies = list ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Failed to load pharmacies';
        this.loading = false;
      },
    });
  }

  // ✅ open modal
  openAddModal(): void {
    this.addForm.reset({
      name: '',
      address: '',
      latitude: null,
      longitude: null,
    });
    this.isAddModalOpen = true;
  }

  // ✅ close modal
  cancelAdd(): void {
    this.isAddModalOpen = false;
  }

  // ✅ submit
  submitAdd(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    const v = this.addForm.getRawValue();

    // keep createdAt and updatedAt null
    const payload: PharmacyModel = {
      name: v.name!,
      address: v.address || undefined,
      latitude: v.latitude ?? null,
      longitude: v.longitude ?? null,
      createdAt: null,
      updatedAt: null,
    };

    this.saving = true;
    this.service.create(payload as any).subscribe({
      next: (created) => {
        // add to list locally (or call loadPharmacies())
        this.pharmacies = [created, ...this.pharmacies];
        this.isAddModalOpen = false;
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Failed to create pharmacy';
        this.saving = false;
      },
    });
  }

  openMedicines(p: PharmacyModel): void {
    if (!p.id) return;
    this.router.navigate(['/medicines', p.id]);
  }

  toggleLike(p: PharmacyModel, ev: MouseEvent): void {
    ev.stopPropagation();
    if (!p.id) return;
    if (this.liked.has(p.id)) this.liked.delete(p.id);
    else this.liked.add(p.id);
  }

  favorite(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    console.log('Favorite', p);
  }
  report(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    console.log('Report', p);
  }
  edit(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    console.log('Edit', p);
  }
  delete(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    console.log('Delete', p);
  }
}