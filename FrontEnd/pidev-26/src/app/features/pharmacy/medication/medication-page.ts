import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';

import { PharmacyService } from '../services/pharmacy.service';
import { MedicationService } from '../services/medication.service';
import { MedicationStockService } from '../services/medication-stock.service';
import { InventoryTransactionService } from '../services/inventory-transaction.service';
import { WorkingHoursService } from '../services/working-hours.service';
import { RatingService } from '../services/rating.service';
import { ReportService } from '../services/report.service';
import { PharmacistService } from '../../../core/services/pharmacy/pharmacist.service';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { Pharmacy } from '../models/pharmacy.model';
import { MedicationModel } from '../models/medication.model';
import { MedicationStock } from '../models/medication-stock.model';
import { InventoryTransaction } from '../models/inventory-transaction.model';
import { DayOfWeek, WorkingHours } from '../models/working-hours.model';
import { Rating } from '../models/rating.model';
import { Report } from '../models/report.model';
import { StockCard } from './stock-card';
import { Medication } from './medication';

type Section = 'overview' | 'schedule' | 'reports' | 'logs';
type ScheduleMode = 'all' | 'weekdays' | 'weekends' | 'individual';

@Component({
  selector: 'app-medication-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzEmptyModule,
    NzSelectModule,
    NzInputModule,
    NzSwitchModule,
    NzSpinModule,
    NzTimePickerModule,
    NzModalModule,
    NzSliderModule,
    NzRadioModule,
    NzIconModule,
    NzTooltipModule,
    NzPaginationModule,
    NzRateModule,
    NzDividerModule,
    StockCard,
    Medication,
  ],
  templateUrl: './medication-page.html',
  styleUrl: './medication-page.css',
})
export class MedicationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pharmacyService = inject(PharmacyService);
  private readonly medicationService = inject(MedicationService);
  private readonly medicationStockService = inject(MedicationStockService);
  private readonly transactionService = inject(InventoryTransactionService);
  private readonly workingHoursService = inject(WorkingHoursService);
  private readonly ratingService = inject(RatingService);
  private readonly reportService = inject(ReportService);
  private readonly pharmacistService = inject(PharmacistService);
  private readonly msg = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly keycloakService = inject(KeycloakService);
  readonly userRole = this.keycloakService.getUserRole();

  @ViewChild('stockCards') stockCards?: StockCard;
  @ViewChild('medicationComponent') medicationComponent?: Medication;

  pharmacyId: number | null = null;
  pharmacy: Pharmacy | null = null;
  loading = false;
  errorMsg: string | null = null;
  createdByName: string | null = null;
  currentYear = new Date().getFullYear();

  activeSection: Section = 'overview';

  inventorySearchText = '';
  inventoryTherapeuticClass = '';
  inventoryMedicationName = '';
  inventoryOutOfStockOnly = false;
  inventoryMedications: MedicationModel[] = [];
  allInventoryMedications: MedicationModel[] = [];
  stocks: MedicationStock[] = [];
  transactions: InventoryTransaction[] = [];
  ratings: Rating[] = [];
  ratingDistribution: Array<{ stars: number; count: number; percentage: number }> = [];
  reports: Report[] = [];

  ratingPageIndex = 1;
  ratingPageSize = 5;
  reportPageIndex = 1;
  reportPageSize = 5;

  isTransactionModalOpen = false;
  selectedStock: MedicationStock | null = null;
  transactionQuantity = 0;
  transactionType: 'IN' | 'OUT' = 'IN';
  submittingTransaction = false;

  isAddMedicationModalOpen = false;
  selectedMedicationId: number | null = null;
  initialStock: number | null = null;
  addingMedicationToStock = false;

  isStockHistoryModalOpen = false;
  selectedHistoryStock: MedicationStock | null = null;
  stockHistorySeries: Array<{ label: string; value: number }> = [];

  // Validation error messages
  medicationSelectError: string | null = null;
  initialStockError: string | null = null;
  transactionQuantityError: string | null = null;

  readonly daysOfWeek: Array<{ key: DayOfWeek; label: string }> = [
    { key: DayOfWeek.MONDAY, label: 'Monday' },
    { key: DayOfWeek.TUESDAY, label: 'Tuesday' },
    { key: DayOfWeek.WEDNESDAY, label: 'Wednesday' },
    { key: DayOfWeek.THURSDAY, label: 'Thursday' },
    { key: DayOfWeek.FRIDAY, label: 'Friday' },
    { key: DayOfWeek.SATURDAY, label: 'Saturday' },
    { key: DayOfWeek.SUNDAY, label: 'Sunday' },
  ];

  scheduleMode: ScheduleMode = 'individual';
  selectedDay: DayOfWeek = DayOfWeek.MONDAY;
  currentOpenTime: Date | null = null;
  currentCloseTime: Date | null = null;
  workingHours: WorkingHours[] = [];
  savingSchedule = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('pharmacyId');
    this.pharmacyId = id ? Number(id) : null;

    if (!this.pharmacyId || Number.isNaN(this.pharmacyId)) {
      this.errorMsg = 'Invalid pharmacy id';
      return;
    }

    this.loadPharmacy(this.pharmacyId);
    this.loadPharmacistCreatedBy();
    this.loadInventoryCatalog();
    this.loadWorkingHours();
    this.loadTransactions();
    this.loadRatings();
    this.loadReports();
  }

  private loadInventoryCatalog(): void {
    this.medicationService.getAcceptedMedications().subscribe({
      next: (medications) => {
        this.allInventoryMedications = medications ?? [];
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  loadPharmacy(id: number): void {
    this.loading = true;
    this.errorMsg = null;

    this.pharmacyService.getById(id).subscribe({
      next: (pharmacy) => {
        this.pharmacy = pharmacy;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Failed to load pharmacy details';
        this.loading = false;
      },
    });
  }

  private loadPharmacistCreatedBy(): void {
    if (this.keycloakService.getUserRole() !== 'ROLE_PHARMACY') {
      return;
    }

    const userId = this.keycloakService.getUserId();
    if (!userId) {
      return;
    }

    this.pharmacistService.getPharmacistByUserId(userId).subscribe({
      next: (pharmacist) => {
        if (pharmacist && pharmacist.firstName && pharmacist.lastName) {
          this.createdByName = `${pharmacist.firstName} ${pharmacist.lastName}`;
        }
      },
      error: (err) => {
        console.error('Failed to load pharmacist info:', err);
      },
    });
  }

  setSection(section: Section): void {
    this.activeSection = section;
    if (section === 'schedule') {
      this.loadWorkingHours();
    }
    if (section === 'reports') {
      this.loadRatings();
      this.loadReports();
    }
  }

  clearOverviewFilters(): void {
    this.inventorySearchText = '';
    this.inventoryTherapeuticClass = '';
    this.inventoryMedicationName = '';
    this.inventoryOutOfStockOnly = false;
  }

  onInventoryMedicationsChange(medications: MedicationModel[]): void {
    this.inventoryMedications = medications ?? [];

    if (
      this.inventoryMedicationName &&
      !this.inventoryMedications.some((medication) => medication.name === this.inventoryMedicationName)
    ) {
      this.inventoryMedicationName = '';
    }
  }

  onStocksChange(stocks: MedicationStock[]): void {
    this.stocks = stocks ?? [];
  }

  openStockHistoryModal(stock: MedicationStock): void {
    this.selectedHistoryStock = stock;
    this.stockHistorySeries = this.buildStockHistorySeries(stock);
    this.isStockHistoryModalOpen = true;
  }

  closeStockHistoryModal(): void {
    this.isStockHistoryModalOpen = false;
    this.selectedHistoryStock = null;
    this.stockHistorySeries = [];
  }

  private buildStockHistorySeries(stock: MedicationStock): Array<{ label: string; value: number }> {
    const medicationId = (stock.medication as any)?.id;
    const medicationName = (stock.medication as any)?.name || 'Medication';
    if (!medicationId) {
      return [{ label: 'Current', value: stock.quantity ?? 0 }];
    }

    const related = [...this.transactions]
      .filter((transaction) => (transaction.medication as any)?.id === medicationId)
      .sort((a, b) => {
        const timeA = new Date(a.transactionAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.transactionAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

    let rollingQuantity = stock.quantity ?? 0;
    const reversePoints: Array<{ timestamp: string; value: number }> = [
      { timestamp: 'Now', value: rollingQuantity },
    ];

    related.forEach((transaction) => {
      const amount = Number(transaction.quantity ?? 0);
      if (transaction.type === 'IN') {
        rollingQuantity = Math.max(0, rollingQuantity - amount);
      } else {
        rollingQuantity += amount;
      }

      const timestamp = transaction.transactionAt || transaction.createdAt || '';
      reversePoints.push({ timestamp, value: rollingQuantity });
    });

    return reversePoints.reverse().map((point, index) => ({
      label: point.timestamp === 'Now'
        ? 'Now'
        : new Date(point.timestamp).toLocaleDateString(),
      value: point.value,
    })).map((point, index) => ({
      label: index === 0 ? `${medicationName} start` : point.label,
      value: point.value,
    }));
  }

  get stockHistoryPolylinePoints(): string {
    const points = this.stockHistorySeries;
    if (points.length === 0) return '';
    if (points.length === 1) return '40,160 560,160';

    const minValue = Math.min(...points.map((point) => point.value));
    const maxValue = Math.max(...points.map((point) => point.value));
    const range = Math.max(1, maxValue - minValue);

    return points
      .map((point, index) => {
        const x = 40 + (index * (520 / Math.max(1, points.length - 1)));
        const y = 180 - (((point.value - minValue) / range) * 140);
        return `${x},${y}`;
      })
      .join(' ');
  }

  get stockHistoryDotCoords(): Array<{ x: number; y: number }> {
    const points = this.stockHistorySeries;
    if (points.length === 0) return [];
    if (points.length === 1) return [{ x: 300, y: 160 }];

    const minValue = Math.min(...points.map((p) => p.value));
    const maxValue = Math.max(...points.map((p) => p.value));
    const range = Math.max(1, maxValue - minValue);

    return points.map((point, index) => ({
      x: 40 + (index * (520 / Math.max(1, points.length - 1))),
      y: 180 - (((point.value - minValue) / range) * 140),
    }));
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

  get allInventoryMedicationOptions(): MedicationModel[] {
    return [...this.allInventoryMedications].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
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

  openAddMedicationModal(): void {
    this.isAddMedicationModalOpen = true;
    this.selectedMedicationId = null;
    this.initialStock = null;
  }

  closeAddMedicationModal(): void {
    this.isAddMedicationModalOpen = false;
  }

  submitAddMedicationToStock(): void {
    if (!this.pharmacyId) {
      this.msg.error('Missing pharmacy id.');
      return;
    }

    if (!this.selectedMedicationId) {
      this.msg.error('Please select a medication.');
      return;
    }

    // Check if medication already exists in stock
    const medicationExists = this.stocks.some(s => s.medication?.id === this.selectedMedicationId);
    if (medicationExists) {
      this.msg.error('This medication already exists in your inventory. Use "Adjust Stock" to modify the quantity.');
      return;
    }

    if (this.initialStock === null || this.initialStock < 0) {
      this.msg.error('Please enter a valid initial quantity (minimum 0).');
      return;
    }

    this.addingMedicationToStock = true;

    this.medicationStockService
      .create({
        quantity: this.initialStock,
        pharmacy: { id: this.pharmacyId },
        medication: { id: this.selectedMedicationId },
      } as any)
      .subscribe({
        next: () => {
          this.addingMedicationToStock = false;
          this.isAddMedicationModalOpen = false;
          this.msg.success('Medication added to pharmacy inventory.');
          this.stockCards?.loadStocks();
        },
        error: (err) => {
          console.error(err);
          this.addingMedicationToStock = false;
          this.msg.error('Failed to add medication to stock.');
        },
      });
  }

  onInitialQuantityChange(value: number | string | null): void {
    if (value === null || value === '') {
      this.initialStock = null;
      return;
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      this.initialStock = null;
      return;
    }

    this.initialStock = Math.max(0, Math.floor(numericValue));
  }

  requestAddNewMedication(): void {
    this.isAddMedicationModalOpen = false;
    if (this.medicationComponent) {
      this.medicationComponent.openRequestMedicationModal();
    }
  }

  selectDay(day: DayOfWeek): void {
    this.selectedDay = day;
    this.loadDaySchedule();
  }

  loadDaySchedule(): void {
    const dayHours = this.workingHours.find(wh => wh.dayOfWeek === this.selectedDay);
    if (dayHours && !dayHours.isClosed) {
      this.currentOpenTime = dayHours.openTime ? this.parseTime(dayHours.openTime) : null;
      this.currentCloseTime = dayHours.closeTime ? this.parseTime(dayHours.closeTime) : null;
    } else {
      this.currentOpenTime = null;
      this.currentCloseTime = null;
    }
  }

  private parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private formatTime(date: Date | null): string | null {
    if (!date) return null;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  loadWorkingHours(): void {
    if (!this.pharmacyId) return;

    this.workingHoursService.getByPharmacy(this.pharmacyId).subscribe({
      next: (hours) => {
        this.workingHours = hours ?? [];
        this.loadDaySchedule();
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.workingHours = [];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
    });
  }

  isDayClosed(day: DayOfWeek): boolean {
    const wh = this.workingHours.find(h => h.dayOfWeek === day);
    return !wh || wh.isClosed || (!wh.openTime && !wh.closeTime);
  }

  getDayOpenTime(day: DayOfWeek): string | null {
    const wh = this.workingHours.find(h => h.dayOfWeek === day);
    return wh && !wh.isClosed ? wh.openTime : null;
  }

  getDayCloseTime(day: DayOfWeek): string | null {
    const wh = this.workingHours.find(h => h.dayOfWeek === day);
    return wh && !wh.isClosed ? wh.closeTime : null;
  }

  deleteDaySchedule(day: DayOfWeek): void {
    const wh = this.workingHours.find(h => h.dayOfWeek === day);
    if (!wh || !wh.id) {
      this.msg.info('No schedule to delete for this day');
      return;
    }

    this.workingHoursService.delete(wh.id).subscribe({
      next: () => {
        this.workingHours = this.workingHours.filter(h => h.dayOfWeek !== day);
        this.msg.success(`Schedule for ${day.charAt(0) + day.slice(1).toLowerCase()} deleted`);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.msg.error('Failed to delete schedule');
        this.cdr.detectChanges();
      },
    });
  }

  submitSchedule(): void {
    if (!this.pharmacyId) {
      this.msg.error('Missing pharmacy information');
      return;
    }

    if (!this.currentOpenTime || !this.currentCloseTime) {
      this.msg.error('Please select opening and closing times');
      return;
    }

    const openTime = this.formatTime(this.currentOpenTime);
    const closeTime = this.formatTime(this.currentCloseTime);

    if (!openTime || !closeTime) {
      this.msg.error('Invalid time format');
      return;
    }

    this.savingSchedule = true;

    const daysToUpdate = this.getDaysToUpdate();
    const updates: any[] = [];

    // Create update operations for selected days only — do NOT touch other days
    daysToUpdate.forEach(day => {
      const existingHours = this.workingHours.find(wh => wh.dayOfWeek === day);
      
      if (existingHours && existingHours.id) {
        // Update existing
        updates.push(
          this.workingHoursService.updateDayWorkingHours(
            this.pharmacyId!,
            day,
            openTime,
            closeTime,
            false
          )
        );
      } else {
        // Create new
        const newHours: any = {
          dayOfWeek: day,
          openTime,
          closeTime,
          isClosed: false,
          pharmacy: { id: this.pharmacyId }
        };
        updates.push(
          this.workingHoursService.create(newHours)
        );
      }
    });

    // Execute all updates
    Promise.all(updates.map(obs => obs.toPromise()))
      .then(() => {
        this.savingSchedule = false;
        this.msg.success('Schedule saved successfully');
        this.loadWorkingHours();
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      })
      .catch(err => {
        console.error(err);
        this.savingSchedule = false;
        this.msg.error('Failed to save schedule');
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      });
  }

  private getDaysToUpdate(): DayOfWeek[] {
    switch (this.scheduleMode) {
      case 'all':
        return this.daysOfWeek.map(d => d.key);
      case 'weekdays':
        return [
          DayOfWeek.MONDAY,
          DayOfWeek.TUESDAY,
          DayOfWeek.WEDNESDAY,
          DayOfWeek.THURSDAY,
          DayOfWeek.FRIDAY
        ];
      case 'weekends':
        return [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY];
      case 'individual':
        return [this.selectedDay];
      default:
        return [];
    }
  }

  loadTransactions(): void {
    if (!this.pharmacyId) return;

    this.transactionService.getByPharmacy(this.pharmacyId).subscribe({
      next: (transactions) => {
        this.transactions = transactions ?? [];
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  loadRatings(): void {
    if (!this.pharmacyId) return;

    this.ratingService.getByPharmacy(this.pharmacyId).subscribe({
      next: (ratings) => {
        this.ratings = ratings ?? [];
        this.ratingPageIndex = 1;
        this.updateRatingDistribution();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.ratings = [];
        this.updateRatingDistribution();
        this.cdr.detectChanges();
      },
    });
  }

  private updateRatingDistribution(): void {
    const distribution = [
      { stars: 5, count: 0, percentage: 0 },
      { stars: 4, count: 0, percentage: 0 },
      { stars: 3, count: 0, percentage: 0 },
      { stars: 2, count: 0, percentage: 0 },
      { stars: 1, count: 0, percentage: 0 },
    ];

    const validRatings = this.ratings
      .map((rating) => Math.round(Number(rating.rating ?? 0)))
      .filter((value) => value > 0 && value <= 5);

    const totalCount = validRatings.length;

    if (totalCount > 0) {
      validRatings.forEach((ratingValue) => {
        const index = 5 - ratingValue;
        if (index >= 0 && index < 5) {
          distribution[index].count++;
        }
      });

      distribution.forEach((item) => {
        item.percentage = (item.count / totalCount) * 100;
      });
    }

    this.ratingDistribution = distribution;
  }

  loadReports(): void {
    if (!this.pharmacyId) return;

    this.reportService.getByPharmacy(this.pharmacyId).subscribe({
      next: (reports) => {
        this.reports = reports ?? [];
        this.reportPageIndex = 1;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.reports = [];
        this.cdr.detectChanges();
      },
    });
  }

  deleteRating(rating: Rating): void {
    if (!rating.id) return;

    this.ratingService.delete(rating.id).subscribe({
      next: () => {
        this.msg.success('Rating deleted');
        this.loadRatings();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.msg.error('Failed to delete rating');
        this.cdr.detectChanges();
      },
    });
  }

  deleteReport(report: Report): void {
    if (!report.id) return;

    this.reportService.delete(report.id).subscribe({
      next: () => {
        this.msg.success('Report deleted');
        this.loadReports();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.msg.error('Failed to delete report');
        this.cdr.detectChanges();
      },
    });
  }

  openTransactionModal(stock: MedicationStock): void {
    this.selectedStock = stock;
    this.transactionQuantity = 0;
    this.transactionType = 'IN';
    this.isTransactionModalOpen = true;
  }

  closeTransactionModal(): void {
    this.isTransactionModalOpen = false;
    this.selectedStock = null;
  }

  incrementQuantity(): void {
    const max = this.transactionType === 'OUT' 
      ? (this.selectedStock?.quantity || 0) 
      : 1000;
    if (this.transactionQuantity < max) {
      this.transactionQuantity++;
    }
  }

  decrementQuantity(): void {
    if (this.transactionQuantity > 0) {
      this.transactionQuantity--;
    }
  }

  submitTransaction(): void {
    if (!this.selectedStock || !this.pharmacyId) {
      this.msg.error('Missing stock or pharmacy information');
      return;
    }

    if (this.transactionQuantity <= 0) {
      this.msg.error('Quantity must be greater than 0');
      return;
    }

    // Check if OUT transaction would exceed current stock
    if (this.transactionType === 'OUT' && this.transactionQuantity > (this.selectedStock.quantity || 0)) {
      this.msg.error(`Cannot remove more than current stock (${this.selectedStock.quantity})`);
      return;
    }

    const medicationId = (this.selectedStock.medication as any)?.id;
    if (!medicationId) {
      this.msg.error('Missing medication information');
      return;
    }

    this.submittingTransaction = true;

    this.transactionService
      .createAndApplyTransaction({
        quantity: this.transactionQuantity,
        type: this.transactionType,
        pharmacy: { id: this.pharmacyId },
        medication: { id: medicationId },
      } as any)
      .subscribe({
        next: () => {
          this.submittingTransaction = false;
          this.isTransactionModalOpen = false;
          this.msg.success('Transaction recorded successfully');
          this.stockCards?.loadStocks();
          this.loadTransactions();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.submittingTransaction = false;
          this.msg.error('Failed to record transaction');
          this.cdr.detectChanges();
        },
      });
  }

  get sortedTransactions(): InventoryTransaction[] {
    return [...this.transactions].sort((a, b) => {
      const dateA = new Date(a.transactionAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.transactionAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  get sortedRatings(): Rating[] {
    // Filter out ratings with 0 value
    return [...this.ratings]
      .filter((rating) => {
        const ratingValue = Number(rating.rating ?? 0);
        return ratingValue > 0;
      })
      .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }

  get paginatedRatings(): Rating[] {
    const start = (this.ratingPageIndex - 1) * this.ratingPageSize;
    return this.sortedRatings.slice(start, start + this.ratingPageSize);
  }

  get sortedReports(): Report[] {
    return [...this.reports].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }

  get paginatedReports(): Report[] {
    const start = (this.reportPageIndex - 1) * this.reportPageSize;
    return this.sortedReports.slice(start, start + this.reportPageSize);
  }

  get averageRating(): number {
    const valid = this.ratings
      .map((rating) => Number(rating.rating ?? 0))
      .filter((value) => value > 0);
    if (valid.length === 0) return 0;
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
  }

  get totalRatingsCount(): number {
    return this.ratings
      .map((rating) => Number(rating.rating ?? 0))
      .filter((value) => value > 0).length;
  }

  get favoritesCount(): number {
    return this.ratings.filter((rating) => !!rating.isFavorite).length;
  }

  formatReportReason(reason?: string | null): string {
    if (!reason) return '—';
    return reason
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  getMedicationName(transaction: InventoryTransaction): string {
    return (transaction.medication as any)?.name || 'Unknown';
  }

  getLogActionText(transaction: InventoryTransaction): string {
    const medicationName = this.getMedicationName(transaction);
    const quantity = transaction.quantity;
    const action = transaction.type === 'IN' ? 'Added' : 'Removed';
    const preposition = transaction.type === 'IN' ? 'to' : 'from';
    
    return `${action} ${quantity} ${preposition} ${medicationName}`;
  }

  getSelectedStockMedicationName(): string {
    return (this.selectedStock?.medication as any)?.name || 'Unknown';
  }

  getHistoryStockMedicationName(): string {
    return (this.selectedHistoryStock?.medication as any)?.name || 'Unknown';
  }
  
  // Validation helper methods
  validateMedicationSelect(): string | null {
    if (!this.selectedMedicationId) {
      return 'Please select a medication';
    }
    const medicationExists = this.stocks.some(s => s.medication?.id === this.selectedMedicationId);
    if (medicationExists) {
      return 'This medication already exists in inventory';
    }
    return null;
  }
  
  validateInitialStock(): string | null {
    if (this.initialStock === null) {
      return 'Please enter a quantity';
    }
    if (this.initialStock < 0) {
      return 'Quantity cannot be negative';
    }
    return null;
  }
  
  validateTransactionQuantity(): string | null {
    if (this.transactionQuantity <= 0) {
      return 'Quantity must be greater than 0';
    }
    if (this.transactionType === 'OUT' && this.transactionQuantity > (this.selectedStock?.quantity || 0)) {
      return `Cannot remove more than current stock (${this.selectedStock?.quantity || 0})`;
    }
    return null;
  }

  openGoogleMaps(): void {
    if (this.pharmacy && this.pharmacy.latitude && this.pharmacy.longitude) {
      const url = `https://www.google.com/maps?q=${this.pharmacy.latitude},${this.pharmacy.longitude}`;
      window.open(url, '_blank');
    }
  }

  goBack(): void {
    this.router.navigate(['/pharmacy']);
  }
}
