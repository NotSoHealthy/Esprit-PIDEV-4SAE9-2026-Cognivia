import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { CurrentUserService } from '../../../core/user/current-user.service';
import { NzCalendarMode, NzCalendarModule } from 'ng-zorro-antd/calendar';
import { FormsModule } from '@angular/forms';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [NzCalendarModule, NzBadgeModule, FormsModule, TitleCasePipe],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly currentUser = inject(CurrentUserService);

  visits: any[] = [];
  calendarMode: NzCalendarMode = 'month';
  calendarDate = new Date();

  isLoading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.fetchVisits();
  }

  fetchVisits(): void {
    this.isLoading = true;
    this.errorMessage = null;
    const caregiverId = (this.currentUser.user() as any)?.data?.id;

    if (!caregiverId) {
      this.visits = [];
      this.isLoading = false;
      this.errorMessage = 'No caregiver profile found for the current user.';
      this.cdr.detectChanges();
      return;
    }

    this.http.get<any>(`${this.apiBaseUrl}/care/visit/caregiver/${caregiverId}`).subscribe({
      next: (response) => {
        const list =
          (Array.isArray(response) && response) ||
          response?.data ||
          response?.items ||
          response?.content ||
          response?.visits ||
          [];

        this.visits = Array.isArray(list) ? list : [];

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching visits:', error);
        this.errorMessage = error?.message ?? 'Failed to load visits.';
        this.visits = [];

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  panelChange(change: { date: Date; mode: string }): void {
    console.log(change.date, change.mode);
  }

  getVisitsForDate(date: Date): any[] {
    const list = Array.isArray(this.visits) ? this.visits : [];
    return list
      .map((visit) => ({ visit, when: this.getVisitDate(visit) }))
      .filter((x) => !!x.when && this.isSameDay(x.when as Date, date))
      .sort((a, b) => (a.when as Date).getTime() - (b.when as Date).getTime())
      .map((x) => x.visit);
  }

  formatVisitForCalendar(visit: any): string {
    const patient = visit?.patient;
    return patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() : 'Visit';
  }

  badgeStatusForVisit(visit: any): 'success' | 'processing' | 'default' | 'warning' | 'error' {
    const s = String(visit?.status ?? '')
      .trim()
      .toLowerCase();

    switch (s) {
      case 'missed':
        return 'error';
      case 'completed':
        return 'success';
      case 'scheduled':
        return 'processing';
      default:
        return 'default';
    }
  }

  private getVisitDate(visit: any): Date | null {
    const raw = visit?.scheduledAt ?? visit?.date ?? visit?.startTime ?? visit?.createdAt;
    return this.toDate(raw);
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

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private formatTime(date: Date): string {
    try {
      return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
        date,
      );
    } catch {
      return date.toLocaleTimeString();
    }
  }
}
