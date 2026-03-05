import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  NgZone,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NzIconModule, NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  EnvironmentOutline,
  PushpinOutline,
  MoreOutline,
  HeartOutline,
  HeartFill,
  PlusOutline,
  CheckCircleFill,
  CloseCircleFill,
  PictureOutline,
  UploadOutline,
} from '@ant-design/icons-angular/icons';

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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { PharmacyService } from './services/pharmacy.service';
import { MedicationService } from './services/medication.service';
import { DeepSeekService } from './services/deepseek.service';
import { AgentMessageService } from './services/agent-message.service';
import { AgentLogService } from './services/agent-log.service';
import { WorkingHoursService } from './services/working-hours.service';
import { RatingService } from './services/rating.service';
import { ReportService } from './services/report.service';
import { PharmacistService } from '../../core/services/pharmacy/pharmacist.service';
import { Pharmacy as PharmacyModel } from './models/pharmacy.model';
import { MedicationModel } from './models/medication.model';
import { Rating } from './models/rating.model';
import { Report, ReportReason } from './models/report.model';
import { AgentMessage } from './models/agent-message.model';
import { AgentLog } from './models/agent-log.model';
import { FormsModule } from '@angular/forms';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { PictureTwoTone } from '@ant-design/icons-angular/icons';
import { Medication } from './medication/medication';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    NzCheckboxModule,
    NzDrawerModule,
    NzProgressModule,
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
        UploadOutline,
      ],
    },
  ],
  templateUrl: './pharmacy.html',
  styleUrl: './pharmacy.css',
})
export class Pharmacy implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef;

  private readonly service = inject(PharmacyService);
  private readonly workingHoursService = inject(WorkingHoursService);
  private readonly ratingService = inject(RatingService);
  private readonly reportService = inject(ReportService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly ngZone = inject(NgZone);
  private readonly keycloakService = inject(KeycloakService);
  private readonly medicationService = inject(MedicationService);
  private readonly deepSeekService = inject(DeepSeekService);
  private readonly agentMessageService = inject(AgentMessageService);
  private readonly agentLogService = inject(AgentLogService);
  private readonly pharmacistService = inject(PharmacistService);

  map: L.Map | null = null;
  marker: L.Marker | null = null;

  pharmacies: PharmacyModel[] = [];
  loading = false;
  errorMsg: string | null = null;
  userPharmacy: PharmacyModel | null = null;
  loadingPharmacist = false;

  liked = new Set<number>();
  rateMap = new Map<number, number>();
  private ratingByPharmacy = new Map<number, Rating>();
  private readonly currentUsername = this.keycloakService.getEmail() ?? '';
  readonly userRole = this.keycloakService.getUserRole();
  pharmacyStatus = new Map<number, { isOpen: boolean; isClosed: boolean }>();

  isRatingModalOpen = false;
  selectedRatingPharmacy: PharmacyModel | null = null;
  pendingRatingValue = 0;
  pendingRatingComment = '';
  submittingRating = false;

  isReportModalOpen = false;
  selectedReportPharmacy: PharmacyModel | null = null;
  selectedReportReason: ReportReason | null = null;
  reportDescription = '';
  submittingReport = false;
  readonly reportReasonOptions: Array<{ value: ReportReason; label: string }> = [
    { value: ReportReason.FALSE_LOCATION, label: 'False location' },
    { value: ReportReason.BAD_SERVICE, label: 'Bad service' },
    { value: ReportReason.STOCK_INCONSISTENCY, label: 'Stock inconsistency' },
    { value: ReportReason.FAKE_PHARMACY, label: 'Fake pharmacy' },
    { value: ReportReason.WRONG_CONTACT_INFO, label: 'Wrong contact info' },
    { value: ReportReason.OTHER, label: 'Other' },
  ];

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

  // Requested medications state
  requestedMedications: MedicationModel[] = [];
  requestedLoading = false;
  requestedPageIndex = 1;
  requestedPageSize = 10;
  requestedSearchText = '';
  requestedTherapeuticClass = '';
  requestedMainView: 'requests' | 'agent-logs' = 'requests';
  agentMode = false;
  autoDeleteReviewRequired = false;
  requestedSettingsLoading = false;
  private requestedSettingsSeq = 0;
  agentMessages = new Map<number, AgentMessage>(); // medicationId -> AgentMessage

  // Agent logs state
  agentLogs: AgentLog[] = [];
  agentLogsLoading = false;

  // Medication detail modal state
  isMedicationDetailModalOpen = false;
  selectedMedicationForDetail: MedicationModel | null = null;

  // AI Drawer state
  aiDrawerVisible = false;
  aiDrawerLoading = false;
  aiOverviewData: any = null;
  parsedAIData: any = null;
  selectedMedicationForAI: MedicationModel | null = null;

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
  uploadProgress = 0;
  isUploading = false;

  addForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    contactInfo: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    latitude: [null as number | null, [Validators.required]],
    longitude: [null as number | null, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadPharmacies();
    // If user is pharmacist, load their pharmacy
    if (this.userRole === 'ROLE_PHARMACY') {
      this.loadPharmacistPharmacy();
    }
  }

  isOwnPharmacy(pharmacyId: number | null | undefined): boolean {
    if (this.userRole !== 'ROLE_PHARMACY') return false;
    if (!pharmacyId) return false;
    return this.userPharmacy?.id === pharmacyId;
  }

  loadPharmacistPharmacy(): void {
    const userId = this.keycloakService.getUserId();
    if (!userId) {
      this.loadingPharmacist = false;
      return;
    }

    this.loadingPharmacist = true;
    this.pharmacistService.getPharmacistByUserId(userId).subscribe({
      next: (pharmacist) => {
        const pharmacyId = pharmacist?.pharmacyId ?? null;
        if (!pharmacyId) {
          this.userPharmacy = null;
          this.loadingPharmacist = false;
          return;
        }

        this.service.getById(pharmacyId).subscribe({
          next: (pharmacy) => {
            this.userPharmacy = pharmacy;
            this.loadingPharmacist = false;
          },
          error: () => {
            this.userPharmacy = null;
            this.loadingPharmacist = false;
          },
        });
      },
      error: () => {
        this.userPharmacy = null;
        this.loadingPharmacist = false;
      },
    });
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
          p.description?.toLowerCase().includes(search),
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
      !this.inventoryMedications.some(
        (medication) => medication.name === this.inventoryMedicationName,
      )
    ) {
      this.inventoryMedicationName = '';
    }
  }

  get inventoryTherapeuticClassOptions(): string[] {
    return Array.from(
      new Set(
        this.inventoryMedications
          .map((medication) => medication.therapeuticClass)
          .filter((value): value is string => !!value),
      ),
    );
  }

  get inventoryMedicationOptions(): string[] {
    return Array.from(
      new Set(
        this.inventoryMedications
          .map((medication) => medication.name)
          .filter((value): value is string => !!value),
      ),
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

    // Tab 0: Pharmacies list
    if (tabIndex === 0) {
      this.loadPharmacies();
    }

    // Tab 1: Inventory medications
    if (tabIndex === 1) {
      if (!this.inventoryPharmacyId && this.pharmacies.length > 0) {
        this.inventoryPharmacyId = this.pharmacies[0].id ?? null;
      }
      // Trigger inventory refresh via change detection
      this.loadInventoryMedications();
    }

    // Tab 2: Requested medications
    if (tabIndex === 2) {
      this.requestedMainView = 'requests';
      // Load both settings together and hide switches until loaded.
      // This prevents visible "flips" caused by async config responses.
      this.requestedSettingsLoading = true;
      const seq = ++this.requestedSettingsSeq;
      forkJoin({
        agent: this.service.getAgentMode().pipe(
          catchError((err: any) => {
            console.error('Failed to load agent mode config:', err);
            return of({ agentModeEnabled: this.agentMode });
          }),
        ),
        autoDelete: this.service.getAutoDeleteReviewRequired().pipe(
          catchError((err: any) => {
            console.error('Failed to load auto-delete config:', err);
            return of({ autoDeleteReviewRequired: this.autoDeleteReviewRequired });
          }),
        ),
      }).subscribe(({ agent, autoDelete }) => {
        setTimeout(() => {
          if (seq !== this.requestedSettingsSeq) return;
          this.agentMode = !!agent.agentModeEnabled;
          this.autoDeleteReviewRequired = !!autoDelete.autoDeleteReviewRequired;
          this.requestedSettingsLoading = false;
          this.cdr.detectChanges();
        }, 0);
      });

      this.loadRequestedMedications();
      this.loadAgentLogs();
    }
  }

  setRequestedMainView(view: 'requests' | 'agent-logs'): void {
    this.requestedMainView = view;
    if (view === 'agent-logs') {
      this.loadAgentLogs();
    }
  }

  getAgentActionLabel(actionType: string): string {
    switch (actionType) {
      case 'DELETE':
        return 'DELETE';
      case 'PATCH_AND_ACCEPT':
        return 'PATCH & ACCEPT';
      case 'ACCEPT':
        return 'ACCEPT';
      case 'REVIEW_REQUIRED':
        return 'REVIEW REQUIRED';
      default:
        return actionType;
    }
  }

  getAgentActionColor(actionType: string): string {
    switch (actionType) {
      case 'DELETE':
        return '#ff4d4f';
      case 'PATCH_AND_ACCEPT':
        return '#faad14';
      case 'ACCEPT':
        return '#52c41a';
      case 'REVIEW_REQUIRED':
        return '#1890ff';
      default:
        return '#d9d9d9';
    }
  }

  onAgentModeToggle(enabled: boolean): void {
    const previous = this.agentMode;
    this.agentMode = enabled;

    this.service.updateAgentMode(enabled).subscribe({
      next: (config) => {
        this.agentMode = !!config.agentModeEnabled;
        console.log('Agent mode setting saved:', this.agentMode);
      },
      error: (err: any) => {
        console.error('Failed to save agent mode setting:', err);
        this.agentMode = previous;
        this.msg.error('Failed to save agent mode');
      },
    });
  }

  onAutoDeleteReviewRequiredToggle(enabled: boolean): void {
    const previous = this.autoDeleteReviewRequired;
    this.autoDeleteReviewRequired = enabled;

    // IMPORTANT: Auto-delete is independent from Agent Mode.
    // Do not force agentMode to follow autoDelete (that caused the "self-changing" switches).
    this.service.updateAutoDeleteReviewRequired(enabled).subscribe({
      next: (config) => {
        this.autoDeleteReviewRequired = !!config.autoDeleteReviewRequired;
        console.log('Auto-delete review required setting saved:', this.autoDeleteReviewRequired);
        this.msg.success(
          `Auto-delete review required ${this.autoDeleteReviewRequired ? 'enabled' : 'disabled'}`,
        );
      },
      error: (err: any) => {
        console.error('Failed to save auto-delete setting:', err);
        this.autoDeleteReviewRequired = previous;
        this.msg.error('Failed to save setting');
      },
    });
  }

  loadAgentLogs(): void {
    this.agentLogsLoading = true;
    this.agentLogService.getAllLogs().subscribe({
      next: (logs) => {
        this.agentLogs = logs;
        this.agentLogsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load agent logs:', err);
        this.agentLogsLoading = false;
        this.msg.error('Failed to load agent logs');
      },
    });
  }

  deleteAgentLog(log: AgentLog, event?: MouseEvent): void {
    event?.stopPropagation();

    if (!log.id) return;

    this.agentLogService.deleteLog(log.id).subscribe({
      next: () => {
        this.msg.success('Agent log deleted successfully');
        this.agentLogs = this.agentLogs.filter((l) => l.id !== log.id);
        this.cdr.detectChanges();
        // Refresh lists after deleting log
        this.loadRequestedMedications();
      },
      error: (err: any) => {
        console.error('Failed to delete agent log:', err);
        this.msg.error('Failed to delete agent log');
      },
    });
  }

  undoAgentAction(log: AgentLog, event?: MouseEvent): void {
    event?.stopPropagation();

    if (!log.id) return;

    this.agentLogService.undoAction(log.id).subscribe({
      next: () => {
        this.msg.success('Action undone successfully');
        this.loadAgentLogs();
        this.loadRequestedMedications();
        // Refresh inventory if in that tab
        if (this.activeTabIndex === 1) {
          this.loadInventoryMedications();
        }
      },
      error: (err: any) => {
        console.error('Failed to undo action:', err);
        this.msg.error('Failed to undo action');
      },
    });
  }

  private loadInventoryMedications(): void {
    // Trigger change detection to refresh embedded inventory view.
    // (Requested: always run when switching to Inventory tab.)
    this.cdr.detectChanges();
  }

  formatAgentLogAction(actionType: string): string {
    switch (actionType) {
      case 'ACCEPTED':
        return 'Accepted';
      case 'REJECTED':
        return 'Rejected';
      case 'MODIFIED':
        return 'Modified & Accepted';
      case 'REVIEW_REJECTED':
        return 'Rejected (Review Required)';
      default:
        return actionType;
    }
  }

  getAgentLogActionColor(actionType: string): string {
    switch (actionType) {
      case 'ACCEPTED':
        return '#52c41a';
      case 'REJECTED':
        return '#ff4d4f';
      case 'MODIFIED':
        return '#faad14';
      case 'REVIEW_REJECTED':
        return '#ff4d4f';
      default:
        return '#d9d9d9';
    }
  }

  // ========== Requested Medications ==========

  loadRequestedMedications(): void {
    this.requestedLoading = true;
    this.medicationService.getPendingMedications().subscribe({
      next: (medications) => {
        this.requestedMedications = medications ?? [];
        this.requestedLoading = false;
        this.cdr.detectChanges();

        // Always load agent messages for requested medications
        this.loadAgentMessages();
      },
      error: (err) => {
        console.error(err);
        this.requestedLoading = false;
      },
    });
  }

  loadAgentMessages(): void {
    this.requestedMedications.forEach((med) => {
      if (med.id) {
        this.agentMessageService.getMessageForMedication(med.id).subscribe({
          next: (message) => {
            if (med.id) {
              this.agentMessages.set(med.id, message);
            }
          },
          error: (err) => {
            // Silently ignore if no message found
            console.debug('No agent message for medication', med.id, err);
          },
        });
      }
    });
  }

  get paginatedRequestedMedications(): MedicationModel[] {
    let filtered = [...this.requestedMedications];

    // Search filter
    if (this.requestedSearchText.trim()) {
      const search = this.requestedSearchText.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name?.toLowerCase().includes(search) || m.description?.toLowerCase().includes(search),
      );
    }

    // Therapeutic class filter
    if (this.requestedTherapeuticClass) {
      filtered = filtered.filter((m) => m.therapeuticClass === this.requestedTherapeuticClass);
    }

    const start = (this.requestedPageIndex - 1) * this.requestedPageSize;
    return filtered.slice(start, start + this.requestedPageSize);
  }

  acceptMedicationRequest(medication: MedicationModel): void {
    if (!medication.id) return;
    this.medicationService.acceptMedicationRequest(medication.id).subscribe({
      next: () => {
        this.msg.success(`"${medication.name}" accepted`);
        this.loadRequestedMedications();
        this.loadAgentLogs();
        // Refresh inventory if in that tab
        if (this.activeTabIndex === 1) {
          this.loadInventoryMedications();
        }
      },
      error: (err) => {
        console.error(err);
        this.msg.error('Failed to accept medication request');
      },
    });
  }

  patchAndAcceptMedication(medication: MedicationModel): void {
    if (!medication.id) return;

    // Call backend endpoint that patches and accepts in one transaction
    this.medicationService.patchAndAcceptMedication(medication.id).subscribe({
      next: () => {
        this.msg.success(`"${medication.name}" patched and accepted`);
        this.loadRequestedMedications();
        this.loadAgentLogs();
        // Refresh inventory if in that tab
        if (this.activeTabIndex === 1) {
          this.loadInventoryMedications();
        }
      },
      error: (err) => {
        console.error(err);
        this.msg.error('Failed to patch and accept medication');
      },
    });
  }

  rejectMedicationRequest(medication: MedicationModel): void {
    if (!medication.id) return;
    this.medicationService.delete(medication.id).subscribe({
      next: () => {
        this.msg.success(`"${medication.name}" rejected`);
        this.loadRequestedMedications();
        this.loadAgentLogs();
      },
      error: (err) => {
        console.error(err);
        this.msg.error('Failed to reject medication request');
      },
    });
  }

  openMedicationDetail(medication: MedicationModel): void {
    this.selectedMedicationForDetail = medication;
    this.isMedicationDetailModalOpen = true;
  }

  closeMedicationDetailModal(): void {
    this.isMedicationDetailModalOpen = false;
    this.selectedMedicationForDetail = null;
  }

  openAIOverview(medication: MedicationModel, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!medication.id) return;

    this.selectedMedicationForAI = medication;
    this.aiDrawerVisible = true;
    this.aiDrawerLoading = true;
    this.aiOverviewData = null;
    this.parsedAIData = null;
    this.cdr.markForCheck();

    this.deepSeekService.giveMedicationAiOverview(medication.id).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.aiOverviewData = data;
          this.parsedAIData = this.parseAIResponse(data);
          this.aiDrawerLoading = false;
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error(err);
          this.msg.error('Failed to load AI overview');
          this.aiDrawerLoading = false;
          this.closeAIDrawer();
          this.cdr.markForCheck();
        });
      },
    });
  }

  parseAIResponse(data: any): any {
    try {
      if (!data) {
        return null;
      }

      // If backend already returned parsed JSON (Map serialized to object), use it directly.
      if (typeof data === 'object') {
        const maybe = data as any;
        if (
          typeof maybe.summary === 'string' ||
          Array.isArray(maybe.indications) ||
          Array.isArray(maybe.sideEffects) ||
          Array.isArray(maybe.contraindications)
        ) {
          return maybe;
        }
      }

      // Otherwise try to parse from raw string fields.
      const rawText: unknown = typeof data === 'string' ? data : (data as any).raw;
      if (typeof rawText !== 'string' || rawText.trim().length === 0) {
        return null;
      }

      const raw = rawText.trim();

      // 1) Direct JSON
      try {
        return JSON.parse(raw);
      } catch {
        // continue
      }

      // 2) Extract JSON from markdown code block
      const fencedMatch = raw.match(/```json\s*([\s\S]*?)\s*```/i);
      if (fencedMatch?.[1]) {
        try {
          return JSON.parse(fencedMatch[1].trim());
        } catch {
          // continue
        }
      }

      // 3) Extract first JSON object from mixed response
      const extracted = this.extractFirstJsonObject(raw);
      if (extracted) {
        try {
          return JSON.parse(extracted);
        } catch {
          // continue
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return null;
    }
  }

  private extractFirstJsonObject(text: string): string | null {
    const start = text.indexOf('{');
    if (start < 0) {
      return null;
    }

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < text.length; i++) {
      const c = text[i];

      if (inString) {
        if (escape) {
          escape = false;
          continue;
        }
        if (c === '\\') {
          escape = true;
          continue;
        }
        if (c === '"') {
          inString = false;
        }
        continue;
      }

      if (c === '"') {
        inString = true;
        continue;
      }

      if (c === '{') {
        depth++;
      } else if (c === '}') {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }

    return null;
  }

  closeAIDrawer(): void {
    this.aiDrawerVisible = false;
    this.selectedMedicationForAI = null;
    this.aiOverviewData = null;
    this.parsedAIData = null;
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    // Map will be initialized when step 1 is reached
  }

  loadPharmacies(): void {
    this.loading = true;
    this.errorMsg = null;

    this.service.getAll().subscribe({
      next: (list) => {
        this.pharmacies = list ?? [];
        this.loadRatingsState();
        if (!this.inventoryPharmacyId && this.pharmacies.length > 0) {
          this.inventoryPharmacyId = this.pharmacies[0].id ?? null;
        }

        // Load status for each pharmacy
        this.pharmacies.forEach((pharmacy) => {
          if (pharmacy.id) {
            this.loadPharmacyStatus(pharmacy.id);
          }
        });

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
      return { isOpen: false, isClosed: true };
    }

    const now = new Date();
    const currentDay = now.getDay();
    const dayOfWeek = currentDay === 0 ? 6 : currentDay - 1;
    const dayNames = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const todayString = dayNames[dayOfWeek];

    const todaySchedule = workingHours.find((wh: any) => wh.dayOfWeek === todayString);

    if (!todaySchedule) {
      return { isOpen: false, isClosed: true };
    }

    if (todaySchedule.isClosed) {
      return { isOpen: false, isClosed: true };
    }

    if (!todaySchedule.openTime || !todaySchedule.closeTime) {
      return { isOpen: false, isClosed: true };
    }

    const [openHour, openMin] = todaySchedule.openTime.split(':').map(Number);
    const [closeHour, closeMin] = todaySchedule.closeTime.split(':').map(Number);

    const openDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), openHour, openMin);
    const closeDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      closeHour,
      closeMin,
    );

    const isOpen = now >= openDate && now < closeDate;

    return { isOpen, isClosed: !isOpen };
  }

  private loadRatingsState(): void {
    if (!this.currentUsername) {
      return;
    }

    this.ratingService.getAll().subscribe({
      next: (ratings) => {
        this.rateMap.clear();
        this.liked.clear();
        this.ratingByPharmacy.clear();

        const ratingsByPharmacy = new Map<number, Rating[]>();
        (ratings ?? []).forEach((rating) => {
          const pharmacyId = (rating.pharmacy as any)?.id;
          if (!pharmacyId) return;

          if (!ratingsByPharmacy.has(pharmacyId)) {
            ratingsByPharmacy.set(pharmacyId, []);
          }
          ratingsByPharmacy.get(pharmacyId)!.push(rating);

          if (rating.username === this.currentUsername) {
            this.ratingByPharmacy.set(pharmacyId, rating);
            // Only set rating if it exists and is valid
            const validRating = rating.rating && rating.rating > 0 ? rating.rating : 0;
            if (validRating > 0) {
              this.rateMap.set(pharmacyId, validRating);
            }
            if (rating.isFavorite) {
              this.liked.add(pharmacyId);
            }
          }
        });

        this.pharmacies.forEach((pharmacy) => {
          if (!pharmacy.id) return;
          // Only calculate average if this pharmacy doesn't already have current user's rating
          if (this.rateMap.has(pharmacy.id)) return;

          const pharmacyRatings = (ratingsByPharmacy.get(pharmacy.id) ?? [])
            .map((rating) => Number(rating.rating ?? 0))
            .filter((value) => value > 0);
          if (pharmacyRatings.length > 0) {
            const average =
              pharmacyRatings.reduce((sum, value) => sum + value, 0) / pharmacyRatings.length;
            this.rateMap.set(pharmacy.id, Math.round(average));
          } else {
            // Ensure null/undefined ratings still get initialized to 0
            if (!this.rateMap.has(pharmacy.id)) {
              this.rateMap.set(pharmacy.id, 0);
            }
          }
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load rating state:', err);
      },
    });
  }

  getRate(id: number): number {
    const rate = this.rateMap.get(id);
    return rate === undefined || rate === null ? 0 : rate;
  }

  setRate(pharmacy: PharmacyModel, value: number): void {
    if (!pharmacy.id) return;
    this.selectedRatingPharmacy = pharmacy;
    this.pendingRatingValue = Math.max(1, Math.min(5, Math.round(value || 0)));
    const existing = this.ratingByPharmacy.get(pharmacy.id);
    this.pendingRatingComment = existing?.comment ?? '';
    this.isRatingModalOpen = true;
  }

  cancelRatingModal(): void {
    this.isRatingModalOpen = false;
    this.selectedRatingPharmacy = null;
    this.pendingRatingValue = 0;
    this.pendingRatingComment = '';
  }

  submitRating(): void {
    if (!this.selectedRatingPharmacy?.id) return;
    if (!this.currentUsername) {
      this.msg.error('Unable to get current user email from authentication.');
      return;
    }
    if (this.pendingRatingValue < 1 || this.pendingRatingValue > 5) {
      this.msg.error('Please choose a rating between 1 and 5.');
      return;
    }

    const pharmacyId = this.selectedRatingPharmacy.id;
    const existing = this.ratingByPharmacy.get(pharmacyId);
    const payload: Rating = {
      rating: this.pendingRatingValue,
      username: this.currentUsername,
      comment: this.pendingRatingComment?.trim() || null,
      isFavorite: existing?.isFavorite ?? false,
      pharmacy: { id: pharmacyId },
    };

    this.submittingRating = true;

    const request = existing?.id
      ? this.ratingService.update(existing.id, payload)
      : this.ratingService.create(payload);

    request.subscribe({
      next: () => {
        queueMicrotask(() => {
          this.submittingRating = false;
          this.cdr.markForCheck();
          this.msg.success('Rating submitted successfully');
          this.cancelRatingModal();
          this.loadRatingsState();
        });
      },
      error: (err) => {
        console.error(err);
        this.submittingRating = false;
        this.msg.error('Failed to submit rating');
      },
    });
  }

  openAddModal(): void {
    if (this.userRole === 'ROLE_PHARMACY' && this.userPharmacy) {
      this.msg.error('You already have a pharmacy.');
      return;
    }

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
      description: '',
      contactInfo: '',
      address: '',
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
      this.addForm.get('name')?.markAsTouched();
      this.addForm.get('description')?.markAsTouched();
      this.addForm.get('contactInfo')?.markAsTouched();

      if (
        this.addForm.get('name')?.invalid ||
        this.addForm.get('description')?.invalid ||
        this.addForm.get('contactInfo')?.invalid
      ) {
        this.stepError = 'Please fill all required fields correctly';
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
      this.addForm.get('address')?.markAsTouched();
      const lat = this.addForm.get('latitude')!.value;
      const lng = this.addForm.get('longitude')!.value;

      if (this.addForm.get('address')?.invalid) {
        this.stepError = 'Please fill all required fields correctly';
        return;
      }

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

    this.addForm.get('address')?.markAsTouched();

    if (this.addForm.get('address')?.invalid) {
      this.stepError = 'Please fill all required fields correctly';
      return;
    }

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
      address: this.addForm.get('address')?.value || undefined,
      latitude: lat,
      longitude: lng,
    };

    this.service.updateLocation(this.editingPharmacy.id, payload).subscribe({
      next: (updated) => {
        const index = this.pharmacies.findIndex((p) => p.id === this.editingPharmacy!.id);
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
      contactInfo: v.contactInfo || undefined,
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

        const pharmacyId = created.id; // Store ID to properly narrow type

        // Upload both banner and logo in a single call if either is provided
        const hasImages = this.bannerFile || this.logoFile;

        if (!hasImages) {
          this.finishPharmacyCreation(created);
          return;
        }

        // Single upload call with both banner and logo
        this.service
          .uploadImages(pharmacyId, {
            banner: this.bannerFile || undefined,
            logo: this.logoFile || undefined,
          })
          .subscribe({
            next: () => {
              // Re-fetch the pharmacy to get updated banner/logo URLs
              this.service.getById(pharmacyId).subscribe({
                next: (refreshed) => {
                  this.finishPharmacyCreation(refreshed);
                  // Trigger change detection after pharmacy is refreshed with image URLs
                  this.cdr.detectChanges();
                },
                error: (err) => {
                  console.error('Failed to refresh pharmacy after image upload:', err);
                  this.finishPharmacyCreation(created);
                },
              });
            },
            error: (err) => {
              console.error('Upload error:', err);
              this.msg.error('Failed to upload images');
              this.finishPharmacyCreation(created);
            },
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

    // If user is a pharmacist, assign this pharmacy to their profile
    if (this.userRole === 'ROLE_PHARMACY' && created?.id) {
      const userId = this.keycloakService.getUserId();
      if (userId) {
        this.pharmacistService.assignPharmacyToUser(userId, created.id).subscribe({
          next: () => {
            this.userPharmacy = created;
            console.log('Pharmacy assigned to pharmacist');
          },
          error: (err) => {
            console.error('Failed to assign pharmacy to pharmacist:', err);
          },
        });
      }
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
      name: v.name!,
      description: v.description || undefined,
      contactInfo: v.contactInfo || undefined,
    };

    this.service.updateInfo(pharmacyId, payload).subscribe({
      next: (updated) => {
        // Upload both banner and logo in a single call if either is provided
        const hasImages = this.bannerFile || this.logoFile;

        if (!hasImages) {
          this.finishPharmacyUpdate(updated);
          return;
        }

        // Single upload call with both banner and logo
        this.service
          .uploadImages(pharmacyId, {
            banner: this.bannerFile || undefined,
            logo: this.logoFile || undefined,
          })
          .subscribe({
            next: () => {
              // Re-fetch the pharmacy to get updated banner/logo URLs
              this.service.getById(pharmacyId).subscribe({
                next: (refreshed) => {
                  this.finishPharmacyUpdate(refreshed);
                  // Trigger change detection after pharmacy is refreshed with image URLs
                  this.cdr.detectChanges();
                },
                error: (err) => {
                  console.error('Failed to refresh pharmacy after image upload:', err);
                  this.finishPharmacyUpdate(updated);
                },
              });
            },
            error: (err) => {
              console.error('Upload error:', err);
              this.msg.error('Failed to upload images');
              this.finishPharmacyUpdate(updated);
            },
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
    const index = this.pharmacies.findIndex((p) => p.id === this.editingPharmacy!.id);
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
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
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
      enableHighAccuracy: true, // Force GPS
      timeout: 45000, // Wait up to 45 seconds for GPS
      maximumAge: 0, // Don't use cached location
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
          this.msg.error(
            'Could not get your location. Please try again or select manually on the map.',
          );
        });
      },
      geoOptions,
    );

    // Set timeout to use best position after 15 seconds
    timeoutId = setTimeout(() => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (bestPosition) {
        this.finishGetGeolocation(bestPosition, null);
      } else {
        this.ngZone.run(() => {
          this.msg.remove();
          this.msg.error(
            'Could not determine your location. Please try again or select manually on the map.',
          );
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
        this.msg.warning(
          `Approximate location (±${(accuracy / 1000).toFixed(0)}km). Click on map to adjust.`,
        );
      } else if (accuracy > 1000) {
        this.msg.info(
          `Location found (±${(accuracy / 1000).toFixed(1)}km accuracy). Click on map to adjust.`,
        );
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
    if (!this.currentUsername) {
      this.msg.error('Unable to get current user email from authentication.');
      return;
    }

    const existing = this.ratingByPharmacy.get(p.id);
    const newFavoriteValue = !this.liked.has(p.id);

    // Set rating to 0 if no valid rating exists, otherwise keep existing rating
    const payload: Rating = {
      rating: existing?.rating && existing.rating > 0 ? existing.rating : 0,
      username: this.currentUsername,
      comment: existing?.comment ?? null,
      isFavorite: newFavoriteValue,
      pharmacy: { id: p.id },
    };

    const request = existing?.id
      ? this.ratingService.update(existing.id, payload)
      : this.ratingService.create(payload);

    request.subscribe({
      next: () => {
        queueMicrotask(() => {
          // Create new Set reference to trigger change detection
          if (newFavoriteValue) {
            this.liked = new Set([...this.liked, p.id!]);
          } else {
            const newLiked = new Set(this.liked);
            newLiked.delete(p.id!);
            this.liked = newLiked;
          }
          this.cdr.markForCheck();
          this.msg.success(newFavoriteValue ? 'Added to favorites' : 'Removed from favorites');
          this.loadRatingsState();
        });
      },
      error: (err) => {
        console.error(err);
        this.msg.error('Failed to update favorite');
      },
    });
  }

  favorite(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    console.log('Favorite', p);
  }

  report(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    if (!p.id) return;

    if (this.userRole === 'ROLE_PHARMACY' && this.isOwnPharmacy(p.id)) {
      this.msg.error("You can't report your own pharmacy.");
      return;
    }

    this.selectedReportPharmacy = p;
    this.selectedReportReason = null;
    this.reportDescription = '';
    this.isReportModalOpen = true;
  }

  cancelReportModal(): void {
    this.isReportModalOpen = false;
    this.selectedReportPharmacy = null;
    this.selectedReportReason = null;
    this.reportDescription = '';
  }

  selectReportReason(reason: ReportReason): void {
    this.selectedReportReason = reason;
  }

  submitReport(): void {
    if (!this.selectedReportPharmacy?.id) return;
    if (!this.selectedReportReason) {
      this.msg.error('Please select a report reason.');
      return;
    }
    if (!this.currentUsername) {
      this.msg.error('Unable to get current user email from authentication.');
      return;
    }

    this.submittingReport = true;

    this.reportService
      .create({
        reason: this.selectedReportReason,
        description: this.reportDescription?.trim() || null,
        username: this.currentUsername,
        pharmacy: { id: this.selectedReportPharmacy.id },
      } as Report)
      .subscribe({
        next: () => {
          this.submittingReport = false;
          this.msg.success('Report submitted successfully');
          this.cancelReportModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.submittingReport = false;
          this.msg.error('Failed to submit report');
          this.cdr.detectChanges();
        },
      });
  }

  editInfo(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    if (!p.id) return;

    if (this.userRole === 'ROLE_PHARMACY' && !this.isOwnPharmacy(p.id)) {
      this.msg.error('You can only edit your own pharmacy.');
      return;
    }

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
      description: p.description || '',
      contactInfo: p.contactInfo || '',
      address: p.address || '',
      latitude: p.latitude || null,
      longitude: p.longitude || null,
    });
    this.isAddModalOpen = true;
  }

  changeCoordinates(p: PharmacyModel, ev?: MouseEvent): void {
    ev?.stopPropagation();
    if (!p.id) return;

    if (this.userRole === 'ROLE_PHARMACY' && !this.isOwnPharmacy(p.id)) {
      this.msg.error('You can only edit your own pharmacy.');
      return;
    }

    this.editingPharmacy = p;
    this.modalMode = 'changeCoordinates';
    this.currentStep = 1;
    this.map = null; // Reset map instance
    this.marker = null;
    this.stepError = null;
    this.addForm.reset({
      name: p.name || '',
      description: p.description || '',
      contactInfo: p.contactInfo || '',
      address: p.address || '',
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

    if (this.userRole === 'ROLE_PHARMACY' && !this.isOwnPharmacy(p.id)) {
      this.msg.error('You can only delete your own pharmacy.');
      return;
    }

    const pharmacyId = p.id;
    this.msg.loading('Deleting pharmacy...', { nzDuration: 0 });

    this.service.delete(pharmacyId).subscribe({
      next: () => {
        this.msg.remove();
        this.msg.success('Pharmacy deleted successfully');
        this.pharmacies = this.pharmacies.filter((ph) => ph.id !== pharmacyId);

        if (this.userRole === 'ROLE_PHARMACY' && this.userPharmacy?.id === pharmacyId) {
          this.userPharmacy = null;
        }

        this.rateMap.delete(pharmacyId);
        this.liked.delete(pharmacyId);
        this.ratingByPharmacy.delete(pharmacyId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.msg.remove();
        this.msg.error('Failed to delete pharmacy');
      },
    });
  }

  // Validation error display helpers
  getFieldError(fieldName: string): string | null {
    const control = this.addForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.addForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
