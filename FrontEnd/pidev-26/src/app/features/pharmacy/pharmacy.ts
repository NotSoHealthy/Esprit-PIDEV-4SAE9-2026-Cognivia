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
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { PharmacyService } from './services/pharmacy.service';
import { Pharmacy as PharmacyModel } from './models/pharmacy.model';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { FormsModule } from '@angular/forms';
import { NzRateModule } from 'ng-zorro-antd/rate';

@Component({
  selector: 'app-pharmacy',
  standalone: true,
  imports: [
    CommonModule,

    // ⭐ rating needs FormsModule (ngModel) + NzRateModule
    FormsModule,
    NzRateModule,
  NzEmptyModule,   // ✅ ADD THIS

    NzDropDownModule,
    NzIconModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSpinModule,
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

  // ⭐ rating state (per pharmacy)
  // store the user's selected rating locally by pharmacy id
  rateMap = new Map<number, number>();

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

  const startTime = Date.now();

  this.service.getAll().subscribe({
    next: (list) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1000 - elapsed, 0); // minimum 1 second

      setTimeout(() => {
        this.pharmacies = list ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      }, remaining);
    },
    error: (err) => {
      console.error(err);

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1000 - elapsed, 0);

      setTimeout(() => {
        this.errorMsg = 'Failed to load pharmacies';
        this.loading = false;
      }, remaining);
    },
  });
}

  // ⭐ helpers used by the HTML binding
  getRate(id: number): number {
    return this.rateMap.get(id) ?? 0;
  }

setRate(id: number, value: number): void {
  this.rateMap.set(id, Math.round(value)); // or Math.floor(value)
  this.cdr.detectChanges();
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

    const payload: PharmacyModel = {
      name: v.name!,
      address: v.address || undefined,
      latitude: v.latitude ?? null,
      longitude: v.longitude ?? null,
      createdAt: null,
      updatedAt: null,

      bannerUrl: null,
      logoUrl: null,
    };

    this.saving = true;
    this.service.create(payload as any).subscribe({
      next: (created) => {
        this.pharmacies = [created, ...this.pharmacies];

        // ⭐ default rating for newly created pharmacy
        if (created?.id != null && !this.rateMap.has(created.id)) {
          this.rateMap.set(created.id, 0);
        }

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
    this.router.navigate(['/medications', p.id]);
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