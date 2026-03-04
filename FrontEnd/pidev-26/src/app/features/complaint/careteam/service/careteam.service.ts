import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../../core/api/api.tokens';
import { PatientDoctorAssignmentModel } from '../model/patient-doctor-assignment.model';
import { PatientModel } from '../model/patient.model';

@Injectable({ providedIn: 'root' })
export class CareteamService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getPatientDoctorAssignment(patientId: number): Observable<PatientDoctorAssignmentModel | null> {
    return this.http
      .get<PatientDoctorAssignmentModel>(
        `${this.apiBaseUrl}/care/patientdoctorassignment/patient/${patientId}`,
      )
      .pipe(
        catchError(() => {
          return of(null);
        }),
      );
  }

  getPatientById(patientId: number): Observable<PatientModel> {
    return this.http.get<PatientModel>(`${this.apiBaseUrl}/care/patient/${patientId}`).pipe(
      catchError((error: { status?: number }) => {
        if (error?.status === 404) {
          return of({ id: patientId, userId: '', firstName: '', lastName: '', caregiverList: [] });
        }
        return of({ id: patientId, userId: '', firstName: '', lastName: '', caregiverList: [] });
      }),
    );
  }
}
