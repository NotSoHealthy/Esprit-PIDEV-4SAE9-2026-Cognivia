import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { API_BASE_URL } from '../../core/api/api.tokens';
import { CurrentUserService } from '../../core/user/current-user.service';
import { RouterModule } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { compareText, getAgeYears, normalizeSearch } from '../../shared/utils';
import { getSeverityColor, getSeverityRank } from '../../shared/utils/patient.utils';
import { TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

type PatientSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

@Component({
  selector: 'app-patient-list',
  imports: [
    NzCollapseModule,
    NzTagModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    FormsModule,
    RouterModule,
    NzTableModule,
    NzDividerModule,
    NzInputModule,
    TitleCasePipe,
    MatIconModule,
  ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css',
})
export class PatientList implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly currentUser = inject(CurrentUserService);

  protected readonly getAgeYears = getAgeYears;
  protected readonly normalizeSearch = normalizeSearch;
  protected readonly compareText = compareText;
  protected readonly getSeverityRank = getSeverityRank;
  protected readonly getSeverityColor = getSeverityColor;

  patients: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  searchValue = '';

  readonly severityOptions: PatientSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'];
  readonly severityFilters = this.severityOptions.map((severity) => ({
    text: severity,
    value: severity,
  }));

  readonly isUpdatingSeverityByPatientId: Record<string, boolean> = {};

  readonly visitsByPatientId: Record<string, any[]> = {};
  readonly visitsLoadingByPatientId: Record<string, boolean> = {};
  readonly visitsErrorByPatientId: Record<string, string | null> = {};
  readonly isSchedulingVisitByPatientId: Record<string, boolean> = {};

  isUpdatingSeverity(patient: any): boolean {
    const key = this.patientIdKey(patient);
    if (!key) return false;
    return !!this.isUpdatingSeverityByPatientId[key];
  }

  private patientIdKey(patient: any): string | null {
    const id = patient?.id;
    if (id === null || id === undefined) return null;
    return String(id);
  }

  onPatientPanelActiveChange(patient: any, isActive: boolean): void {
    if (!isActive) return;

    const key = this.patientIdKey(patient);
    if (!key) return;

    if (this.visitsLoadingByPatientId[key]) return;
    if (this.visitsByPatientId[key]) return;

    this.fetchVisitsForPatient(patient);
  }

  ngOnInit(): void {
    this.fetchPatients();
  }

  get searchedPatients(): any[] {
    const q = this.normalizeSearch(this.searchValue);
    if (!q) return this.patients;

    return this.patients.filter((patient) => {
      const firstName = this.normalizeSearch(patient?.firstName);
      const lastName = this.normalizeSearch(patient?.lastName);
      const id = String(patient?.id ?? '');
      return firstName.includes(q) || lastName.includes(q) || id.includes(q);
    });
  }

  readonly sortFirstName = (a: any, b: any): number => this.compareText(a?.firstName, b?.firstName);

  readonly sortLastName = (a: any, b: any): number => this.compareText(a?.lastName, b?.lastName);

  readonly sortAge = (a: any, b: any): number => this.getAgeValue(a) - this.getAgeValue(b);

  readonly sortGender = (a: any, b: any): number => this.compareText(a?.gender, b?.gender);

  readonly sortId = (a: any, b: any): number => {
    const idA = a?.id;
    const idB = b?.id;
    if (idA === null || idA === undefined) return 1;
    if (idB === null || idB === undefined) return -1;
    return String(idA).localeCompare(String(idB), undefined, { numeric: true });
  };

  readonly sortSeverity = (a: any, b: any): number =>
    this.getSeverityRank(a) - this.getSeverityRank(b);

  readonly severityFilterFn = (value: any[] | any, item: any): boolean => {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    if (selected.length === 0) return true;

    const severity = item?.severity;
    return severity !== null && selected.includes(severity);
  };

  fetchPatients(): void {
    const doctorId = (this.currentUser.user() as any)?.data?.id;
    if (!doctorId) {
      console.warn('PatientList: doctorId is undefined, skipping fetch');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.http.get<any>(`${this.apiBaseUrl}/care/patient`).subscribe({
      next: (response) => {
        const list =
          (Array.isArray(response) && response) ||
          response?.data ||
          response?.items ||
          response?.content ||
          response?.patients ||
          [];

        this.patients = Array.isArray(list) ? list : [];
        console.log('Fetched patients:', this.patients);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching patients:', error);
        this.errorMessage = error?.message ?? 'Failed to load patients.';
        this.patients = [];

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log(this.patientCountBySeverity);
      },
    });
  }

  updateSeverity(patient: any, severity: PatientSeverity): void {
    const patientId = patient?.id;
    if (!patientId) {
      this.errorMessage = 'Cannot update severity: missing patient id.';
      return;
    }

    const key = String(patientId);
    this.isUpdatingSeverityByPatientId[key] = true;
    this.errorMessage = null;

    this.http
      .put(`${this.apiBaseUrl}/care/patient/severity/${patientId}`, null, {
        params: {
          severity,
        },
      })
      .subscribe({
        next: () => {
          patient.severity = severity;
          this.isUpdatingSeverityByPatientId[key] = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error?.message ?? 'Failed to update severity.';
          this.isUpdatingSeverityByPatientId[key] = false;
          this.cdr.detectChanges();
        },
      });
  }

  fetchVisitsForPatient(patient: any): void {
    const key = this.patientIdKey(patient);
    if (!key) return;

    this.visitsLoadingByPatientId[key] = true;
    this.visitsErrorByPatientId[key] = null;

    this.http.get<any>(`${this.apiBaseUrl}/care/visit/patient/${key}`).subscribe({
      next: (response) => {
        const list =
          (Array.isArray(response) && response) ||
          response?.data ||
          response?.items ||
          response?.content ||
          response?.visits ||
          [];

        this.visitsByPatientId[key] = Array.isArray(list) ? list : [];
        this.visitsLoadingByPatientId[key] = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.visitsByPatientId[key] = [];
        this.visitsLoadingByPatientId[key] = false;
        this.visitsErrorByPatientId[key] = error?.message ?? 'Failed to load visits.';
        this.cdr.detectChanges();
      },
    });
  }

  scheduleVisit(patient: any): void {
    const key = this.patientIdKey(patient);
    if (!key) return;

    this.isSchedulingVisitByPatientId[key] = true;
    this.visitsErrorByPatientId[key] = null;

    this.http.post(`${this.apiBaseUrl}/care/visit/patient/${key}`, null).subscribe({
      next: () => {
        this.isSchedulingVisitByPatientId[key] = false;
        this.fetchVisitsForPatient(patient);
      },
      error: (error) => {
        this.isSchedulingVisitByPatientId[key] = false;
        this.visitsErrorByPatientId[key] = error?.message ?? 'Failed to schedule visit.';
        this.cdr.detectChanges();
      },
    });
  }

  getVisits(patient: any): any[] {
    const key = this.patientIdKey(patient);
    if (!key) return [];
    return this.visitsByPatientId[key] ?? [];
  }

  isVisitsLoading(patient: any): boolean {
    const key = this.patientIdKey(patient);
    if (!key) return false;
    return !!this.visitsLoadingByPatientId[key];
  }

  getVisitsError(patient: any): string | null {
    const key = this.patientIdKey(patient);
    if (!key) return null;
    return this.visitsErrorByPatientId[key] ?? null;
  }

  isSchedulingVisit(patient: any): boolean {
    const key = this.patientIdKey(patient);
    if (!key) return false;
    return !!this.isSchedulingVisitByPatientId[key];
  }

  formatVisit(visit: any): string {
    const id = visit?.id ?? visit?.visitId;
    const when = visit?.scheduledAt ?? visit?.date ?? visit?.startTime ?? visit?.createdAt;
    const formattedWhen = this.formatDateTime(when);
    if (id && formattedWhen) return `#${id} • ${formattedWhen}`;
    if (id) return `#${id}`;
    if (formattedWhen) return formattedWhen;
    return 'Visit';
  }

  private formatDateTime(value: unknown): string {
    const d = this.toDate(value);
    if (!d) return '';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }

  formatDobWithAge(dateOfBirth: unknown): string {
    const dob = this.toDate(dateOfBirth);
    if (!dob) return typeof dateOfBirth === 'string' ? dateOfBirth : '-';

    const age = this.getAgeYears(dob);

    let formattedDob = '';
    try {
      formattedDob = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(dob);
    } catch {
      formattedDob = dob.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    }

    if (age === null) return formattedDob;
    return `${formattedDob} (${age} y.o.)`;
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

  private getAgeValue(patient: any): number {
    const dob = this.toDate(patient?.dateOfBirth);
    if (!dob) return Number.POSITIVE_INFINITY;
    const age = this.getAgeYears(dob);
    if (age === null) return Number.POSITIVE_INFINITY;
    return age;
  }

  get currentUserRole(): string | null {
    const user = this.currentUser.user();
    if (!user) return null;
    return this.currentUser.user()?.kind ?? null;
  }

  get patientCountBySeverity(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const patient of this.patients) {
      const severity = patient?.severity ?? 'UNKNOWN';
      counts[severity] = (counts[severity] ?? 0) + 1;
    }
    return counts;
  }
}
