import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { MedicationStockService } from '../services/medication-stock.service';
import { MedicationStock } from '../models/medication-stock.model';

@Component({
  selector: 'app-stock-card',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzPaginationModule,
    NzSpinModule,
    NzEmptyModule,
  ],
  templateUrl: './stock-card.html',
  styleUrl: './stock-card.css',
})
export class StockCard implements OnInit {
  private readonly stockService = inject(MedicationStockService);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  @Input() pharmacyId: number | null = null;
  @Input() searchText = '';
  @Input() therapeuticClassFilter = '';
  @Input() selectedMedicationName = '';
  @Input() outOfStockOnly = false;
  @Output() stocksChange = new EventEmitter<MedicationStock[]>();
  @Output() openTransaction = new EventEmitter<MedicationStock>();
  @Output() openStockHistory = new EventEmitter<MedicationStock>();

  loading = false;
  errorMsg: string | null = null;
  stocks: MedicationStock[] = [];

  pageIndex = 1;
  pageSize = 10;

  ngOnInit(): void {
    if (this.pharmacyId) {
      this.loadStocks();
    }
  }

  loadStocks(): void {
    if (!this.pharmacyId) return;

    this.loading = true;
    this.errorMsg = null;

    this.stockService.getByPharmacy(this.pharmacyId).subscribe({
      next: (stocks) => {
        this.stocks = stocks ?? [];
        this.stocksChange.emit(this.stocks);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Failed to load medication stocks';
        this.loading = false;
      },
    });
  }

  get filteredStocks(): MedicationStock[] {
    let filtered = [...this.stocks];

    // Filter by search text (medication name)
    if (this.searchText) {
      const search = this.searchText.toLowerCase().trim();
      filtered = filtered.filter((stock) =>
        (stock.medication as any)?.name?.toLowerCase().includes(search)
      );
    }

    // Filter by therapeutic class
    if (this.therapeuticClassFilter) {
      filtered = filtered.filter(
        (stock) =>
          (stock.medication as any)?.therapeuticClass === this.therapeuticClassFilter
      );
    }

    // Filter by medication name
    if (this.selectedMedicationName) {
      filtered = filtered.filter(
        (stock) => (stock.medication as any)?.name === this.selectedMedicationName
      );
    }

    // Filter by out of stock
    if (this.outOfStockOnly) {
      filtered = filtered.filter((stock) => stock.quantity === 0);
    }

    return filtered;
  }

  get paginatedStocks(): MedicationStock[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredStocks.slice(start, end);
  }

  get totalFilteredStocks(): number {
    return this.filteredStocks.length;
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
  }

  formatTherapeuticClass(value?: string | null): string {
    if (!value) return '—';
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  deleteStock(stock: MedicationStock, event: Event): void {
    event.stopPropagation();

    this.modal.confirm({
      nzTitle: 'Delete stock record?',
      nzContent: `This will remove ${(stock.medication as any)?.name} from your pharmacy inventory.`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        if (!stock.id) return;

        this.stockService.delete(stock.id).subscribe({
          next: () => {
            this.msg.success('Stock record deleted');
            this.loadStocks();
          },
          error: (err) => {
            console.error(err);
            this.msg.error('Failed to delete stock record');
          },
        });
      },
    });
  }

  openTransactionModal(stock: MedicationStock, event: Event): void {
    event.stopPropagation();
    this.openTransaction.emit(stock);
  }

  openStockHistoryModal(stock: MedicationStock): void {
    this.openStockHistory.emit(stock);
  }

  getMedicationProp(stock: MedicationStock, prop: string): any {
    return (stock.medication as any)?.[prop] || '';
  }
}
