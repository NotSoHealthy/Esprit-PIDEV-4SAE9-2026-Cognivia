import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  throwError,
  timeout,
} from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import { ReportEditor } from '../report-editor/report-editor';
import { getSeverityColor } from '../../../shared/utils/patient.utils';

@Component({
  selector: 'app-visit-report-page',
  standalone: true,
  imports: [NzButtonModule, NzTagModule, ReportEditor],
  templateUrl: './visit-report.page.html',
  styleUrl: './visit-report.page.css',
})
export class VisitReportPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  visitId: string | null = null;
  visit: any | null = null;
  visitReport: any | null = null;
  reportContent = '';

  isLoading = false;
  isSaving = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  saveErrorMessage: string | null = null;

  get patientNameForHeader(): string {
    const patientName = this.getPatientName(this.visit);
    return patientName && patientName !== '-' ? patientName : 'Patient';
  }

  get patientSeverity(): string | null {
    const severity = this.visit?.patient?.severity ?? null;
    if (!severity) return null;
    return String(severity);
  }

  get patientSeverityColor(): string {
    return getSeverityColor(this.patientSeverity);
  }

  get headerSubtitle(): string | null {
    if (this.visit) {
      const when = this.getVisitDate(this.visit);
      if (!when) return null;
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(when);
    }

    if (this.isLoading) return 'Loading visit...';
    return null;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((paramMap) => paramMap.get('visitId')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((nextVisitId) => {
        const changed = nextVisitId !== this.visitId;
        this.visitId = nextVisitId;

        if (changed) {
          this.visit = null;
          this.visitReport = null;
          this.reportContent = '';
          this.errorMessage = null;
          this.saveErrorMessage = null;
          this.isLoading = false;
          this.isSaving = false;

          // Ensure UI reflects the reset immediately.
          try {
            this.cdr.detectChanges();
          } catch {
            // ignore
          }
        }

        this.hydrateFromNavigationState();
        this.load();
      });
  }

  goBack(): void {
    // Prefer returning to the previous screen (list/calendar) if possible.
    window.history.back();
  }

  save(): void {
    if (!this.visitId) {
      this.saveErrorMessage = 'Missing visit id.';
      return;
    }
    if (!this.canEdit) {
      return;
    }

    this.isSaving = true;
    this.saveErrorMessage = null;
    try {
      this.cdr.detectChanges();
    } catch {
      // ignore
    }

    const createUrl = `${this.apiBaseUrl}/monitoring/visitreport`;
    const reportId = this.visitReport?.id ?? this.visitReport?.reportId ?? null;
    const payload = this.buildSavePayload(true);

    const save$ = reportId
      ? this.http.put<any>(`${this.apiBaseUrl}/monitoring/visitreport/${reportId}`, payload)
      : this.http.post<any>(createUrl, payload);

    save$
      .pipe(
        catchError((err) => {
          // If we're updating but the report was deleted / not found, fall back to creating it.
          if (reportId && err?.status === 404) {
            return this.http.post<any>(createUrl, payload);
          }

          // Some backends require visitId in the POST body; retry once if we detect that case.
          if (!reportId && this.shouldRetryWithVisitId(err)) {
            return this.http.post<any>(createUrl, this.buildSavePayload(true));
          }

          return throwError(() => err);
        }),
        finalize(() => {
          this.isSaving = false;
          try {
            this.cdr.detectChanges();
          } catch {
            // ignore
          }
        }),
      )
      .subscribe({
        next: (saved) => {
          this.visitReport = saved ?? this.visitReport;
          this.reportContent = this.resolveReportContent(saved) || this.reportContent;
          try {
            this.cdr.detectChanges();
          } catch {
            // ignore
          }
        },
        error: (error) => {
          // eslint-disable-next-line no-console
          console.error('Error saving report:', error);
          this.saveErrorMessage = this.formatHttpError(error) ?? 'Failed to save report.';
          try {
            this.cdr.detectChanges();
          } catch {
            // ignore
          }
        },
      });
  }

  submit(): void {
    if (!this.visitId) {
      this.saveErrorMessage = 'Missing visit id.';
      return;
    }
    if (!this.canEdit || this.isValidated) {
      return;
    }

    this.isSubmitting = true;
    this.saveErrorMessage = null;
    try {
      this.cdr.detectChanges();
    } catch {
      // ignore
    }

    const createUrl = `${this.apiBaseUrl}/monitoring/visitreport`;
    const reportId = this.visitReport?.id ?? this.visitReport?.reportId ?? null;
    const payload = this.buildSavePayload(true, 'VALIDATED');

    const submit$ = reportId
      ? this.http.put<any>(`${this.apiBaseUrl}/monitoring/visitreport/${reportId}`, payload)
      : this.http.post<any>(createUrl, payload);

    submit$
      .pipe(
        catchError((err) => {
          if (reportId && err?.status === 404) {
            return this.http.post<any>(createUrl, payload);
          }

          if (!reportId && this.shouldRetryWithVisitId(err)) {
            return this.http.post<any>(createUrl, this.buildSavePayload(true, 'VALIDATED'));
          }

          return throwError(() => err);
        }),
        finalize(() => {
          this.isSubmitting = false;
          try {
            this.cdr.detectChanges();
          } catch {
            // ignore
          }
        }),
      )
      .subscribe({
        next: (saved) => {
          this.visitReport = saved ?? this.visitReport;
          // Ensure status is reflected even if backend doesn't echo it.
          if (this.visitReport) {
            this.visitReport.status = 'VALIDATED';
          }
          this.reportContent = this.resolveReportContent(saved) || this.reportContent;
          try {
            this.cdr.detectChanges();
          } catch {
            // ignore
          }
        },
        error: (error) => {
          // eslint-disable-next-line no-console
          console.error('Error submitting report:', error);
          this.saveErrorMessage = this.formatHttpError(error) ?? 'Failed to submit report.';
          try {
            this.cdr.detectChanges();
          } catch {
            // ignore
          }
        },
      });
  }

  get canEdit(): boolean {
    if (!this.visit) return false;
    if (this.isValidated) return false;
    if (!this.isScheduledStatus(this.getVisitStatus(this.visit))) return false;
    const when = this.getVisitDate(this.visit);
    if (!when) return false;
    return this.isSameDay(when, new Date());
  }

  get isValidated(): boolean {
    const raw =
      this.visitReport?.status ??
      this.visitReport?.reportStatus ??
      this.visitReport?.state ??
      this.visitReport?.data?.status ??
      null;
    return (
      String(raw ?? '')
        .trim()
        .toUpperCase() === 'VALIDATED'
    );
  }

  private hydrateFromNavigationState(): void {
    const stateVisit = (history.state as any)?.visit;
    if (!stateVisit) return;

    const stateVisitId = this.getVisitId(stateVisit);
    if (this.visitId && stateVisitId === this.visitId) {
      this.visit = stateVisit;
    }
  }

  private load(): void {
    if (!this.visitId) {
      this.errorMessage = 'Missing visit id.';
      this.isLoading = false;
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.saveErrorMessage = null;
    try {
      this.cdr.detectChanges();
    } catch {
      // ignore
    }

    const visit$ = this.http.get<any>(`${this.apiBaseUrl}/care/visit/${this.visitId}`);
    const report$ = this.http
      .get<any>(`${this.apiBaseUrl}/monitoring/visitreport/visit/${this.visitId}`)
      .pipe(
        catchError((err) => {
          // Many backends return 404 when no report exists yet; treat that as empty.
          if (err?.status === 404) return of(null);
          // eslint-disable-next-line no-console
          console.error('Error fetching report:', err);
          return of(null);
        }),
      );

    forkJoin({ visit: visit$, report: report$ })
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.isLoading = false;
          try {
            this.cdr.detectChanges();
          } catch {
            // ignore
          }
        }),
      )
      .subscribe({
        next: ({ visit, report }) => {
          this.visit = visit ?? null;
          if (!this.visit) {
            this.errorMessage = 'Visit not found.';
          }

          this.visitReport = report;
          this.reportContent = this.resolveReportContent(report);
          try {
            this.cdr.detectChanges();
          } catch {
            // ignore
          }
        },
        error: (error) => {
          // eslint-disable-next-line no-console
          console.error('Error fetching visit:', error);
          if (error?.name === 'TimeoutError') {
            this.errorMessage = 'Request timed out while loading the visit report.';
          } else {
            this.errorMessage = error?.message ?? 'Failed to load visit.';
          }
          this.visit = null;
          this.visitReport = null;
          this.reportContent = '';
          try {
            this.cdr.detectChanges();
          } catch {
            // ignore
          }
        },
      });
  }

  private resolveReportContent(report: any): string {
    if (!report) return '';
    const direct =
      report?.content ??
      report?.reportContent ??
      report?.text ??
      report?.description ??
      report?.report ??
      report?.data?.content ??
      report?.data?.reportContent ??
      report?.data?.text ??
      '';
    return String(direct ?? '');
  }

  private getPatientName(visit: any): string {
    if (!visit) return '-';

    const fromPatient = visit?.patient;
    const firstName = fromPatient?.firstName ?? '';
    const lastName = fromPatient?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();

    const fallback =
      visit?.patientName ??
      visit?.patientFullName ??
      visit?.patient?.name ??
      visit?.patient?.fullName ??
      '';

    return fullName || String(fallback || '-');
  }

  private buildSavePayload(includeVisitId: boolean, overrideStatus?: string): any {
    const status =
      overrideStatus ||
      (this.visitReport?.status ?? this.visitReport?.reportStatus ?? this.visitReport?.state) ||
      'DRAFT';

    const base: any = {
      content: this.reportContent ?? '',
      status,
    };

    if (includeVisitId && this.visitId) {
      base.visitId = this.visitId;
    }

    return base;
  }

  private shouldRetryWithVisitId(error: any): boolean {
    const status = error?.status;
    if (status !== 400 && status !== 422) return false;

    const message = String(error?.error?.message ?? error?.error?.error ?? error?.message ?? '')
      .toLowerCase()
      .trim();

    return message.includes('visit') || message.includes('visitid');
  }

  private formatHttpError(error: any): string | null {
    const bodyMessage = error?.error?.message ?? error?.error?.error;
    const msg = bodyMessage ?? error?.message;
    if (!msg) return null;
    return String(msg);
  }

  private getVisitId(visit: any): string {
    const id = visit?.id ?? visit?.visitId;
    if (id === null || id === undefined) return '';
    return String(id);
  }

  private getVisitDate(visit: any): Date | null {
    const raw = visit?.scheduledAt ?? visit?.date ?? visit?.startTime ?? visit?.createdAt;
    return this.toDate(raw);
  }

  private getVisitStatus(visit: any): string {
    return (
      visit?.status ??
      visit?.visitStatus ??
      visit?.state ??
      visit?.visitState ??
      visit?.careStatus ??
      ''
    );
  }

  private isScheduledStatus(status: string): boolean {
    const s = String(status ?? '')
      .trim()
      .toLowerCase();
    return s.includes('pending') || s.includes('planned') || s.includes('scheduled');
  }

  private toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' || typeof value === 'number') {
      // Backend often sends date-only strings (YYYY-MM-DD). Parsing those with
      // `new Date('YYYY-MM-DD')` interprets them as UTC and can shift the day
      // depending on the user's timezone.
      if (typeof value === 'string') {
        const m = value.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
        if (m) {
          const year = Number(m[1]);
          const monthIndex = Number(m[2]) - 1;
          const day = Number(m[3]);
          const local = new Date(year, monthIndex, day);
          return isNaN(local.getTime()) ? null : local;
        }
      }

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
}
