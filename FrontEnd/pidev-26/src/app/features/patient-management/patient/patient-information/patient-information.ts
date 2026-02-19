import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-patient-information',
  imports: [],
  templateUrl: './patient-information.html',
  styleUrl: './patient-information.css',
})
export class PatientInformation {
  @Input() patient: any | null = null;

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
    const first = (this.patient as any)?.firstName?.[0] ?? '';
    const last = (this.patient as any)?.lastName?.[0] ?? '';
    const value = `${first}${last}`.trim();
    return value || 'P';
  }

  display(value: unknown): string {
    if (value === null || value === undefined) return '-';
    const str = String(value).trim();
    return str ? str : '-';
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
