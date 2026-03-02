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
import { NzMessageService } from 'ng-zorro-antd/message';

import { PharmacyService } from '../services/pharmacy.service';
import { MedicationService } from '../services/medication.service';
import { MedicationStockService } from '../services/medication-stock.service';
import { InventoryTransactionService } from '../services/inventory-transaction.service';
import { WorkingHoursService } from '../services/working-hours.service';
import { Pharmacy } from '../models/pharmacy.model';
import { MedicationModel } from '../models/medication.model';
import { MedicationStock } from '../models/medication-stock.model';
import { InventoryTransaction } from '../models/inventory-transaction.model';
import { DayOfWeek, WorkingHours } from '../models/working-hours.model';
import { StockCard } from './stock-card';

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
    StockCard,
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
  private readonly msg = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('stockCards') stockCards?: StockCard;

  pharmacyId: number | null = null;
  pharmacy: Pharmacy | null = null;
  loading = false;
  errorMsg: string | null = null;

  activeSection: Section = 'overview';

  inventorySearchText = '';
  inventoryTherapeuticClass = '';
  inventoryMedicationName = '';
  inventoryOutOfStockOnly = false;
  inventoryMedications: MedicationModel[] = [];
  allInventoryMedications: MedicationModel[] = [];
  stocks: MedicationStock[] = [];
  transactions: InventoryTransaction[] = [];

  isTransactionModalOpen = false;
  selectedStock: MedicationStock | null = null;
  transactionQuantity = 0;
  transactionType: 'IN' | 'OUT' = 'IN';
  submittingTransaction = false;

  isAddMedicationModalOpen = false;
  selectedMedicationId: number | null = null;
  initialStock: number | null = null;
  addingMedicationToStock = false;

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
    this.loadInventoryCatalog();
    this.loadWorkingHours();
    this.loadTransactions();
  }

  private loadInventoryCatalog(): void {
    this.medicationService.getAll().subscribe({
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

  setSection(section: Section): void {
    this.activeSection = section;
    if (section === 'schedule') {
      this.loadWorkingHours();
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

    if (this.initialStock === null || this.initialStock < 0) {
      this.msg.error('Please enter a valid initial quantity.');
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
    this.msg.info('Please contact an administrator to add new medications to the catalog.');
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
      },
      error: (err) => {
        console.error(err);
        this.workingHours = [];
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

    // Create update operations for selected days
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

    // Set other days as closed if not included
    this.daysOfWeek.forEach(dayObj => {
      if (!daysToUpdate.includes(dayObj.key)) {
        const existingHours = this.workingHours.find(wh => wh.dayOfWeek === dayObj.key);
        
        if (existingHours && existingHours.id && !existingHours.isClosed) {
          // Update to closed
          updates.push(
            this.workingHoursService.updateDayWorkingHours(
              this.pharmacyId!,
              dayObj.key,
              null,
              null,
              true
            )
          );
        } else if (!existingHours) {
          // Create as closed
          const closedHours: any = {
            dayOfWeek: dayObj.key,
            openTime: null,
            closeTime: null,
            isClosed: true,
            pharmacy: { id: this.pharmacyId }
          };
          updates.push(
            this.workingHoursService.create(closedHours)
          );
        }
      }
    });

    // Execute all updates
    Promise.all(updates.map(obs => obs.toPromise()))
      .then(() => {
        this.savingSchedule = false;
        this.msg.success('Schedule saved successfully');
        this.loadWorkingHours();
      })
      .catch(err => {
        console.error(err);
        this.savingSchedule = false;
        this.msg.error('Failed to save schedule');
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
        },
        error: (err) => {
          console.error(err);
          this.submittingTransaction = false;
          this.msg.error('Failed to record transaction');
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

  goBack(): void {
    this.router.navigate(['/pharmacies']);
  }
}
