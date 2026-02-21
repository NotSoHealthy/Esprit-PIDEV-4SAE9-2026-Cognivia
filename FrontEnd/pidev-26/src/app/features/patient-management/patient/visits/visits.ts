import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { API_BASE_URL } from '../../../../core/api/api.tokens';
import { VisitList } from '../../../../shared/components/visit-list/visit-list';

@Component({
  selector: 'app-visits',
  standalone: true,
  imports: [VisitList],
  templateUrl: './visits.html',
  styleUrl: './visits.css',
})
export class Visits implements OnChanges {
  @Input() patientId: string | number | null = null;

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly cdr = inject(ChangeDetectorRef);

  visits: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;

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
}
