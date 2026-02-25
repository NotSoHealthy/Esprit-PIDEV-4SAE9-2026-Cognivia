import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CurrentUserService } from '../../../core/user/current-user.service';
import { TitleCasePipe } from '@angular/common';

type VisitStatus = string;

@Component({
  selector: 'app-visit-list',
  standalone: true,
  imports: [
    FormsModule,
    NzTableModule,
    NzInputModule,
    NzButtonModule,
    NzDividerModule,
    NzTagModule,
    TitleCasePipe,
  ],
  templateUrl: './visit-list.html',
  styleUrl: './visit-list.css',
})
export class VisitList implements OnChanges {
  @Input() visits: any[] | null = null;

  private readonly currentUser = inject(CurrentUserService);

  filteredVisits: any[] = [];
  searchValue = '';
  statusFilters: Array<{ text: string; value: string }> = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visits']) {
      const list = Array.isArray(this.visits) ? this.visits : [];
      this.statusFilters = this.buildStatusFilters(list);
      this.applySearch();
    }
  }

  resetSearch(): void {
    this.searchValue = '';
    this.applySearch();
  }

  applySearch(): void {
    const list = Array.isArray(this.visits) ? this.visits : [];
    const q = this.normalizeSearch(this.searchValue);
    if (!q) {
      this.filteredVisits = list;
      return;
    }

    this.filteredVisits = list.filter((visit) => {
      const id = this.normalizeSearch(this.getVisitId(visit));
      const when = this.normalizeSearch(this.formatDateTime(this.getVisitDate(visit)));
      const status = this.normalizeSearch(this.getVisitStatus(visit));
      return id.includes(q) || when.includes(q) || status.includes(q);
    });
  }

  readonly sortVisitId = (a: any, b: any): number =>
    this.compareText(this.getVisitId(a), this.getVisitId(b));

  readonly sortVisitDate = (a: any, b: any): number => {
    const left = this.getVisitDate(a)?.getTime() ?? Number.POSITIVE_INFINITY;
    const right = this.getVisitDate(b)?.getTime() ?? Number.POSITIVE_INFINITY;
    return left - right;
  };

  readonly sortVisitStatus = (a: any, b: any): number =>
    this.compareText(this.getVisitStatus(a), this.getVisitStatus(b));

  readonly statusFilterFn = (value: any[] | any, item: any): boolean => {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    if (selected.length === 0) return true;
    const status = this.getVisitStatus(item);
    return status ? selected.includes(status) : false;
  };

  getVisitId(visit: any): string {
    const id = visit?.id ?? visit?.visitId;
    if (id === null || id === undefined) return '-';
    return String(id);
  }

  getVisitDate(visit: any): Date | null {
    const raw = visit?.scheduledAt ?? visit?.date ?? visit?.startTime ?? visit?.createdAt;
    return this.toDate(raw);
  }

  getVisitStatus(visit: any): VisitStatus {
    return (
      visit?.status ??
      visit?.visitStatus ??
      visit?.state ??
      visit?.visitState ??
      visit?.careStatus ??
      ''
    );
  }

  getStatusColor(status: VisitStatus): string {
    const s = this.normalizeSearch(status);
    if (!s) return 'default';
    if (s.includes('cancel')) return 'default';
    if (s.includes('complete') || s.includes('done')) return 'success';
    if (s.includes('pending') || s.includes('planned') || s.includes('scheduled'))
      return 'processing';
    return 'blue';
  }

  formatDateTime(value: unknown): string {
    const d = this.toDate(value);
    if (!d) return '-';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }

  private buildStatusFilters(visits: any[]): Array<{ text: string; value: string }> {
    const unique = new Set<string>();
    for (const visit of visits) {
      const status = String(this.getVisitStatus(visit) ?? '').trim();
      if (status) unique.add(status);
    }

    return Array.from(unique)
      .sort((a, b) => a.localeCompare(b))
      .map((status) => ({ text: status, value: status }));
  }

  private normalizeSearch(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  private compareText(a: unknown, b: unknown): number {
    const left = this.normalizeSearch(a);
    const right = this.normalizeSearch(b);
    return left.localeCompare(right);
  }

  private toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  get currentUserRole(): string | null {
    const user = this.currentUser.user();
    if (!user) return null;
    return this.currentUser.user()?.kind ?? null;
  }

  getCaregiverName(visit: any): string {
    const firstName = visit?.caregiver?.firstName ?? '';
    const lastName = visit?.caregiver?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'Caregiver not assigned';
  }
}
