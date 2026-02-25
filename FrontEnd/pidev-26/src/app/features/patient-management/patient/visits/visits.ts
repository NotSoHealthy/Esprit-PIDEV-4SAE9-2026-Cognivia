import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { API_BASE_URL } from '../../../../core/api/api.tokens';
import { VisitList } from '../../../../shared/components/visit-list/visit-list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { CurrentUserService } from '../../../../core/user/current-user.service';

@Component({
  selector: 'app-visits',
  standalone: true,
  imports: [
    VisitList,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzSelectModule,
    FormsModule,
    TitleCasePipe,
    NzDatePickerModule,
  ],
  templateUrl: './visits.html',
  styleUrl: './visits.css',
})
export class Visits implements OnChanges, OnInit {
  @Input() patientId: string | number | null = null;

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly currentUser = inject(CurrentUserService);

  isVisible = false;
  selectedCaregiver: string | number | null = null;
  selectedVisitDate: Date | null = null;

  isSubmitting = false;
  caregiverTouched = false;
  visitDateTouched = false;
  scheduleErrorMessage: string | null = null;

  visits: any[] = [];
  caregivers: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.fetchCaregivers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId']) {
      const id = this.patientId;
      if (id === null || id === undefined || id === '') {
        this.visits = [];
        this.errorMessage = null;
        this.isLoading = false;
        return;
      }
      this.fetchVisits(String(id));
    }
  }

  fetchVisits(patientId: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.http.get<any>(`${this.apiBaseUrl}/care/visit/patient/${patientId}`).subscribe({
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
        this.visits = [];
        this.isLoading = false;
        this.errorMessage = error?.message ?? 'Failed to load visits.';
        this.cdr.detectChanges();
      },
    });
  }

  fetchCaregivers(): void {
    this.http.get<any>(`${this.apiBaseUrl}/care/caregiver`).subscribe({
      next: (response) => {
        const list =
          (Array.isArray(response) && response) ||
          response?.data ||
          response?.items ||
          response?.content ||
          response?.caregivers ||
          [];

        this.caregivers = Array.isArray(list) ? list : [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.caregivers = [];
        console.error('Error fetching caregivers:', error);
        this.cdr.detectChanges();
      },
    });
  }

  showModal(): void {
    this.caregiverTouched = false;
    this.visitDateTouched = false;
    this.scheduleErrorMessage = null;
    this.isVisible = true;
  }

  handleOk(): void {
    this.caregiverTouched = true;
    this.visitDateTouched = true;
    this.scheduleErrorMessage = null;

    if (!this.patientId) {
      this.scheduleErrorMessage = 'No patient selected.';
      return;
    }

    if (!this.selectedCaregiver || !this.selectedVisitDate) {
      this.scheduleErrorMessage = 'Please select a caregiver and a visit date.';
      return;
    }

    this.isSubmitting = true;
    const patientId = String(this.patientId);
    const whenIso = this.selectedVisitDate.toISOString();
    const userId = (this.currentUser.user()?.data as any)?.id || null;
    const payload = {
      date: whenIso,
      caregiver: {
        id: this.selectedCaregiver,
      },
      patient: {
        id: patientId,
      },
      doctor: {
        id: userId,
      },
    };

    this.http.post(`${this.apiBaseUrl}/care/visit`, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isVisible = false;
        this.selectedCaregiver = null;
        this.selectedVisitDate = null;
        this.fetchVisits(patientId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.scheduleErrorMessage = error?.message ?? 'Failed to schedule visit.';
        this.cdr.detectChanges();
      },
    });
  }

  handleCancel(): void {
    this.isVisible = false;
    this.scheduleErrorMessage = null;
  }

  getCaregiverName(caregiver: any): string {
    const firstName = caregiver?.firstName ?? '';
    const lastName = caregiver?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || '-';
  }
}
