import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef, AfterViewInit, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NzIconModule, NZ_ICONS } from 'ng-zorro-antd/icon';
import { EnvironmentOutline, PushpinOutline, MoreOutline, HeartOutline, HeartFill, PlusOutline, CheckCircleFill, CloseCircleFill, PictureOutline, UploadOutline } from '@ant-design/icons-angular/icons';

/* ✅ FIX Leaflet marker paths for Angular */
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
});

import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { PharmacyService } from './services/pharmacy.service';
import { WorkingHoursService } from './services/working-hours.service';
import { Pharmacy as PharmacyModel } from './models/pharmacy.model';
import { MedicationModel } from './models/medication.model';
import { FormsModule } from '@angular/forms';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { PictureTwoTone } from '@ant-design/icons-angular/icons';
import { Medication } from './medication/medication';


@Component({
  selector: 'app-pharmacy',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzRateModule,
    NzEmptyModule,
    NzDropDownModule,
    NzIconModule,
    
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSpinModule,
    ReactiveFormsModule,
    NzStepsModule,
    NzUploadModule,
    NzPaginationModule,
    NzTabsModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSwitchModule,
    Medication,
  ],
   providers: [
    {
      provide: NZ_ICONS,
      useValue: [
        EnvironmentOutline,
        PushpinOutline,
        MoreOutline,
        HeartOutline,
        HeartFill,
        PlusOutline,
        CheckCircleFill,
        CloseCircleFill,
        PictureOutline,
        PictureTwoTone,
        UploadOutline
      ]
    }
  ],
  templateUrl: './pharmacy.html',
  styleUrl: './pharmacy.css',

})
export class Pharmacy implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef;

  private readonly service = inject(PharmacyService);
  private readonly workingHoursService = inject(WorkingHoursService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly ngZone = inject(NgZone);

  map: L.Map | null = null;
  marker: L.Marker | null = null;

  pharmacies: PharmacyModel[] = [];
  loading = false;
  errorMsg: string | null = null;

  liked = new Set<number>();
  rateMap = new Map<number, number>();
  pharmacyStatus = new Map<number, { isOpen: boolean; isClosed: boolean }>();

  // Filter and pagination state
  searchText = '';
  selectedDate: Date | null = null;
  favoriteOnly = false;
  ratingSortOrder: 'asc' | 'desc' | null = null;
  pageIndex = 1;
  pageSize = 5;
  activeTabIndex = 0;
  inventoryPharmacyId: number | null = null;
  inventorySearchText = '';
  inventoryTherapeuticClass = '';
  inventoryMedicationName = '';
  inventoryOutOfStockOnly = false;
  inventoryMedications: MedicationModel[] = [];

  // modal state
  isAddModalOpen = false;
  currentStep = 0;
  saving = false;
  stepError: string | null = null;
  stepComplete = false;
  modalMode: 'add' | 'editInfo' | 'changeCoordinates' = 'add';
  editingPharmacy: PharmacyModel | null = null;

  // Banner and logo files
  bannerFileList: NzUploadFile[] = [];
  logoFileList: NzUploadFile[] = [];
  bannerFile: File | null = null;
  logoFile: File | null = null;

  addForm = this.fb.group({
    name: ['', [Validators.required]],
    address: [''],
    description: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
  });

  ngOnInit(): void {
    this.loadPharmacies();
  }

  get filteredPharmacies(): PharmacyModel[] {
    let filtered = [...this.pharmacies];

    // Search filter
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(search) ||
          p.address?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    // Date filter
    if (this.selectedDate) {
      const filterDate = new Date(this.selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((p) => {
        if (!p.createdAt) return false;
        const createdDate = new Date(p.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === filterDate.getTime();
      });
    }

    // Favorite filter
    if (this.favoriteOnly) {
      filtered = filtered.filter((p) => p.id && this.liked.has(p.id));
    }

    // Rating sort
    if (this.ratingSortOrder) {
      filtered.sort((a, b) => {
        const ratingA = a.id ? this.getRate(a.id) : 0;
        const ratingB = b.id ? this.getRate(b.id) : 0;
        return this.ratingSortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      });
    }

    return filtered;
  }

  get paginatedPharmacies(): PharmacyModel[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredPharmacies.slice(start, end);
  }

  get totalFiltered(): number {
    return this.filteredPharmacies.length;
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
  }

  onSearchChange(): void {
    this.pageIndex = 1; // Reset to first page
  }

  onDateChange(): void {
    this.pageIndex = 1;
  }

  onFavoriteChange(): void {
    this.pageIndex = 1;
  }

  onRatingSortChange(): void {
    this.pageIndex = 1;
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedDate = null;
    this.favoriteOnly = false;
    this.ratingSortOrder = null;
    this.pageIndex = 1;
  }

  clearInventoryFilters(): void {
    this.inventorySearchText = '';
    this.inventoryTherapeuticClass = '';
    this.inventoryMedicationName = '';
    this.inventoryOutOfStockOnly = false;
  }

  clearActiveFilters(): void {
    if (this.activeTabIndex === 1) {
      this.clearInventoryFilters();
      return;
    }

    this.clearFilters();
  }

  onInventorySearchChange(): void {}

  onInventoryTherapeuticClassChange(): void {}

  onInventoryMedicationNameChange(): void {}

  onInventoryOutOfStockChange(): void {}

  onInventoryMedicationsChange(medications: MedicationModel[]): void {
    this.inventoryMedications = medications ?? [];

    if (
      this.inventoryMedicationName &&
      !this.inventoryMedications.some((medication) => medication.name === this.inventoryMedicationName)
    ) {
      this.inventoryMedicationName = '';
    }
  }

  get inventoryTherapeuticClassOptions(): string[] {
    return Array.from(
      new Set(
        this.inventoryMedications
          .map((medication) => medication.therapeuticClass)
          .filter((value): value is string => !!value)
      )
    );
  }

  get inventoryMedicationOptions(): string[] {
    return Array.from(
      new Set(
        this.inventoryMedications
          .map((medication) => medication.name)
          .filter((value): value is string => !!value)
      )
    );
  }

  formatTherapeuticClass(value?: string | null): string {
    if (!value) return '—';
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  onInventoryPharmacyChange(pharmacyId: number): void {
    this.inventoryPharmacyId = pharmacyId;
  }

  onTabChange(tabIndex: number): void {
    this.activeTabIndex = tabIndex;
    if (tabIndex === 1 && !this.inventoryPharmacyId && this.pharmacies.length > 0) {
      this.inventoryPharmacyId = this.pharmacies[0].id ?? null;
    }
  }

  ngAfterViewInit(): void {
    // Map will be initialized when step 1 is reached
  }

  loadPharmacies(): void {
    this.loading = true;
    this.errorMsg = null;

    const startTime = Date.now();

    this.service.getAll().subscribe({
      next: (list) => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.pharmacies = list ?? [];
          if (!this.inventoryPharmacyId && this.pharmacies.length > 0) {
            this.inventoryPharmacyId = this.pharmacies[0].id ?? null;
          }
          
          // Load status for each pharmacy
          this.pharmacies.forEach(pharmacy => {
            if (pharmacy.id) {
              this.loadPharmacyStatus(pharmacy.id);
            }
          });
          
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

  loadPharmacyStatus(pharmacyId: number): void {
    this.workingHoursService.getByPharmacy(pharmacyId).subscribe({
      next: (workingHours) => {
        const status = this.isPharmacyOpen(workingHours);
        this.pharmacyStatus.set(pharmacyId, status);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load pharmacy status:', err);
        this.pharmacyStatus.set(pharmacyId, { isOpen: false, isClosed: false });
      },
    });
  }

  isPharmacyOpen(workingHours: any[]): { isOpen: boolean; isClosed: boolean } {
    if (!workingHours || workingHours.length === 0) {
      return { isOpen: false, isClosed: false };
    }

    const now = new Date();
    const currentDay = now.getDay();
    const dayOfWeek = currentDay === 0 ? 6 : currentDay - 1;
    const dayNames = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const todayString = dayNames[dayOfWeek];

    const todaySchedule = workingHours.find((wh: any) => wh.dayOfWeek === todayString);

    if (!todaySchedule) {
      return { isOpen: false, isClosed: false };
    }

    if (todaySchedule.isClosed) {
      return { isOpen: false, isClosed: true };
    }

    if (!todaySchedule.openTime || !todaySchedule.closeTime) {
      return { isOpen: false, isClosed: false };
    }

    const [openHour, openMin] = todaySchedule.openTime.split(':').map(Number);
    const [closeHour, closeMin] = todaySchedule.closeTime.split(':').map(Number);

    const openDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), openHour, openMin);
    const closeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), closeHour, closeMin);

    const isOpen = now >= openDate && now < closeDate;

    return { isOpen, isClosed: false };
  }

  getRate(id: number): number {
    return this.rateMap.get(id) ?? 0;
  }

  setRate(id: number, value: number): void {
    this.rateMap.set(id, Math.round(value));
    this.cdr.detectChanges();
  }

  openAddModal(): void {
    this.modalMode = 'add';
    this.editingPharmacy = null;
    this.currentStep = 0;
    this.map = null;
    this.marker = null;
    this.stepError = null;
    this.stepComplete = false;
    this.bannerFileList = [];
    this.logoFileList = [];
    this.bannerFile = null;
    this.logoFile = null;
    this.addForm.reset({
      name: '',
      address: '',
      description: '',
      latitude: null,
      longitude: null,
    });
    this.isAddModalOpen = true;
  }

  cancelAdd(): void {
    this.isAddModalOpen = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  beforeUploadBanner = (file: NzUploadFile): boolean => {
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

    this.bannerFileList = [file];
    this.bannerFile = realFile;
    return false;
  };

  beforeUploadLogo = (file: NzUploadFile): boolean => {
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

    this.logoFileList = [file];
    this.logoFile = realFile;
    return false;
  };

  onRemoveBanner = (): boolean => {
    this.bannerFileList = [];
    this.bannerFile = null;
    return true;
  };

  onRemoveLogo = (): boolean => {
    this.logoFileList = [];
    this.logoFile = null;
    return true;
  };

  nextStep(): void {
    if (this.currentStep === 0) {
      // Validate step 1
      if (this.addForm.get('name')!.invalid) {
        this.addForm.get('name')!.markAsTouched();
        this.stepError = 'Please enter a pharmacy name';
        return;
      }
      this.stepError = null;

      // If in editInfo mode, submit the update
      if (this.modalMode === 'editInfo') {
        this.submitPharmacyUpdate();
        return;
      }

      this.currentStep = 1;
      this.cdr.detectChanges();
      this.initializeMap();
    } else if (this.currentStep === 1) {
      // Validate step 2
      const lat = this.addForm.get('latitude')!.value;
      const lng = this.addForm.get('longitude')!.value;

      if (lat === null || lng === null) {
        this.stepError = 'Please enter both latitude and longitude';
        return;
      }

      if (isNaN(lat) || isNaN(lng)) {
        this.stepError = 'Latitude and longitude must be valid numbers';
        return;
      }

      this.stepError = null;
      this.currentStep = 2;
      this.submitPharmacy();
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.stepError = null;
    }
  }

  updateCoordinates(): void {
    if (!this.editingPharmacy || !this.editingPharmacy.id) return;

    const lat = this.addForm.get('latitude')!.value;
    const lng = this.addForm.get('longitude')!.value;

    if (lat === null || lng === null) {
      this.stepError = 'Please enter both latitude and longitude';
      return;
    }

    if (isNaN(lat) || isNaN(lng)) {
      this.stepError = 'Latitude and longitude must be valid numbers';
      return;
    }

    this.saving = true;
    this.stepError = null;

    const payload = {
      ...this.editingPharmacy,
      latitude: lat,
      longitude: lng,
    };

    this.service.update(this.editingPharmacy.id, payload as any).subscribe({
      next: (updated) => {
        const index = this.pharmacies.findIndex(p => p.id === this.editingPharmacy!.id);
        if (index !== -1) {
          this.pharmacies[index] = updated;
        }
        this.saving = false;
        this.msg.success('Coordinates updated successfully');
        this.isAddModalOpen = false;
        this.editingPharmacy = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.stepError = 'Failed to update coordinates';
        this.saving = false;
      },
    });
  }

  submitPharmacy(): void {
    this.saving = true;
    this.stepError = null;

    const v = this.addForm.getRawValue();

    const payload: PharmacyModel = {
      name: v.name!,
      address: v.address || undefined,
      description: v.description || undefined,
      latitude: v.latitude ?? null,
      longitude: v.longitude ?? null,
      createdAt: null,
      updatedAt: null,
      bannerUrl: null,
      logoUrl: null,
    };

    this.service.create(payload as any).subscribe({
      next: (created) => {
        if (!created.id) {
          this.stepError = 'Failed to create pharmacy: no ID returned';
          this.saving = false;
          return;
        }

        // Upload banner if provided
        const uploadBanner = this.bannerFile
          ? this.service.uploadImages(created.id, { banner: this.bannerFile })
          : null;

        // Upload logo if provided
        const uploadLogo = this.logoFile
          ? this.service.uploadImages(created.id, { logo: this.logoFile })
          : null;

        const uploads = [uploadBanner, uploadLogo].filter(
          (u) => u !== null
        );

        if (uploads.length === 0) {
          this.finishPharmacyCreation(created);
          return;
        }

        // Wait for all uploads
        Promise.all(
          uploads.map((upload) =>
            upload!.toPromise().catch((err) => {
              console.error('Upload error:', err);
              return null;
            })
          )
        ).then(() => {
          this.finishPharmacyCreation(created);
        });
      },
      error: (err) => {
        console.error(err);
        this.stepError = 'Failed to create pharmacy';
        this.saving = false;
      },
    });
  }

  private finishPharmacyCreation(created: PharmacyModel): void {
    this.pharmacies = [created, ...this.pharmacies];

    if (created?.id != null && !this.rateMap.has(created.id)) {
      this.rateMap.set(created.id, 0);
    }

    this.stepComplete = true;
    this.saving = false;
    this.cdr.detectChanges();

    // Close modal after 2 seconds
    setTimeout(() => {
      this.isAddModalOpen = false;
      this.currentStep = 0;
      this.stepComplete = false;
    }, 2000);
  }

  private submitPharmacyUpdate(): void {
    if (!this.editingPharmacy || !this.editingPharmacy.id) return;

    const pharmacyId = this.editingPharmacy.id;
    this.saving = true;
    this.stepError = null;

    const v = this.addForm.getRawValue();

    const payload: PharmacyModel = {
      ...this.editingPharmacy,
      name: v.name!,
      address: v.address || undefined,
      description: v.description || undefined,
      latitude: this.editingPharmacy.latitude,
      longitude: this.editingPharmacy.longitude,
    };

    this.service.update(pharmacyId, payload as any).subscribe({
      next: (updated) => {
        // Upload banner if provided
        const uploadBanner = this.bannerFile
          ? this.service.uploadImages(pharmacyId, { banner: this.bannerFile })
          : null;

        // Upload logo if provided
        const uploadLogo = this.logoFile
          ? this.service.uploadImages(pharmacyId, { logo: this.logoFile })
          : null;

        const uploads = [uploadBanner, uploadLogo].filter((u) => u !== null);

        if (uploads.length === 0) {
          this.finishPharmacyUpdate(updated);
          return;
        }

        // Wait for all uploads
        Promise.all(
          uploads.map((upload) =>
            upload!.toPromise().catch((err) => {
              console.error('Upload error:', err);
              return null;
            })
          )
        ).then(() => {
          this.finishPharmacyUpdate(updated);
        });
      },
      error: (err) => {
        console.error(err);
        this.stepError = 'Failed to update pharmacy';
        this.saving = false;
      },
    });
  }

  private finishPharmacyUpdate(updated: PharmacyModel): void {
    const index = this.pharmacies.findIndex(p => p.id === this.editingPharmacy!.id);
    if (index !== -1) {
      this.pharmacies[index] = updated;
    }
    this.saving = false;
    this.msg.success('Pharmacy info updated successfully');
    this.isAddModalOpen = false;
    this.editingPharmacy = null;
    this.cdr.detectChanges();
  }

  initializeMap(): void {
    if (this.map || !this.mapContainer) return;

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const container = this.mapContainer?.nativeElement;
        if (!container) return;

        const lat = this.addForm.get('latitude')?.value || 36.8065;
        const lng = this.addForm.get('longitude')?.value || 10.1815;

        this.map = L.map(container).setView([lat, lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap',
        }).addTo(this.map);

        // Configure leaflet default icons with CDN
        const defaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        this.marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(this.map);

        this.map.on('click', (e: L.LeafletMouseEvent) => {
          this.ngZone.run(() => {
            this.setCoordinates(e.latlng.lat, e.latlng.lng);
          });
        });
      }, 100);
    });
  }

  getGeolocation(): void {
    if (!navigator.geolocation) {
      this.msg.error('Geolocation is not supported by your browser');
      return;
    }

    this.msg.loading('Getting your location (acquiring GPS)...', { nzDuration: 0 });

    // High accuracy geolocation options
    const geoOptions = {
      enableHighAccuracy: true,   // Force GPS
      timeout: 45000,              // Wait up to 45 seconds for GPS
      maximumAge: 0,               // Don't use cached location
    };

    let bestAccuracy = Infinity;
    let bestPosition: GeolocationCoordinates | null = null;
    let watchId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout>;
    let updateCount = 0;

    // Watch position continuously and use the best one
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        updateCount++;
        console.log(`[${updateCount}] Location accuracy: ±${accuracy.toFixed(0)} meters`);

        // Keep track of best (most accurate) position
        if (accuracy < bestAccuracy) {
          bestAccuracy = accuracy;
          bestPosition = position.coords;
          
          // If we get within 1km accuracy, use it immediately
          if (accuracy < 1000) {
            clearTimeout(timeoutId);
            this.finishGetGeolocation(bestPosition, watchId);
          }
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        this.ngZone.run(() => {
          this.msg.remove();
          console.error('Geolocation error:', error);
          this.msg.error('Could not get your location. Please try again or select manually on the map.');
        });
      },
      geoOptions
    );

    // Set timeout to use best position after 15 seconds
    timeoutId = setTimeout(() => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (bestPosition) {
        this.finishGetGeolocation(bestPosition, null);
      } else {
        this.ngZone.run(() => {
          this.msg.remove();
          this.msg.error('Could not determine your location. Please try again or select manually on the map.');
        });
      }
    }, 15000);
  }

  private finishGetGeolocation(coords: GeolocationCoordinates, watchId: number | null): void {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    this.ngZone.run(() => {
      this.msg.remove();
      const lat = coords.latitude;
      const lng = coords.longitude;
      const accuracy = coords.accuracy;
      
      // Show warning if accuracy is poor
      if (accuracy > 10000) {
        this.msg.warning(`Approximate location (±${(accuracy / 1000).toFixed(0)}km). Click on map to adjust.`);
      } else if (accuracy > 1000) {
        this.msg.info(`Location found (±${(accuracy / 1000).toFixed(1)}km accuracy). Click on map to adjust.`);
      } else {
        this.msg.success(`Location found (±${accuracy.toFixed(0)}m accuracy)`);
      }
      
      this.setCoordinates(lat, lng);
    });
  }

  private setCoordinates(lat: number, lng: number): void {
    // Defer form updates to next macrotask to avoid change detection errors
    setTimeout(() => {
      this.addForm.get('latitude')?.setValue(Math.round(lat * 100000) / 100000);
      this.addForm.get('longitude')?.setValue(Math.round(lng * 100000) / 100000);
      this.cdr.markForCheck();
    }, 0);

    // Update map immediately (outside of form change detection)
    if (this.marker && this.map) {
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], 13);
    }
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

  editInfo(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    if (!p.id) return;
    this.editingPharmacy = p;
    this.modalMode = 'editInfo';
    this.currentStep = 0;
    this.stepError = null;
    this.bannerFileList = [];
    this.logoFileList = [];
    this.bannerFile = null;
    this.logoFile = null;

    // Load existing banner and logo if they exist
    if (p.bannerUrl) {
      this.bannerFileList = [
        {
          uid: '-1',
          name: 'banner',
          status: 'done',
          url: p.bannerUrl,
        } as any,
      ];
    }

    if (p.logoUrl) {
      this.logoFileList = [
        {
          uid: '-2',
          name: 'logo',
          status: 'done',
          url: p.logoUrl,
        } as any,
      ];
    }

    this.addForm.reset({
      name: p.name || '',
      address: p.address || '',
      description: p.description || '',
      latitude: p.latitude || null,
      longitude: p.longitude || null,
    });
    this.isAddModalOpen = true;
  }

  changeCoordinates(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    if (!p.id) return;
    this.editingPharmacy = p;
    this.modalMode = 'changeCoordinates';
    this.currentStep = 1;
    this.map = null; // Reset map instance
    this.marker = null;
    this.stepError = null;
    this.addForm.reset({
      name: p.name || '',
      address: p.address || '',
      description: p.description || '',
      latitude: p.latitude || null,
      longitude: p.longitude || null,
    });
    this.isAddModalOpen = true;
    this.cdr.detectChanges();
    this.initializeMap();
  }

  delete(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    if (!p.id) return;
    
    const pharmacyId = p.id;
    this.msg.loading('Deleting pharmacy...', { nzDuration: 0 });
    
    this.service.delete(pharmacyId).subscribe({
      next: () => {
        this.msg.remove();
        this.msg.success('Pharmacy deleted successfully');
        this.pharmacies = this.pharmacies.filter(ph => ph.id !== pharmacyId);
        this.rateMap.delete(pharmacyId);
        this.liked.delete(pharmacyId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.msg.remove();
        this.msg.error('Failed to delete pharmacy');
      },
    });
  }
}