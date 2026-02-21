import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { CommonModule } from '@angular/common';
import { PatientInformation } from './patient-information/patient-information';
import { Visits } from './visits/visits';

@Component({
  selector: 'app-patient',
  imports: [CommonModule, PatientInformation, Visits],
  templateUrl: './patient.html',
  styleUrl: './patient.css',
})
export class Patient implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly cdr = inject(ChangeDetectorRef);

  activePanel: 'information' | 'visits' | 'prescriptions' | 'test-results' | 'notes' =
    'information';
  patient: any | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  isActive(panel: Patient['activePanel']): boolean {
    return this.activePanel === panel;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const statePatient = (history.state as any)?.patient;

    if (statePatient && (!id || String(statePatient?.id) === String(id))) {
      this.patient = statePatient;
    }

    if (!this.patient && id) {
      this.fetchPatientById(id);
    }
  }

  private fetchPatientById(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.http.get(`${this.apiBaseUrl}/care/patient/${id}`).subscribe({
      next: (data) => {
        this.patient = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.patient = null;
        this.isLoading = false;
        this.errorMessage = error?.message ?? 'Failed to load patient.';
        this.cdr.markForCheck();
      },
    });
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

  get severity(): string | null {
    const p = this.patient as any;
    return p?.severity ?? p?.severityLevel ?? p?.severityStatus ?? null;
  }

  get severityPillClass(): string {
    const s = this.severity;
    const tone =
      (s === 'LOW' && 'bg-green-100 text-green-800') ||
      (s === 'MEDIUM' && 'bg-amber-100 text-amber-800') ||
      (s === 'HIGH' && 'bg-red-100 text-red-800') ||
      (s === 'EXTREME' && 'bg-purple-100 text-purple-800') ||
      'bg-slate-100 text-slate-700';

    return `px-2 py-1 rounded-lg text-xs font-semibold ${tone}`;
  }

  initials(): string {
    const first = (this.patient as any)?.firstName?.[0]?.toUpperCase() ?? '';
    const last = (this.patient as any)?.lastName?.[0]?.toUpperCase() ?? '';
    const value = `${first}${last}`.trim();
    return value || 'P';
  }

  private getAgeYears(dob: Date): number | null {
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age;
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
}
